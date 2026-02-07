import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { activityAPI } from '../api/activities';
import { Card } from '../components/ui';
import './History.css';

const History = () => {
    const { user } = useAuth();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');

    useEffect(() => {
        fetchActivities();
    }, [filter, dateFilter]);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filter !== 'all') params.type = filter;
            if (dateFilter) params.date = dateFilter;
            
            const response = await activityAPI.getUserHistory(user._id, params);
            setActivities(response.data.activities || []);
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActivityIcon = (type) => {
        const icons = {
            'create': '✚',
            'update': '↻',
            'delete': '✕',
            'login': '→',
            'logout': '←',
            'download': '⬇',
            'upload': '⬆',
            'assign': '🔗'
        };
        return icons[type] || '•';
    };

    const getActivityColor = (type) => {
        const colors = {
            'create': 'activity-create',
            'update': 'activity-update',
            'delete': 'activity-delete',
            'login': 'activity-login',
            'logout': 'activity-logout',
            'download': 'activity-download',
            'upload': 'activity-upload',
            'assign': 'activity-assign'
        };
        return colors[type] || 'activity-default';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className="history-page">
            <div className="history-header">
                <div>
                    <h1>Historique de mes actions</h1>
                    <p>Suivi complet de toutes vos activités</p>
                </div>
            </div>

            <div className="history-filters">
                <Card className="filter-card">
                    <div className="filters-container">
                        <div className="filter-group">
                            <label>Type d'activité</label>
                            <select 
                                value={filter} 
                                onChange={(e) => setFilter(e.target.value)}
                                className="filter-select"
                            >
                                <option value="all">Tous les types</option>
                                <option value="create">Créations</option>
                                <option value="update">Modifications</option>
                                <option value="delete">Suppressions</option>
                                <option value="login">Connexions</option>
                                <option value="logout">Déconnexions</option>
                                <option value="download">Téléchargements</option>
                                <option value="upload">Uploads</option>
                                <option value="assign">Assignments</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Date</label>
                            <input 
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="filter-date"
                            />
                        </div>
                    </div>
                </Card>
            </div>

            {loading ? (
                <div className="loading-state">Chargement de l'historique...</div>
            ) : activities.length === 0 ? (
                <Card className="empty-state">
                    <p>Aucune activité enregistrée pour les filtres sélectionnés</p>
                </Card>
            ) : (
                <div className="timeline">
                    {activities.map((activity, index) => (
                        <div key={activity._id || index} className="timeline-item">
                            <div className={`timeline-marker ${getActivityColor(activity.type)}`}>
                                {getActivityIcon(activity.type)}
                            </div>
                            <div className="timeline-content">
                                <Card className="activity-card">
                                    <div className="activity-header">
                                        <h3 className="activity-title">{activity.description}</h3>
                                        <span className="activity-time">
                                            {formatDate(activity.createdAt)}
                                        </span>
                                    </div>
                                    <div className="activity-details">
                                        <div className="detail-row">
                                            <span className="detail-label">Type:</span>
                                            <span className={`activity-badge ${getActivityColor(activity.type)}`}>
                                                {activity.type.toUpperCase()}
                                            </span>
                                        </div>
                                        {activity.entityType && (
                                            <div className="detail-row">
                                                <span className="detail-label">Entité:</span>
                                                <span className="detail-value">{activity.entityType}</span>
                                            </div>
                                        )}
                                        {activity.entityName && (
                                            <div className="detail-row">
                                                <span className="detail-label">Élément:</span>
                                                <span className="detail-value">{activity.entityName}</span>
                                            </div>
                                        )}
                                        {activity.details && (
                                            <div className="detail-row">
                                                <span className="detail-label">Détails:</span>
                                                <span className="detail-value">{activity.details}</span>
                                            </div>
                                        )}
                                        {activity.ipAddress && (
                                            <div className="detail-row">
                                                <span className="detail-label">Adresse IP:</span>
                                                <span className="detail-value">{activity.ipAddress}</span>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default History;
