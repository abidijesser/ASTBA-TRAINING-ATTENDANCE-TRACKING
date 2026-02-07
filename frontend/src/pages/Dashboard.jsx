import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui';
import { dashboardAPI } from '../api/dashboard';
import './Dashboard.css';

/**
 * Dashboard Page - Professional Admin Dashboard
 * Modern, clean, and responsive design
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
    const [selectedTab, setSelectedTab] = useState('overview');

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
            {/* Dashboard Header */}
            <div className="dashboard-header-section">
                <div className="header-top">
                    <div className="header-content">
                        <h1 className="page-title">Tableau de bord</h1>
                        <p className="page-subtitle">Bienvenue, <span className="user-greeting">{user?.prenom}</span> 👋</p>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="dashboard-grid">
                {/* Left Column - Stats and Charts */}
                <div className="dashboard-column-main">
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
                                        <p className="stat-label">Élèves inscrits</p>
                                        <div className="stat-value-row">
                                            <span className="stat-value">{loading ? '...' : stats.students.toLocaleString()}</span>
                                            <span className="stat-change positive">↑ 12.5%</span>
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
                                        <p className="stat-label">Formations actives</p>
                                        <div className="stat-value-row">
                                            <span className="stat-value">{loading ? '...' : stats.activeFormations.toLocaleString()}</span>
                                            <span className="stat-change positive">↑ 8.2%</span>
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
                                        <p className="stat-label">Séances aujourd'hui</p>
                                        <div className="stat-value-row">
                                            <span className="stat-value">{loading ? '...' : stats.sessionsToday}</span>
                                            <span className="stat-change negative">↓ 3.1%</span>
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
                                        <p className="stat-label">Certifications</p>
                                        <div className="stat-value-row">
                                            <span className="stat-value">{loading ? '...' : stats.certifications}</span>
                                            <span className="stat-change positive">↑ 5.4%</span>
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
                                <h3 className="card-title">Formations par mois</h3>
                                <button className="card-menu-btn">⋯</button>
                            </div>
                            <div className="chart-placeholder">
                                <div className="bar-chart">
                                    <div className="bar" style={{height: '40%'}}></div>
                                    <div className="bar" style={{height: '60%'}}></div>
                                    <div className="bar" style={{height: '45%'}}></div>
                                    <div className="bar" style={{height: '75%'}}></div>
                                    <div className="bar" style={{height: '50%'}}></div>
                                    <div className="bar" style={{height: '65%'}}></div>
                                    <div className="bar" style={{height: '55%'}}></div>
                                    <div className="bar" style={{height: '35%'}}></div>
                                    <div className="bar" style={{height: '70%'}}></div>
                                    <div className="bar" style={{height: '80%'}}></div>
                                    <div className="bar" style={{height: '62%'}}></div>
                                    <div className="bar" style={{height: '40%'}}></div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Statistics Section */}
                    <Card className="statistics-card">
                        <div className="statistics-header">
                            <h3 className="card-title">Statistiques</h3>
                            <div className="stats-filter">
                                <input type="text" placeholder="Rechercher..." className="filter-input" />
                                <select className="date-select">
                                    <option>Fév 1 - Fév 7</option>
                                </select>
                            </div>
                        </div>
                        <div className="statistics-content">
                            <p className="no-data">Aucune donnée disponible</p>
                        </div>
                    </Card>
                </div>

                {/* Right Column - Target & Actions */}
                <div className="dashboard-column-sidebar">
                    {/* Monthly Target Card */}
                    <Card className="target-card">
                        <div className="target-header">
                            <h3 className="card-title">Objectif mensuel</h3>
                            <button className="card-menu-btn">⋯</button>
                        </div>
                        <div className="circular-progress">
                            <svg viewBox="0 0 120 120" className="progress-circle">
                                <circle cx="60" cy="60" r="54" className="progress-bg"></circle>
                                <circle cx="60" cy="60" r="54" className="progress-fill" style={{strokeDashoffset: '85'}}></circle>
                            </svg>
                            <div className="progress-text">
                                <span className="progress-value">75.55%</span>
                                <span className="progress-increase">+10%</span>
                            </div>
                        </div>
                        <p className="target-message">Vous avez dépassé votre objectif! Continuez votre bon travail.</p>
                        <div className="target-stats">
                            <div className="target-stat-item">
                                <span className="target-stat-label">Objectif</span>
                                <span className="target-stat-value">200K</span>
                                <span className="target-stat-change">↓</span>
                            </div>
                            <div className="target-stat-item">
                                <span className="target-stat-label">Revenus</span>
                                <span className="target-stat-value">200K</span>
                                <span className="target-stat-change">↑</span>
                            </div>
                            <div className="target-stat-item">
                                <span className="target-stat-label">Aujourd'hui</span>
                                <span className="target-stat-value">200K</span>
                                <span className="target-stat-change">↑</span>
                            </div>
                        </div>
                    </Card>

                    {/* Quick Actions */}
                    {user?.role === 'admin' && (
                        <Card className="actions-card">
                            <h3 className="card-title">Administration</h3>
                            <div className="action-links">
                                <Link to="/students" className="action-link">
                                    <span className="link-icon">👥</span>
                                    <span>Gérer les Élèves</span>
                                </Link>
                                <Link to="/formations" className="action-link">
                                    <span className="link-icon">📚</span>
                                    <span>Gérer les Formations</span>
                                </Link>
                                <Link to="/sessions" className="action-link">
                                    <span className="link-icon">📅</span>
                                    <span>Gérer les Séances</span>
                                </Link>
                            </div>
                        </Card>
                    )}

                    {user?.isResponsable && (
                        <Card className="actions-card">
                            <h3 className="card-title">Gestion Rapide</h3>
                            <div className="action-links">
                                <Link to="/formations" className="action-link">
                                    <span className="link-icon">📚</span>
                                    <span>Mes Formations</span>
                                </Link>
                                <Link to="/students" className="action-link">
                                    <span className="link-icon">👥</span>
                                    <span>Mes Élèves</span>
                                </Link>
                                <button className="action-link">
                                    <span className="link-icon">➕</span>
                                    <span>Nouvelle Formation</span>
                                </button>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
