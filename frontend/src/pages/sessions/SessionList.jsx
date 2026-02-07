import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sessionAPI, niveauAPI } from '../../api/sessions';
import { formationAPI } from '../../api/formations';
import { Button, Card, Modal, Input } from '../../components/ui';
import './SessionList.css';

const SessionList = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
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
        fetchFormations();
    }, []);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const response = await sessionAPI.getAll();
            setSessions(response.data?.seances || response.data || []);
        } catch (error) {
            console.error('Error fetching sessions:', error);
        } finally {
            setLoading(false);
        }
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
                alert("Erreur: Niveau non identifié");
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
            alert("Erreur lors de la création");
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="session-list">
            <div className="page-header">
                <div>
                    <h1>Séances</h1>
                    <p>Gérer le planning des cours</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                    Nouvelle Séance
                </Button>
            </div>

            {loading ? (
                <div className="loading-state">Chargement...</div>
            ) : sessions.length === 0 ? (
                <Card className="empty-state">
                    <p>Aucune séance planifiée.</p>
                </Card>
            ) : (
                <div className="sessions-grid">
                    {sessions.map((session) => (
                        <Card key={session._id} className="session-card">
                            <div className="session-header">
                                <h3>{session.nom || 'Séance sans nom'}</h3>
                                <span className={`session-type ${session.type?.toLowerCase().replace(' ', '-')}`}>
                                    {session.type}
                                </span>
                            </div>
                            <div className="session-info">
                                <p><strong>Date:</strong> {new Date(session.date).toLocaleDateString()}</p>
                                <p><strong>Horaire:</strong> {session.heure_debut} - {session.heure_fin}</p>
                                <p><strong>Niveau:</strong> {session.niveau_id?.nom} (N°{session.niveau_id?.numero})</p>
                                <p><strong>Formateur:</strong> {session.formateur_id?.nom} {session.formateur_id?.prenom}</p>
                            </div>
                            <div className="session-actions">
                                <Link to={`/sessions/${session._id}`}>
                                    <Button size="small" variant="secondary" fullWidth>
                                        Gérer présences
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Planifier une Séance"
            >
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label">Formation *</label>
                        <select
                            name="formation_id"
                            value={formData.formation_id}
                            onChange={handleFormationChange}
                            className="input"
                            required
                        >
                            <option value="">Sélectionner une formation</option>
                            {formations.map(f => (
                                <option key={f._id || f.id} value={f._id || f.id}>{f.nom}</option>
                            ))}
                        </select>
                    </div>

                    {formData.niveau_id && (
                        <div className="info-message">
                            Niveau actuel: {formData.niveau_numero}
                        </div>
                    )}

                    <Input
                        label="Date"
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                    />
                    <div className="form-row">
                        <Input
                            label="Début"
                            type="time"
                            name="heure_debut"
                            value={formData.heure_debut}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Fin"
                            type="time"
                            name="heure_fin"
                            value={formData.heure_fin}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Type</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="input"
                        >
                            <option value="Presentiel">Présentiel</option>
                            <option value="En ligne">En ligne</option>
                        </select>
                    </div>
                    <div className="modal-actions">
                        <Button type="submit" fullWidth disabled={!formData.niveau_id}>Créer</Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setShowCreateModal(false)}
                            fullWidth
                        >
                            Annuler
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default SessionList;
