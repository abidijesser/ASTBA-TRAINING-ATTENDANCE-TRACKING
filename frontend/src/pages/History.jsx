import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { activityAPI } from '../api/activities';
import { Card } from '../components/ui';
import './History.css';

const History = () => {
    const { user } = useAuth();
    const { t, language } = useLanguage();
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
        let locale = 'fr-FR';
        if (language === 'en') locale = 'en-US';
        if (language === 'ar') locale = 'ar-SA';

        return date.toLocaleString(locale, {
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
                    <h1>{t('history.title')}</h1>
                    <p>{t('history.subtitle')}</p>
                </div>
            </div>

            <div className="history-filters">
                <Card className="filter-card">
                    <div className="filters-container">
                        <div className="filter-group">
                            <label>{t('history.activityType')}</label>
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="filter-select"
                            >
                                <option value="all">{t('history.allTypes')}</option>
                                <option value="create">{t('history.typeCreate')}</option>
                                <option value="update">{t('history.typeUpdate')}</option>
                                <option value="delete">{t('history.typeDelete')}</option>
                                <option value="login">{t('history.typeLogin')}</option>
                                <option value="logout">{t('history.typeLogout')}</option>
                                <option value="download">{t('history.typeDownload')}</option>
                                <option value="upload">{t('history.typeUpload')}</option>
                                <option value="assign">{t('history.typeAssign')}</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>{t('common.date')}</label>
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
                <div className="loading-state">{t('history.loading')}</div>
            ) : activities.length === 0 ? (
                <Card className="empty-state">
                    <p>{t('history.noActivity')}</p>
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
                                            <span className="detail-label">{t('history.detailType')}</span>
                                            <span className={`activity-badge ${getActivityColor(activity.type)}`}>
                                                {activity.type.toUpperCase()}
                                            </span>
                                        </div>
                                        {activity.entityType && (
                                            <div className="detail-row">
                                                <span className="detail-label">{t('history.detailEntity')}</span>
                                                <span className="detail-value">{activity.entityType}</span>
                                            </div>
                                        )}
                                        {activity.entityName && (
                                            <div className="detail-row">
                                                <span className="detail-label">{t('history.detailElement')}</span>
                                                <span className="detail-value">{activity.entityName}</span>
                                            </div>
                                        )}
                                        {activity.details && (
                                            <div className="detail-row">
                                                <span className="detail-label">{t('history.detailDetails')}</span>
                                                <span className="detail-value">{activity.details}</span>
                                            </div>
                                        )}
                                        {activity.ipAddress && (
                                            <div className="detail-row">
                                                <span className="detail-label">{t('history.detailIP')}</span>
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
