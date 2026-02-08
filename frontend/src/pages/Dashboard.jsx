import { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui';
import { dashboardAPI } from '../api/dashboard';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import CertificationPredictorForm from '../components/CertificationPredictorForm';
import './Dashboard.css';

function ChartState({ loading, loadingLabel, hasData, emptyLabel, children }) {
    if (loading) return <p className="no-data">{loadingLabel}</p>;
    if (!hasData) return <p className="no-data">{emptyLabel}</p>;
    return children;
}

ChartState.propTypes = {
    loading: PropTypes.bool.isRequired,
    loadingLabel: PropTypes.string.isRequired,
    hasData: PropTypes.bool.isRequired,
    emptyLabel: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
};

/**
 * Dashboard Page - Professional Admin Dashboard
 * Modern, clean, and responsive design
 */
const Dashboard = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadNotice, setLoadNotice] = useState('');

    const cards = analytics?.cards || {
        studentsTotal: 0,
        formationsActive: 0,
        sessionsToday: 0,
        certificationsTotal: 0,
        sessionsNext7Days: 0,
        sessionsThisMonth: 0,
        studentsActive: 0,
        formationsTotal: 0,
    };

    const attendance = analytics?.attendance || {
        byStatus: { present: 0, absent: 0, retard: 0, justifie: 0 },
        total: 0,
        presentLike: 0,
        attendanceRate: 0,
    };

    const sessionsPerMonth = analytics?.series?.sessionsPerMonth || [];
    const attendancePerMonth = analytics?.series?.attendancePerMonth || [];
    const topFormations = analytics?.topFormations || [];

    const attendancePct = useMemo(() => {
        return Math.max(0, Math.min(1, Number(attendance.attendanceRate || 0)));
    }, [attendance.attendanceRate]);

    const progressDashOffset = useMemo(() => {
        const circumference = 2 * Math.PI * 54;
        return circumference * (1 - attendancePct);
    }, [attendancePct]);

    const attendanceByStatusChartData = useMemo(() => {
        const items = [
            { name: t('presence.status.present'), value: attendance.byStatus.present || 0, color: '#48bb78' },
            { name: t('presence.status.absent'), value: attendance.byStatus.absent || 0, color: '#e53e3e' },
            { name: t('presence.status.retard'), value: attendance.byStatus.retard || 0, color: '#f6ad55' },
            { name: t('presence.status.justifie'), value: attendance.byStatus.justifie || 0, color: '#4299e1' },
        ];
        return items.filter((x) => x.value > 0);
    }, [attendance.byStatus.absent, attendance.byStatus.justifie, attendance.byStatus.present, attendance.byStatus.retard, t]);

    const topFormationsChartData = useMemo(() => {
        return (topFormations || []).map((f) => ({
            name: f.formationName || '—',
            attendanceRate: Number(f.attendanceRate || 0),
            total: Number(f.total || 0),
        }));
    }, [topFormations]);

    const sessionsChart = (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sessionsPerMonth} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar name={t('nav.sessions')} dataKey="sessions" fill="#4169e1" radius={[6, 6, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );

    const attendanceByStatusChart = (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Tooltip />
                <Legend />
                <Pie
                    dataKey="value"
                    nameKey="name"
                    data={attendanceByStatusChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                    fill="#4169e1"
                >
                    {attendanceByStatusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
            </PieChart>
        </ResponsiveContainer>
    );

    const topFormationsChart = (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topFormationsChartData} layout="vertical" margin={{ top: 10, right: 20, bottom: 0, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v, n) => (n === 'attendanceRate' ? `${Math.round(Number(v) * 100)}%` : v)} />
                <Legend />
                <Bar name={t('dashboard.attendanceRate')} dataKey="attendanceRate" fill="#48bb78" radius={[0, 6, 6, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );

    const attendanceRateChart = (
        <div className="chart-recharts-container">
            <ResponsiveContainer width="100%" height={260}>
                <BarChart data={attendancePerMonth} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `${Math.round(v * 100)}%`} domain={[0, 1]} />
                    <Tooltip formatter={(v) => `${Math.round(Number(v) * 100)}%`} />
                    <Legend />
                    <Bar name={t('dashboard.attendanceRate')} dataKey="attendanceRate" fill="#2c3e50" radius={[6, 6, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoadNotice('');
                const response = await dashboardAPI.getAnalytics();
                setAnalytics(response.data);
            } catch (error) {
                const status = error?.response?.status;
                const serverMsg = error?.response?.data?.message;
                console.error('Error fetching dashboard analytics:', status, serverMsg || error);

                // Fallback: if analytics endpoint is missing/undeployed, at least show basic counts.
                try {
                    const basic = await dashboardAPI.getStats();
                    const d = basic?.data || {};
                    setAnalytics({
                        cards: {
                            studentsTotal: d.students || 0,
                            studentsActive: 0,
                            formationsTotal: d.activeFormations || 0,
                            formationsActive: d.activeFormations || 0,
                            sessionsToday: d.sessionsToday || 0,
                            sessionsNext7Days: 0,
                            sessionsThisMonth: 0,
                            certificationsTotal: d.certifications || 0,
                        },
                        attendance: {
                            byStatus: { present: 0, absent: 0, retard: 0, justifie: 0 },
                            total: 0,
                            presentLike: 0,
                            attendanceRate: 0,
                        },
                        series: { sessionsPerMonth: [], attendancePerMonth: [] },
                        topFormations: [],
                        meta: { generatedAt: new Date().toISOString(), fallback: true },
                    });
                    setLoadNotice(t('dashboard.analyticsUnavailable'));
                } catch (fallbackError) {
                    console.error('Error fetching dashboard basic stats:', fallbackError);
                    setLoadNotice(t('dashboard.loadError'));
                }
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="dashboard">
            {/* Dashboard Header */}
            <div className="dashboard-header-section">
                <div className="header-top">
                    <div className="header-content">
                        <h1 className="page-title">{t('nav.dashboard')}</h1>
                        <p className="page-subtitle">{t('common.welcome')}, <span className="user-greeting">{user?.prenom}</span> 👋</p>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="dashboard-grid">
                {/* Left Column - Stats and Charts */}
                <div className="dashboard-column-main">
                    {!!loadNotice && (
                        <Card className="statistics-card" style={{ padding: '12px 16px' }}>
                            <div style={{ fontSize: 13, opacity: 0.85 }}>
                                {loadNotice}
                            </div>
                        </Card>
                    )}
                    {/* Top Stats Cards */}
                    <div className="stats-container">
                        <div className="stat-card-wrapper">
                            <Card className="stat-card stat-card-blue">
                                <div className="stat-card-content">
                                    <div className="stat-card-icon">
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="9" cy="7" r="4"></circle>
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                        </svg>
                                    </div>
                                    <div className="stat-info">
                                        <p className="stat-label">{t('dashboard.totalStudents')}</p>
                                        <div className="stat-value-row">
                                            <span className="stat-value">{loading ? '...' : Number(cards.studentsTotal || 0).toLocaleString()}</span>
                                            <span className="stat-change positive">{t('common.active')}: {Number(cards.studentsActive || 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="stat-card-wrapper">
                            <Card className="stat-card stat-card-green">
                                <div className="stat-card-content">
                                    <div className="stat-card-icon">
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 2v20M2 12h20"></path>
                                        </svg>
                                    </div>
                                    <div className="stat-info">
                                        <p className="stat-label">{t('dashboard.activeFormations')}</p>
                                        <div className="stat-value-row">
                                            <span className="stat-value">{loading ? '...' : Number(cards.formationsActive || 0).toLocaleString()}</span>
                                            <span className="stat-change positive">{t('dashboard.total')}: {Number(cards.formationsTotal || 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="stat-card-wrapper">
                            <Card className="stat-card stat-card-orange">
                                <div className="stat-card-content">
                                    <div className="stat-card-icon">
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                        </svg>
                                    </div>
                                    <div className="stat-info">
                                        <p className="stat-label">{t('dashboard.sessionsToday')}</p>
                                        <div className="stat-value-row">
                                            <span className="stat-value">{loading ? '...' : Number(cards.sessionsToday || 0).toLocaleString()}</span>
                                            <span className="stat-change positive">{t('dashboard.next7')}: {Number(cards.sessionsNext7Days || 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="stat-card-wrapper">
                            <Card className="stat-card stat-card-navy">
                                <div className="stat-card-content">
                                    <div className="stat-card-icon">
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 2L15.09 8.26H22L17.55 12.5L19.64 18.74L12 14.49L4.36 18.74L6.45 12.5L2 8.26H8.91L12 2Z"></path>
                                        </svg>
                                    </div>
                                    <div className="stat-info">
                                        <p className="stat-label">{t('certification.title')}</p>
                                        <div className="stat-value-row">
                                            <span className="stat-value">{loading ? '...' : Number(cards.certificationsTotal || 0).toLocaleString()}</span>
                                            <span className="stat-change positive">{t('dashboard.thisMonth')}: {Number(cards.sessionsThisMonth || 0).toLocaleString()} {t('nav.sessions')}</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="charts-grid">
                        <Card className="chart-card">
                            <div className="card-header">
                                <h3 className="card-title">{t('dashboard.chartTitle')}</h3>
                                <button className="card-menu-btn">⋯</button>
                            </div>
                            <div className="chart-recharts-container">
                                <ChartState loading={loading} loadingLabel={t('common.loading')} hasData={sessionsPerMonth.length > 0} emptyLabel={t('common.noData')}>
                                    {sessionsChart}
                                </ChartState>
                            </div>
                        </Card>

                        <Card className="chart-card">
                            <div className="card-header">
                                <h3 className="card-title">{t('dashboard.attendanceByStatus')}</h3>
                                <button className="card-menu-btn">⋯</button>
                            </div>
                            <div className="chart-recharts-container">
                                <ChartState loading={loading} loadingLabel={t('common.loading')} hasData={attendance.total > 0} emptyLabel={t('common.noData')}>
                                    {attendanceByStatusChart}
                                </ChartState>
                            </div>
                        </Card>

                        <Card className="chart-card">
                            <div className="card-header">
                                <h3 className="card-title">{t('dashboard.topFormations')}</h3>
                                <button className="card-menu-btn">⋯</button>
                            </div>
                            <div className="chart-recharts-container">
                                <ChartState loading={loading} loadingLabel={t('common.loading')} hasData={topFormationsChartData.length > 0} emptyLabel={t('common.noData')}>
                                    {topFormationsChart}
                                </ChartState>
                            </div>
                        </Card>
                    </div>

                    {/* Statistics Section */}
                    <Card className="statistics-card">
                        <div className="statistics-header">
                            <h3 className="card-title">{t('dashboard.statsTitle')}</h3>
                            <div className="stats-filter">
                                <input type="text" placeholder={t('common.search')} className="filter-input" />
                                <select className="date-select">
                                    <option>Fév 1 - Fév 7</option>
                                </select>
                            </div>
                        </div>
                        <div className="statistics-content">
                            <ChartState loading={loading} loadingLabel={t('common.loading')} hasData={attendancePerMonth.length > 0} emptyLabel={t('common.noData')}>
                                {attendanceRateChart}
                            </ChartState>
                        </div>
                    </Card>
                </div>

                {/* Right Column - Target & Actions */}
                <div className="dashboard-column-sidebar">
                    {/* Monthly Target Card */}
                    <Card className="target-card">
                        <div className="target-header">
                            <h3 className="card-title">{t('dashboard.attendance30d')}</h3>
                            <button className="card-menu-btn">⋯</button>
                        </div>
                        <div className="circular-progress">
                            <svg viewBox="0 0 120 120" className="progress-circle">
                                <defs>
                                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#48bb78" />
                                        <stop offset="100%" stopColor="#4169e1" />
                                    </linearGradient>
                                </defs>
                                <circle cx="60" cy="60" r="54" className="progress-bg"></circle>
                                <circle
                                    cx="60"
                                    cy="60"
                                    r="54"
                                    className="progress-fill"
                                    style={{
                                        strokeDashoffset: progressDashOffset,
                                    }}
                                ></circle>
                            </svg>
                            <div className="progress-text">
                                <span className="progress-value">{loading ? '...' : `${Math.round(Number(attendance.attendanceRate || 0) * 100)}%`}</span>
                                <span className="progress-increase">{loading ? '' : `${Number(attendance.presentLike || 0).toLocaleString()}/${Number(attendance.total || 0).toLocaleString()}`}</span>
                            </div>
                        </div>
                        <p className="target-message">{t('dashboard.attendanceSubtitle')}</p>
                        <div className="target-stats">
                            <div className="target-stat-item">
                                <span className="target-stat-label">{t('presence.status.present')}</span>
                                <span className="target-stat-value">{loading ? '...' : Number(attendance.byStatus.present || 0).toLocaleString()}</span>
                                <span className="target-stat-change"> </span>
                            </div>
                            <div className="target-stat-item">
                                <span className="target-stat-label">{t('presence.status.absent')}</span>
                                <span className="target-stat-value absent">{loading ? '...' : Number(attendance.byStatus.absent || 0).toLocaleString()}</span>
                                <span className="target-stat-change"> </span>
                            </div>
                            <div className="target-stat-item">
                                <span className="target-stat-label">{t('presence.status.retard')}</span>
                                <span className="target-stat-value">{loading ? '...' : Number(attendance.byStatus.retard || 0).toLocaleString()}</span>
                                <span className="target-stat-change"> </span>
                            </div>
                        </div>
                    </Card>

                    {/* Quick Actions */}
                    {user?.role === 'admin' && (
                        <Card className="actions-card">
                            <h3 className="card-title">{t('dashboard.admin')}</h3>
                            <div className="action-links">
                                <Link to="/students" className="action-link">
                                    <span className="link-icon">👥</span>
                                    <span>{t('dashboard.manageStudents')}</span>
                                </Link>
                                <Link to="/formations" className="action-link">
                                    <span className="link-icon">📚</span>
                                    <span>{t('dashboard.manageTrainings')}</span>
                                </Link>
                                <Link to="/sessions" className="action-link">
                                    <span className="link-icon">📅</span>
                                    <span>{t('dashboard.manageSessions')}</span>
                                </Link>
                            </div>
                        </Card>
                    )}

                    {user?.isResponsable && (
                        <Card className="actions-card">
                            <h3 className="card-title">{t('dashboard.quickActions')}</h3>
                            <div className="action-links">
                                <Link to="/formations" className="action-link">
                                    <span className="link-icon">📚</span>
                                    <span>{t('dashboard.myTrainings')}</span>
                                </Link>
                                <Link to="/students" className="action-link">
                                    <span className="link-icon">👥</span>
                                    <span>{t('dashboard.myStudents')}</span>
                                </Link>
                                <button className="action-link">
                                    <span className="link-icon">➕</span>
                                    <span>{t('dashboard.newTraining')}</span>
                                </button>
                            </div>
                        </Card>
                    )}

                    <CertificationPredictorForm />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
