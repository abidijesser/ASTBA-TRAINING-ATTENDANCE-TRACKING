import Eleve from '../models/Eleve.js';
import EleveFormation from '../models/EleveFormation.js';
import Formation from '../models/Formation.js';
import Seance from '../models/Seance.js';
import Certification from '../models/Certification.js';
import Presence from '../models/Presence.js';
import mongoose from 'mongoose';

function toObjectIdMaybe(value) {
    try {
        if (!value) return null;
        const str = String(value);
        return mongoose.Types.ObjectId.isValid(str) ? new mongoose.Types.ObjectId(str) : null;
    } catch {
        return null;
    }
}

function idVariants(value) {
    const str = value == null ? null : String(value);
    const objId = toObjectIdMaybe(value);
    return [objId, str].filter(Boolean);
}

function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function endOfDay(date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}

function startOfMonth(date) {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
}

function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function monthKey(date) {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
}

function listLastMonths(endDate, monthsCount) {
    const end = startOfMonth(endDate);
    const months = [];
    for (let i = monthsCount - 1; i >= 0; i -= 1) {
        const d = new Date(end);
        d.setMonth(d.getMonth() - i);
        months.push(monthKey(d));
    }
    return months;
}

async function getScopedFormationIds(user) {
    // Admin + Responsable: global visibility on dashboard analytics.
    // (In many deployments the dashboard is a management view; scoping can be reintroduced if needed.)
    if (user?.role === 'admin' || user?.role === 'responsable') return null;

    // formateur: prefer explicit assignments, otherwise infer from their sessions
    if (user?.role === 'formateur') {
        const assigned = Array.isArray(user?.formations_assignees) ? user.formations_assignees : [];
        if (assigned.length > 0) return assigned;

        // Fallback: if formations were not explicitly assigned in the User document,
        // infer scope from the formateur's own sessions (Seance -> Niveau -> Formation).
        // This prevents the dashboard from showing misleading 0s while data exists.
        const inferred = await Seance.aggregate([
            { $match: { formateur_id: { $in: idVariants(user._id) } } },
            {
                $lookup: {
                    from: 'niveaux',
                    localField: 'niveau_id',
                    foreignField: '_id',
                    as: 'niveau',
                },
            },
            { $unwind: '$niveau' },
            { $group: { _id: '$niveau.formation_id' } },
            { $project: { _id: 1 } },
        ]);
        return inferred.map((x) => x._id).filter(Boolean);
    }

    return Array.isArray(user?.formations_assignees) ? user.formations_assignees : [];
}

function buildSeanceScopePipeline({ user, formationIds }) {
    // Returns extra pipeline stages to apply AFTER any $match on Seance.date
    if (user?.role === 'formateur') {
        return [{ $match: { formateur_id: { $in: idVariants(user._id) } } }];
    }
    if (Array.isArray(formationIds)) {
        if (formationIds.length === 0) {
            return [{ $match: { _id: { $exists: false } } }];
        }
        return [
            {
                $lookup: {
                    from: 'niveaux',
                    localField: 'niveau_id',
                    foreignField: '_id',
                    as: 'niveau',
                },
            },
            { $unwind: '$niveau' },
            { $match: { 'niveau.formation_id': { $in: formationIds } } },
        ];
    }
    return [];
}

function buildPresenceScopePipeline({ user, formationIds }) {
    // Presence -> Seance is always needed to filter by date + scope
    const pipeline = [
        {
            $lookup: {
                from: 'seances',
                localField: 'seance_id',
                foreignField: '_id',
                as: 'seance',
            },
        },
        { $unwind: '$seance' },
    ];

    if (user?.role === 'formateur') {
        pipeline.push({ $match: { 'seance.formateur_id': { $in: idVariants(user._id) } } });
        return pipeline;
    }

    if (Array.isArray(formationIds)) {
        if (formationIds.length === 0) {
            pipeline.push({ $match: { _id: { $exists: false } } });
            return pipeline;
        }
        pipeline.push(
            {
                $lookup: {
                    from: 'niveaux',
                    localField: 'seance.niveau_id',
                    foreignField: '_id',
                    as: 'niveau',
                },
            },
            { $unwind: '$niveau' },
            { $match: { 'niveau.formation_id': { $in: formationIds } } }
        );
    }

    return pipeline;
}

/**
 * Get dashboard statistics
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
export const getDashboardStats = async (req, res, next) => {
    try {
        // Get today's range
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch counts in parallel for better performance
        const [
            studentCount,
            activeFormationCount,
            sessionsTodayCount,
            certificationCount
        ] = await Promise.all([
            Eleve.countDocuments(),
            Formation.countDocuments({ actif: true }),
            Seance.countDocuments({
                date: { $gte: startOfDay, $lte: endOfDay }
            }),
            Certification.countDocuments()
        ]);

        res.status(200).json({
            success: true,
            data: {
                students: studentCount,
                activeFormations: activeFormationCount,
                sessionsToday: sessionsTodayCount,
                certifications: certificationCount
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get dashboard analytics for charts (real data, scoped by role)
 * @route   GET /api/dashboard/analytics
 * @access  Private
 */
export const getDashboardAnalytics = async (req, res, next) => {
    try {
        const now = new Date();
        const todayStart = startOfDay(now);
        const todayEnd = endOfDay(now);
        const monthStart = startOfMonth(now);
        const next7DaysEnd = endOfDay(addDays(now, 7));
        const last30DaysStart = startOfDay(addDays(now, -30));
        const months = listLastMonths(now, 6);
        const monthsStart = startOfMonth(addDays(now, -31 * 5));

        const formationIds = await getScopedFormationIds(req.user);

        // Cards
        const cardsPromise = (async () => {
            const formationsMatch = (() => {
                if (req.user.role === 'admin' || req.user.role === 'responsable') return {};
                return Array.isArray(formationIds) ? { _id: { $in: formationIds } } : {};
            })();

            const [formationsTotal, formationsActive] = await Promise.all([
                Formation.countDocuments({ ...formationsMatch }),
                Formation.countDocuments({ ...formationsMatch, actif: true }),
            ]);

            let studentsTotal = 0;
            let studentsActive = 0;
            if (req.user.role === 'admin' || req.user.role === 'responsable') {
                [studentsTotal, studentsActive] = await Promise.all([
                    Eleve.countDocuments(),
                    Eleve.countDocuments({ actif: true }),
                ]);
            } else if (Array.isArray(formationIds) && formationIds.length > 0) {
                const totalAgg = await EleveFormation.aggregate([
                    { $match: { formation_id: { $in: formationIds } } },
                    { $group: { _id: '$eleve_id' } },
                    { $count: 'count' },
                ]);
                studentsTotal = totalAgg?.[0]?.count || 0;

                const activeAgg = await EleveFormation.aggregate([
                    { $match: { formation_id: { $in: formationIds } } },
                    {
                        $lookup: {
                            from: 'eleves',
                            localField: 'eleve_id',
                            foreignField: '_id',
                            as: 'eleve',
                        },
                    },
                    { $unwind: '$eleve' },
                    { $match: { 'eleve.actif': true } },
                    { $group: { _id: '$eleve_id' } },
                    { $count: 'count' },
                ]);
                studentsActive = activeAgg?.[0]?.count || 0;
            }

            const seanceBaseMatchToday = { date: { $gte: todayStart, $lte: todayEnd } };
            const seanceBaseMatchNext7 = { date: { $gte: todayStart, $lte: next7DaysEnd } };
            const seanceBaseMatchMonth = { date: { $gte: monthStart, $lte: todayEnd } };

            const seancesTodayAgg = await Seance.aggregate([
                { $match: seanceBaseMatchToday },
                ...buildSeanceScopePipeline({ user: req.user, formationIds }),
                { $count: 'count' },
            ]);
            const sessionsToday = seancesTodayAgg?.[0]?.count || 0;

            const seancesNext7Agg = await Seance.aggregate([
                { $match: seanceBaseMatchNext7 },
                ...buildSeanceScopePipeline({ user: req.user, formationIds }),
                { $count: 'count' },
            ]);
            const sessionsNext7Days = seancesNext7Agg?.[0]?.count || 0;

            const seancesThisMonthAgg = await Seance.aggregate([
                { $match: seanceBaseMatchMonth },
                ...buildSeanceScopePipeline({ user: req.user, formationIds }),
                { $count: 'count' },
            ]);
            const sessionsThisMonth = seancesThisMonthAgg?.[0]?.count || 0;

            const certificationsMatch = (() => {
                if (req.user.role === 'admin' || req.user.role === 'responsable') return {};
                if (!Array.isArray(formationIds) || formationIds.length === 0) return { _id: { $exists: false } };
                return { formation_id: { $in: formationIds } };
            })();
            const certificationsTotal = await Certification.countDocuments(certificationsMatch);

            return {
                studentsTotal,
                studentsActive,
                formationsTotal,
                formationsActive,
                sessionsToday,
                sessionsNext7Days,
                sessionsThisMonth,
                certificationsTotal,
            };
        })();

        // Attendance summary (last 30 days)
        const attendancePromise = (async () => {
            const statusAgg = await Presence.aggregate([
                ...buildPresenceScopePipeline({ user: req.user, formationIds }),
                { $match: { 'seance.date': { $gte: last30DaysStart, $lte: todayEnd } } },
                { $group: { _id: '$statut', count: { $sum: 1 } } },
            ]);

            const byStatus = { present: 0, absent: 0, retard: 0, justifie: 0 };
            for (const row of statusAgg) {
                if (row?._id && Object.hasOwn(byStatus, row._id)) {
                    byStatus[row._id] = row.count;
                }
            }
            const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
            const presentLike = (byStatus.present || 0) + (byStatus.retard || 0) + (byStatus.justifie || 0);
            const attendanceRate = total > 0 ? presentLike / total : 0;

            return { byStatus, total, presentLike, attendanceRate };
        })();

        // Sessions per month (last 6 months)
        const sessionsPerMonthPromise = (async () => {
            const agg = await Seance.aggregate([
                { $match: { date: { $gte: monthsStart, $lte: todayEnd } } },
                ...buildSeanceScopePipeline({ user: req.user, formationIds }),
                {
                    $group: {
                        _id: {
                            y: { $year: '$date' },
                            m: { $month: '$date' },
                        },
                        count: { $sum: 1 },
                    },
                },
            ]);

            const map = new Map();
            for (const r of agg) {
                const key = `${r._id.y}-${String(r._id.m).padStart(2, '0')}`;
                map.set(key, r.count);
            }
            return months.map((m) => ({ month: m, sessions: map.get(m) || 0 }));
        })();

        // Attendance rate per month (last 6 months)
        const attendancePerMonthPromise = (async () => {
            const agg = await Presence.aggregate([
                ...buildPresenceScopePipeline({ user: req.user, formationIds }),
                { $match: { 'seance.date': { $gte: monthsStart, $lte: todayEnd } } },
                {
                    $group: {
                        _id: {
                            y: { $year: '$seance.date' },
                            m: { $month: '$seance.date' },
                        },
                        total: { $sum: 1 },
                        presentLike: {
                            $sum: {
                                $cond: [
                                    { $in: ['$statut', ['present', 'retard', 'justifie']] },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
            ]);

            const map = new Map();
            for (const r of agg) {
                const key = `${r._id.y}-${String(r._id.m).padStart(2, '0')}`;
                const rate = r.total > 0 ? r.presentLike / r.total : 0;
                map.set(key, rate);
            }
            return months.map((m) => ({ month: m, attendanceRate: map.get(m) || 0 }));
        })();

        // Top formations by attendance (last 30 days)
        const topFormationsPromise = (async () => {
            const pipeline = [
                {
                    $lookup: {
                        from: 'seances',
                        localField: 'seance_id',
                        foreignField: '_id',
                        as: 'seance',
                    },
                },
                { $unwind: '$seance' },
                {
                    $lookup: {
                        from: 'niveaux',
                        localField: 'seance.niveau_id',
                        foreignField: '_id',
                        as: 'niveau',
                    },
                },
                { $unwind: '$niveau' },
            ];

            if (req.user.role === 'formateur') {
                pipeline.push({ $match: { 'seance.formateur_id': { $in: idVariants(req.user._id) } } });
            }
            if (Array.isArray(formationIds)) {
                if (formationIds.length === 0) {
                    return [];
                }
                pipeline.push({ $match: { 'niveau.formation_id': { $in: formationIds } } });
            }

            pipeline.push(
                { $match: { 'seance.date': { $gte: last30DaysStart, $lte: todayEnd } } },
                {
                    $group: {
                        _id: '$niveau.formation_id',
                        total: { $sum: 1 },
                        presentLike: {
                            $sum: {
                                $cond: [
                                    { $in: ['$statut', ['present', 'retard', 'justifie']] },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
                { $match: { total: { $gte: 3 } } },
                {
                    $addFields: {
                        attendanceRate: {
                            $cond: [
                                { $gt: ['$total', 0] },
                                { $divide: ['$presentLike', '$total'] },
                                0,
                            ],
                        },
                    },
                },
                { $sort: { attendanceRate: -1, total: -1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: 'formations',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'formation',
                    },
                },
                { $unwind: { path: '$formation', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        _id: 0,
                        formationId: '$_id',
                        formationName: '$formation.nom',
                        attendanceRate: 1,
                        total: 1,
                    },
                }
            );

            return await Presence.aggregate(pipeline);
        })();

        const [cards, attendance, sessionsPerMonth, attendancePerMonth, topFormations] = await Promise.all([
            cardsPromise,
            attendancePromise,
            sessionsPerMonthPromise,
            attendancePerMonthPromise,
            topFormationsPromise,
        ]);

        res.status(200).json({
            success: true,
            data: {
                scope: {
                    role: req.user.role,
                    formationCount: Array.isArray(formationIds) ? formationIds.length : null,
                },
                cards,
                attendance,
                series: {
                    sessionsPerMonth,
                    attendancePerMonth,
                },
                topFormations,
                meta: {
                    generatedAt: new Date().toISOString(),
                    months,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};
