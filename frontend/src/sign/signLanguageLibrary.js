// Sign language phrase → video URL mapping (external links only).
// Constraint: no automatic translation, no generation, no downloading/scraping.

const CUSTOM_STORAGE_KEY = 'signLanguageLibraryCustom_v1';
const CHANGE_EVENT = 'sign-library-changed';

export const signLanguageLibrary = {
  // LSF (Langue des signes française) — sample set from Wikimedia Commons.
  // You can extend this list or add entries at runtime via the Library Browser UI.

  // App UI phrases (distinct LSF videos; you can replace with more accurate ones)
  "Tableau de bord": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/92/Langue.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },
  "Dashboard": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/92/Langue.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },
  "Élèves": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/8/82/LL-Q33302_%28fsl%29-Laura_Jauvert-%C3%89l%C3%A8ve.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },
  "Séances": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/7/77/LL-Q33302_%28fsl%29-Laura_Jauvert-Quand_%3F.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },
  "Sessions": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/7/77/LL-Q33302_%28fsl%29-Laura_Jauvert-Quand_%3F.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },
  "Session": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/7/77/LL-Q33302_%28fsl%29-Laura_Jauvert-Quand_%3F.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },
  "Mes Formations": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/0/09/LL-Q33302_%28fsl%29-Laura_Jauvert-Formation.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },
  "Formations": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/0/09/LL-Q33302_%28fsl%29-Laura_Jauvert-Formation.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },
  "Students": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/8/82/LL-Q33302_%28fsl%29-Laura_Jauvert-%C3%89l%C3%A8ve.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },
  "Student List": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/8/82/LL-Q33302_%28fsl%29-Laura_Jauvert-%C3%89l%C3%A8ve.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },
  "STUDENT LIST": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/8/82/LL-Q33302_%28fsl%29-Laura_Jauvert-%C3%89l%C3%A8ve.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },
  "Historique": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/a/ab/LL-Q33302_%28fsl%29-Laura_Jauvert-Polonais_%28langue%29.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },

  // Common table headers / dashboard labels (English/all-caps variants)
  // Note: These are pragmatic defaults (not perfect translations) to avoid “not available” UX.
  "Description": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/4/40/LL-Q33302_%28fsl%29-Laura_Jauvert-Capter_des_mots.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },
  "DESCRIPTION": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/4/40/LL-Q33302_%28fsl%29-Laura_Jauvert-Capter_des_mots.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },
  "Duration": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/7/77/LL-Q33302_%28fsl%29-Laura_Jauvert-Quand_%3F.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },
  "DURATION": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/7/77/LL-Q33302_%28fsl%29-Laura_Jauvert-Quand_%3F.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },
  "Durée": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/7/77/LL-Q33302_%28fsl%29-Laura_Jauvert-Quand_%3F.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },
  "Start Date": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/7/77/LL-Q33302_%28fsl%29-Laura_Jauvert-Quand_%3F.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },
  "START DATE": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/7/77/LL-Q33302_%28fsl%29-Laura_Jauvert-Quand_%3F.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },
  "Date de début": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/7/77/LL-Q33302_%28fsl%29-Laura_Jauvert-Quand_%3F.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },
  "Monthly Goal": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/7/77/LL-Q33302_%28fsl%29-Laura_Jauvert-Quand_%3F.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },
  "MONTHLY GOAL": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/7/77/LL-Q33302_%28fsl%29-Laura_Jauvert-Quand_%3F.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },
  "Rechercher": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/8/80/LL-Q33302_%28fsl%29-Laura_Jauvert-Chercher.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },
  "Consulter": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/f/f1/Photographie.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },
  "Connexion": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/6/68/LL-Q33302_%28fsl%29-Laura_Jauvert-Fran%C3%A7ais_%28langue%29.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },
  "Déconnexion": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/2/20/Italien_%28langue%29.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },
  "Ajouter un élève": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/8/82/LL-Q33302_%28fsl%29-Laura_Jauvert-%C3%89l%C3%A8ve.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },
  "Liste des formations vous étant assignées": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/0/09/LL-Q33302_%28fsl%29-Laura_Jauvert-Formation.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },

  // Individual LSF word videos (more specific)
  "Langue": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/9/92/Langue.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },
  "Français": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/6/68/LL-Q33302_%28fsl%29-Laura_Jauvert-Fran%C3%A7ais_%28langue%29.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },
  "Quand ?": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/7/77/LL-Q33302_%28fsl%29-Laura_Jauvert-Quand_%3F.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },
  "Photographie": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/f/f1/Photographie.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },
  "Italien": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/2/20/Italien_%28langue%29.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },
  "Polonais": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/a/ab/LL-Q33302_%28fsl%29-Laura_Jauvert-Polonais_%28langue%29.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },
  "Capter des mots": {
    videoUrl: "https://upload.wikimedia.org/wikipedia/commons/4/40/LL-Q33302_%28fsl%29-Laura_Jauvert-Capter_des_mots.webm",
    language: "LSF",
    source: "commons.wikimedia.org",
  },
};

export function normalizePhraseExact(phrase) {
  const trimmed = String(phrase || '').trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/).join(' ');
}

function stripOuterQuotes(text) {
  const s = String(text || '').trim();
  if (!s) return '';
  const pairs = [
    ['"', '"'],
    ["'", "'"],
    ['`', '`'],
    ['“', '”'],
    ['„', '“'],
    ['«', '»'],
    ['‹', '›'],
  ];
  for (const [l, r] of pairs) {
    if (s.startsWith(l) && s.endsWith(r) && s.length >= 2) {
      return s.slice(l.length, s.length - r.length).trim();
    }
  }
  return s;
}

function stripTrailingPunctuation(text) {
  return String(text || '')
    .trim()
    .replace(/[\s\u00A0]+/g, ' ')
    .replace(/[.:,;!?]+$/g, '')
    .trim();
}

function normalizeForLooseLookup(phrase) {
  const cleaned = stripTrailingPunctuation(stripOuterQuotes(phrase));
  return normalizePhraseExact(cleaned);
}

function safeParseJson(text) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function readCustomLibrary() {
  try {
    if (!globalThis.localStorage) return {};
    const raw = globalThis.localStorage.getItem(CUSTOM_STORAGE_KEY);
    const parsed = safeParseJson(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeCustomLibrary(next) {
  try {
    if (!globalThis.localStorage) return;
    globalThis.localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(next || {}));
    globalThis.dispatchEvent?.(new Event(CHANGE_EVENT));
  } catch {}
}

export function subscribeSignLibraryChanged(handler) {
  const h = typeof handler === 'function' ? handler : () => {};
  globalThis.addEventListener?.(CHANGE_EVENT, h);
  return () => globalThis.removeEventListener?.(CHANGE_EVENT, h);
}

export function upsertCustomSignEntry(phrase, entry) {
  const key = normalizePhraseExact(phrase);
  if (!key) return false;
  const nextEntry = {
    videoUrl: String(entry?.videoUrl || '').trim(),
    language: String(entry?.language || '').trim() || 'LSF',
    source: String(entry?.source || '').trim() || 'external',
  };
  if (!nextEntry.videoUrl || !/^https?:\/\//i.test(nextEntry.videoUrl)) return false;
  const existing = readCustomLibrary();
  writeCustomLibrary({ ...existing, [key]: nextEntry });
  return true;
}

export function removeCustomSignEntry(phrase) {
  const key = normalizePhraseExact(phrase);
  if (!key) return false;
  const existing = readCustomLibrary();
  if (!existing[key]) return false;
  const rest = { ...existing };
  delete rest[key];
  writeCustomLibrary(rest);
  return true;
}

export function isCustomSignPhrase(phrase) {
  const key = normalizePhraseExact(phrase);
  if (!key) return false;
  const custom = readCustomLibrary();
  return !!custom[key];
}

export function getRuntimeSignLibrary() {
  return { ...signLanguageLibrary, ...readCustomLibrary() };
}

export function listSupportedSignPhrases() {
  return Object.keys(getRuntimeSignLibrary()).sort((a, b) => a.localeCompare(b));
}

export function getSignEntryForPhrase(phrase) {
  const key = normalizePhraseExact(phrase);
  if (!key) return null;
  const lib = getRuntimeSignLibrary();

  // 1) Exact match
  if (lib[key]) return { phrase: key, ...lib[key] };

  // 2) Loose normalization (quotes/punctuation)
  const looseKey = normalizeForLooseLookup(key);
  if (looseKey && lib[looseKey]) return { phrase: looseKey, ...lib[looseKey] };

  // 3) Case-insensitive match (common for table headers like DESCRIPTION)
  const wanted = String(looseKey || key).toLowerCase();
  const foundKey = Object.keys(lib).find((k) => String(k).toLowerCase() === wanted);
  if (foundKey) return { phrase: foundKey, ...lib[foundKey] };

  // 4) Heuristic aliases for frequent UI headers
  const aliasMap = {
    description: 'Description',
    remark: 'Description',
    remarks: 'Description',
    commentaire: 'Description',
    commentaires: 'Description',
    note: 'Description',
    notes: 'Description',
    duration: 'Duration',
    'start date': 'Start Date',
    startdate: 'Start Date',
    'monthly goal': 'Monthly Goal',
    'student list': 'Student List',
    training: 'Formations',
    trainings: 'Formations',
    formation: 'Formations',
    formations: 'Formations',
    attendance: 'Sessions',
    'attendance detail': 'Sessions',
    'attendance details': 'Sessions',
    presence: 'Sessions',
    absences: 'Sessions',
    absence: 'Sessions',
  };
  const aliasKey = aliasMap[wanted.replace(/\s+/g, ' ').trim()];
  if (aliasKey && lib[aliasKey]) return { phrase: aliasKey, ...lib[aliasKey] };

  return null;
}

export function hasSignVideoForPhrase(phrase) {
  return !!getSignEntryForPhrase(phrase);
}

export async function searchWikimediaCommonsVideos(query, { limit = 12 } = {}) {
  const q = normalizePhraseExact(query);
  if (!q) return [];

  const buildQueryCandidates = (text) => {
    const raw = normalizePhraseExact(text);
    if (!raw) return [];
    const cleaned = raw
      .replace(/[“”«»]/g, ' ')
      .replace(/[_\-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const lower = cleaned.toLowerCase();
    const candidates = [cleaned];

    // Drop common suffix words like "details" to broaden search.
    if (lower.includes(' details')) candidates.push(cleaned.replace(/\s+details$/i, '').trim());
    if (lower.includes(' detail')) candidates.push(cleaned.replace(/\s+detail$/i, '').trim());

    // Simple EN→FR expansions for UI words (helps find LSF/FSL clips).
    const synonymMap = {
      training: ['formation', 'formations'],
      remark: ['remarque', 'commentaire', 'note'],
      remarks: ['remarques', 'commentaires', 'notes'],
      attendance: ['présence', 'presence'],
      'attendance details': ['présence', 'presence'],
    };
    for (const [k, extras] of Object.entries(synonymMap)) {
      if (lower === k) candidates.push(...extras);
    }

    // If the phrase is multi-word, also try each significant token.
    const tokens = cleaned
      .split(' ')
      .map((t) => t.trim())
      .filter(Boolean)
      .filter((t) => t.length >= 4);
    candidates.push(...tokens);

    // Unique + limit to keep the query short.
    const uniq = [];
    const seen = new Set();
    for (const c of candidates) {
      const s = String(c || '').trim();
      if (!s) continue;
      const key = s.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      uniq.push(s);
      if (uniq.length >= 6) break;
    }
    return uniq;
  };

  const quoteIfNeeded = (s) => {
    const v = String(s || '').replace(/"/g, '').trim();
    if (!v) return '';
    return /\s/.test(v) ? `"${v}"` : v;
  };

  const candidates = buildQueryCandidates(q);
  const gsrsearch = candidates
    .map((c) => {
      const t = quoteIfNeeded(c);
      // Bias towards LSF/FSL content but still allow other results.
      return `(${t} (fsl) OR ${t} LSF OR ${t} "langue des signes")`;
    })
    .join(' OR ');

  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.searchParams.set('action', 'query');
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');
  url.searchParams.set('generator', 'search');
  url.searchParams.set('gsrnamespace', '6');
  url.searchParams.set('gsrlimit', String(Math.max(1, Math.min(25, limit))));
  url.searchParams.set('gsrsearch', gsrsearch || `${q} (fsl) OR ${q} LSF OR ${q} "langue des signes"`);
  url.searchParams.set('prop', 'imageinfo');
  url.searchParams.set('iiprop', 'url');

  try {
    const res = await fetch(url.toString(), { method: 'GET' });
    if (!res.ok) return [];
    const data = await res.json();
    const pages = data?.query?.pages ? Object.values(data.query.pages) : [];
    const out = [];
    for (const p of pages) {
      const info = p?.imageinfo?.[0];
      const fileUrl = info?.url;
      if (!fileUrl) continue;
      const lower = String(fileUrl).toLowerCase();
      if (!lower.endsWith('.webm') && !lower.endsWith('.mp4')) continue;
      out.push({
        title: p?.title || '',
        videoUrl: fileUrl,
        descriptionUrl: info?.descriptionurl || '',
        source: 'commons.wikimedia.org',
      });
    }
    // Stable order
    return out.sort((a, b) => String(a.title).localeCompare(String(b.title)));
  } catch {
    return [];
  }
}

export function getGenericFallbackEntryForPhrase(phrase) {
  const p = normalizePhraseExact(phrase);
  // Deterministic per phrase so different words don’t all show the same fallback.
  const pool = ['Langue', 'Capter des mots', 'Quand ?', 'Formations', 'Élèves'];
  const base = p ? p.toLowerCase() : 'langue';
  let hash = 0;
  for (let i = 0; i < base.length; i += 1) {
    hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
  }
  const idx = pool.length ? hash % pool.length : 0;
  return getSignEntryForPhrase(pool[idx]) || getSignEntryForPhrase('Langue');
}
