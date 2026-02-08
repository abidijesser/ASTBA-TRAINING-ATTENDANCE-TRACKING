import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sessionAPI, niveauAPI } from '../../api/sessions';
import { formationAPI } from '../../api/formations';
import { Button, Card, Modal, Input } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useDialog } from '../../context/DialogContext';
import './SessionList.css';

const SessionList = () => {
    const { isResponsable } = useAuth();
    const { t, language } = useLanguage();
    const { showAlert, showError } = useDialog();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formations, setFormations] = useState([]);
    const [formData, setFormData] = useState({
        date: '',
        heure_debut: '',
        heure_fin: '',
        type: 'Presentiel',
        formation_id: '',
        niveau_id: '',
        niveau_numero: ''
    });

    useEffect(() => {
        fetchSessions();
    }, [search]);

    useEffect(() => {
        if (isResponsable) {
            fetchFormations();
        }
    }, [isResponsable]);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const params = search ? { search } : {};
            const response = await sessionAPI.getAll(params);
            setSessions(response.data?.seances || response.data || []);
        } catch (error) {
            console.error('Error fetching sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchSessions();
    };

    const fetchFormations = async () => {
        try {
            const response = await formationAPI.getAll({ actif: true });
            setFormations(response.data?.formations || response.data || []);
        } catch (error) {
            console.error('Error fetching formations:', error);
        }
    };

    const handleFormationChange = async (e) => {
        const formationId = e.target.value;
        const formation = formations.find(f => f._id === formationId || f.id === formationId);

        if (!formation) {
            setFormData(prev => ({ ...prev, formation_id: '', niveau_id: '', niveau_numero: '' }));
            return;
        }

        try {
            // Fetch levels for this formation to find the ID of the current level
            const levelsRes = await formationAPI.getLevels(formationId);
            const levels = levelsRes.data.niveaux || [];
            // formation.niveau_actuel is from the formation object. If not present, default to 1.
            const currentLevelNum = formation.niveau_actuel || 1;

            const currentLevel = levels.find(l => l.numero === currentLevelNum);

            if (currentLevel) {
                setFormData(prev => ({
                    ...prev,
                    formation_id: formationId,
                    niveau_id: currentLevel._id || currentLevel.id,
                    niveau_numero: currentLevelNum
                }));
            } else {
                console.error("Could not find level object for numero", currentLevelNum);
                // If it's the first level and levels exist, fallback to first level
                if (levels.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        formation_id: formationId,
                        niveau_id: levels[0]._id || levels[0].id,
                        niveau_numero: levels[0].numero
                    }));
                }
            }
        } catch (error) {
            console.error("Error creating session setup:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!formData.niveau_id) {
                showAlert(t('session.errorLevelMissing'));
                return;
            }

            // Format data for API
            // API expects POST /api/niveaux/:id/seances
            await niveauAPI.createSession(formData.niveau_id, {
                date: formData.date,
                heure_debut: formData.heure_debut,
                heure_fin: formData.heure_fin,
                type: formData.type
            });
            setShowCreateModal(false);
            fetchSessions();
        } catch (error) {
            console.error("Error creating session:", error);
            showError(t('session.createError'));
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="session-list">
            <div className="page-header">
                <div>
                    <h1>{t('session.listTitle')}</h1>
                    <p>{t('session.listSubtitle')}</p>
                </div>
                {isResponsable && (
                    <Button onClick={() => setShowCreateModal(true)} className="btn-new">
                        + {t('session.newSession')}
                    </Button>
                )}
            </div>

            <Card className="search-card">
                <form onSubmit={handleSearch} className="search-form">
                    <input
                        type="text"
                        placeholder={t('session.searchPlaceholder')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-input"
                    />
                    <Button type="submit">{t('common.search')}</Button>
                </form>
            </Card>

            {loading ? (
                <div className="loading-state">{t('common.loading')}</div>
            ) : sessions.length === 0 ? (
                <Card className="empty-state">
                    <p>{t('session.noSessions')}</p>
                </Card>
            ) : (
                <div className="sessions-grid">
                    {sessions.map((session) => {
                        const levelNum = session.niveau_id?.numero;
                        const activeLevelNum = session.niveau_id?.formation_id?.niveau_actuel || 1;
                        const isLocked = levelNum > activeLevelNum;
                        const isFinished = session.statut === 'terminee';

                        return (
                            <Card key={session._id} className={`session-card ${isLocked ? 'locked' : ''} ${isFinished ? 'finished' : ''}`}>
                                <div className="session-header">
                                    <h3>{session.nom || t('session.unnamedSession')}</h3>
                                    <div className="session-badges">
                                        <span className={`session-type ${session.type?.toLowerCase().replace(' ', '-')}`}>
                                            {session.type}
                                        </span>
                                        <span className={`session-status-badge ${session.statut}`}>
                                            {session.statut ? (t(`formation.status${session.statut.charAt(0).toUpperCase() + session.statut.slice(1)}`) || session.statut) : ''}
                                        </span>
                                    </div>
                                </div>
                                <div className="session-info">
                                    <p><strong>{t('session.formationLabel')}</strong> {session.niveau_id?.formation_id?.nom}</p>
                                    <p><strong>{t('session.levelLabel')}</strong> {session.niveau_id?.nom} (N°{levelNum})</p>
                                    <p><strong>{t('session.dateLabel')}</strong> {session.date ? new Date(session.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : (language === 'en' ? 'en-US' : 'fr-FR')) : ''}</p>
                                    <p><strong>{t('session.timeLabel')}</strong> {session.heure_debut} - {session.heure_fin}</p>
                                    <p><strong>{t('session.trainerLabel')}</strong> {session.formateur_id?.nom} {session.formateur_id?.prenom}</p>
                                </div>
                                <div className="session-actions">
                                    {isLocked ? (
                                        <Button size="small" variant="secondary" fullWidth disabled>
                                            🔒 {t('session.levelLocked')}
                                        </Button>
                                    ) : (
                                        <Link to={`/sessions/${session._id}`} className="action-link">
                                            <Button size="small" variant={isFinished ? "ghost" : "secondary"} fullWidth>
                                                {isFinished ? t('common.view') : t('session.manageAttendance')}
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title={t('session.planSessionTitle')}
            >
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label">{t('session.formationRequired')}</label>
                        <select
                            name="formation_id"
                            value={formData.formation_id}
                            onChange={handleFormationChange}
                            className="input"
                            required
                        >
                            <option value="">{t('formation.selectFormation')}</option>
                            {formations.map(f => (
                                <option key={f._id || f.id} value={f._id || f.id}>{f.nom}</option>
                            ))}
                        </select>
                    </div>

                    {formData.niveau_id && (
                        <div className="info-message">
                            {t('session.currentLevel')} {formData.niveau_numero}
                        </div>
                    )}

                    <Input
                        label={t('session.dateInput')}
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                    />
                    <div className="form-row">
                        <Input
                            label={t('session.startTime')}
                            type="time"
                            name="heure_debut"
                            value={formData.heure_debut}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label={t('session.endTime')}
                            type="time"
                            name="heure_fin"
                            value={formData.heure_fin}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">{t('session.typeLabel')}</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="input"
                        >
                            <option value="Presentiel">{t('session.typeInPerson')}</option>
                            <option value="En ligne">{t('session.typeOnline')}</option>
                        </select>
                    </div>
                    <div className="modal-actions">
                        <Button type="submit" fullWidth disabled={!formData.niveau_id}>{t('common.create')}</Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setShowCreateModal(false)}
                            fullWidth
                        >
                            {t('common.cancel')}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default SessionList;
