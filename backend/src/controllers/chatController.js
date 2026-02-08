import crypto from 'node:crypto';
import Eleve from '../models/Eleve.js';
import Formation from '../models/Formation.js';
import Seance from '../models/Seance.js';
import Presence from '../models/Presence.js';
import User from '../models/User.js';

// Simple in-memory cache + rate limit (single-node dev/prod). If you run multiple instances,
// replace with Redis.
const CHAT_CACHE_TTL_MS = 5 * 60 * 1000;
const chatCache = new Map(); // key -> { ts, reply }

const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX_PER_MINUTE = 12;
const RATE_MIN_GAP_MS = 1500;
const rateState = new Map(); // key -> { windowStart, count, lastAt }

function sha256(text) {
    return crypto.createHash('sha256').update(String(text || '')).digest('hex');
}

function safeString(value, max = 200) {
    return String(value ?? '').replaceAll(/\s+/g, ' ').trim().slice(0, max);
}

function getRateKey(req) {
    const userId = req?.user?._id ? String(req.user._id) : '';
    if (userId) return `user:${userId}`;
    // fallback: IP
    const ip = (req.headers['x-forwarded-for'] || req.ip || '').toString().split(',')[0].trim();
    return `ip:${ip || 'unknown'}`;
}

function checkRateLimit(req) {
    const key = getRateKey(req);
    const now = Date.now();
    const cur = rateState.get(key) || { windowStart: now, count: 0, lastAt: 0 };

    if (now - cur.windowStart > RATE_WINDOW_MS) {
        cur.windowStart = now;
        cur.count = 0;
    }

    if (cur.lastAt && now - cur.lastAt < RATE_MIN_GAP_MS) {
        return { ok: false, message: 'Trop de messages envoyés. Attendez 1–2 secondes puis réessayez.' };
    }

    if (cur.count >= RATE_MAX_PER_MINUTE) {
        return { ok: false, message: 'Limite atteinte (trop de requêtes). Réessayez dans une minute.' };
    }

    cur.count += 1;
    cur.lastAt = now;
    rateState.set(key, cur);
    return { ok: true };
}
function formatDate(value) {
    try {
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '';
        return d.toISOString().slice(0, 10);
    } catch {
        return '';
    }
}

function startOfLocalDay(date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function endOfLocalDay(date = new Date()) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}

const PREDEFINED_QUESTIONS = [
    {
        id: 'db_overview',
        title: 'Aperçu de la base (totaux)',
        category: 'Général',
        description: 'Affiche les totaux (élèves, formations, séances, présences, utilisateurs).',
        handler: async () => {
            const [eleves, formations, seances, presences, users] = await Promise.all([
                Eleve.estimatedDocumentCount(),
                Formation.estimatedDocumentCount(),
                Seance.estimatedDocumentCount(),
                Presence.estimatedDocumentCount(),
                User.estimatedDocumentCount(),
            ]);
            return (
                'Totaux: ' +
                eleves +
                ' élèves, ' +
                formations +
                ' formations, ' +
                seances +
                ' séances, ' +
                presences +
                ' présences, ' +
                users +
                ' utilisateurs.'
            );
        },
    },
    {
        id: 'list_formations',
        title: 'Lister les formations',
        category: 'Formations',
        description: 'Affiche les 10 dernières formations.',
        handler: async () => {
            const formations = await Formation.find({}).sort({ createdAt: -1 }).limit(10).select('nom actif createdAt').lean();
            if (!formations.length) return "Aucune formation trouvée.";
            return (
                'Formations (max 10):\n' +
                formations
                    .map((f, i) => {
                        const nom = safeString(f?.nom, 80);
                        let suffix = '';
                        if (typeof f?.actif === 'boolean') {
                            if (f.actif) suffix = ' (active)';
                            else suffix = ' (inactive)';
                        }
                        return String(i + 1) + '. ' + nom + suffix;
                    })
                    .join('\n')
            );
        },
    },
    {
        id: 'list_eleves',
        title: 'Lister les élèves',
        category: 'Élèves',
        description: 'Affiche les 10 derniers élèves.',
        handler: async () => {
            const eleves = await Eleve.find({}).sort({ createdAt: -1 }).limit(10).select('nom prenom actif createdAt').lean();
            if (!eleves.length) return "Aucun élève trouvé.";
            return (
                'Élèves (max 10):\n' +
                eleves
                    .map((e, i) => {
                        const full = (safeString(e?.nom, 60) + ' ' + safeString(e?.prenom, 60)).trim();
                        let actif = '';
                        if (typeof e?.actif === 'boolean') {
                            if (e.actif) actif = ' (actif)';
                            else actif = ' (inactif)';
                        }
                        return String(i + 1) + '. ' + (full || '(sans nom)') + actif;
                    })
                    .join('\n')
            );
        },
    },
    {
        id: 'today_seances',
        title: "Séances d'aujourd'hui",
        category: 'Séances',
        description: "Affiche les séances prévues aujourd'hui.",
        handler: async () => {
            const start = startOfLocalDay();
            const end = endOfLocalDay();
            const seances = await Seance.find({ date: { $gte: start, $lte: end } })
                .sort({ heure_debut: 1, createdAt: -1 })
                .limit(10)
                .select('nom date heure_debut heure_fin lieu statut type')
                .lean();
            if (!seances.length) return "Aucune séance prévue aujourd'hui.";
            return (
                'Séances du ' + formatDate(new Date()) + ' (max 10):\n' +
                seances
                    .map((s, i) => {
                        const nom = safeString(s?.nom, 80) || '(sans nom)';
                        const lieu = safeString(s?.lieu, 60);
                        const h1 = safeString(s?.heure_debut, 10);
                        const h2 = safeString(s?.heure_fin, 10);
                        const time = [h1, h2].filter(Boolean).join('–');
                        let timeSuffix = '';
                        if (time) timeSuffix = ' (' + time + ')';
                        let lieuSuffix = '';
                        if (lieu) lieuSuffix = ' - ' + lieu;
                        return String(i + 1) + '. ' + nom + timeSuffix + lieuSuffix;
                    })
                    .join('\n')
            );
        },
    },
    {
        id: 'presence_stats_30d',
        title: 'Statistiques de présence (30 jours)',
        category: 'Présences',
        description: 'Résumé des statuts de présence sur 30 jours.',
        handler: async () => {
            const since = new Date();
            since.setDate(since.getDate() - 30);
            const rows = await Presence.aggregate([
                { $match: { createdAt: { $gte: since } } },
                { $group: { _id: '$statut', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]);
            if (!rows.length) return 'Aucune présence trouvée sur les 30 derniers jours.';
            return (
                'Présences (30 jours):\n' +
                rows.map((r) => `- ${safeString(r?._id || 'inconnu', 40)}: ${r.count}`).join('\n')
            );
        },
    },
    {
        id: 'my_profile',
        title: 'Mon profil (compte connecté)',
        category: 'Compte',
        description: 'Affiche le nom, prénom et rôle du compte connecté.',
        handler: async (req) => {
            const u = req.user;
            return `Connecté en tant que: ${safeString(u?.nom, 60)} ${safeString(u?.prenom, 60)} (${safeString(u?.role, 40) || 'role inconnu'})`;
        },
    },
];

const QUESTION_MAP = new Map(PREDEFINED_QUESTIONS.map((q) => [q.id, q]));

export const getChatQuestions = async (req, res) => {
    // Protected route: returns only titles and ids.
    return res.status(200).json({
        success: true,
        questions: PREDEFINED_QUESTIONS.map((q) => ({
            id: q.id,
            title: q.title,
            category: q.category || 'Autre',
            description: q.description || '',
        })),
    });
};

export const chat = async (req, res) => {
    try {
        const rl = checkRateLimit(req);
        if (!rl.ok) {
            return res.status(429).json({ success: false, message: rl.message });
        }

        const { questionId } = req.body || {};
        if (!questionId || typeof questionId !== 'string') {
            return res.status(400).json({
                success: false,
                message: "Veuillez choisir une question prédéfinie.",
                questions: PREDEFINED_QUESTIONS.map((q) => ({ id: q.id, title: q.title })),
            });
        }

        const question = QUESTION_MAP.get(questionId);
        if (!question) {
            return res.status(400).json({
                success: false,
                message: 'Question inconnue.',
                questions: PREDEFINED_QUESTIONS.map((q) => ({ id: q.id, title: q.title })),
            });
        }

        const cacheKey = sha256(`${questionId}|${req?.user?._id || ''}`);
        const cached = chatCache.get(cacheKey);
        if (cached && Date.now() - cached.ts < CHAT_CACHE_TTL_MS) {
            return res.status(200).json({
                success: true,
                reply: cached.reply,
                meta: { cached: true, predefined: true, questionId },
            });
        }

        const reply = await question.handler(req);
        const finalReply = safeString(reply, 8000) || "Désolé, je n'ai pas de réponse.";
        chatCache.set(cacheKey, { ts: Date.now(), reply: finalReply });

        return res.status(200).json({
            success: true,
            reply: finalReply,
            meta: { predefined: true, questionId },
        });
    } catch (error) {
        console.error('Chat error:', error);
        return res.status(500).json({
            success: false,
            message: safeString(error?.message || "Désolé, le chatbot est indisponible pour le moment.", 300),
        });
    }
};
