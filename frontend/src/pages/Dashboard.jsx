import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui';
import { dashboardAPI } from '../api/dashboard';
import './Dashboard.css';

/**
 * Dashboard Page
 * Role-specific overview
 */
const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        students: 0,
        activeFormations: 0,
        sessionsToday: 0,
        certifications: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await dashboardAPI.getStats();
                setStats(response.data);
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Tableau de bord</h1>
                <p>Bienvenue, {user?.prenom} !</p>
            </div>

            <div className="stats-grid">
                <Card className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--color-primary-lightest)', color: 'var(--color-primary)' }}>
                        <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Élèves inscrits</div>
                        <div className="stat-value">{loading ? '...' : stats.students}</div>
                    </div>
                </Card>

                <Card className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--color-success-light)', color: 'var(--color-success)' }}>
                        <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Formations actives</div>
                        <div className="stat-value">{loading ? '...' : stats.activeFormations}</div>
                    </div>
                </Card>

                <Card className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning)' }}>
                        <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Séances aujourd'hui</div>
                        <div className="stat-value">{loading ? '...' : stats.sessionsToday}</div>
                    </div>
                </Card>

                <Card className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--color-info-light)', color: 'var(--color-info)' }}>
                        <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Certifications</div>
                        <div className="stat-value">{loading ? '...' : stats.certifications}</div>
                    </div>
                </Card>
            </div>

            <div className="dashboard-content">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>

                    {/* Admin Actions */}
                    {user?.role === 'admin' && (
                        <Card>
                            <h3>Administration</h3>
                            <div className="action-buttons" style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                                <Link to="/students" className="btn btn-primary btn-small">Gérer les Élèves</Link>
                                <Link to="/formations" className="btn btn-primary btn-small">Gérer les Formations</Link>
                                <Link to="/sessions" className="btn btn-primary btn-small">Gérer les Séances</Link>
                            </div>
                        </Card>
                    )}

                    {/* Responsable Actions */}
                    {user?.isResponsable && (
                        <Card>
                            <h3>Gestion Rapide</h3>
                            <div className="action-buttons" style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                                <Link to="/formations" className="btn btn-primary btn-small">Mes Formations</Link>
                                <Link to="/students" className="btn btn-secondary btn-small">Mes Élèves</Link>
                                <button className="btn btn-success btn-small">Nouvelle Formation</button>
                            </div>
                        </Card>
                    )}

                    {/* Formateur Actions */}
                    {user?.role === 'formateur' && (
                        <Card>
                            <h3>Espace Formateur</h3>
                            <div className="action-buttons" style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                                <Link to="/sessions" className="btn btn-primary btn-small">Mes Séances</Link>
                                <Link to="/students" className="btn btn-secondary btn-small">Liste des Élèves</Link>
                            </div>
                        </Card>
                    )}
                </div>

                <Card>
                    <h3>Activité récente</h3>
                    <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-4)' }}>
                        Aucune activité récente
                    </p>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
