import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formationAPI } from '../../api/formations';
import { userAPI } from '../../api/users';
import { Button, Card, Modal, Input } from '../../components/ui';
import './FormationList.css';

const FormationList = () => {
    const { user, isResponsable } = useAuth();
    const [formations, setFormations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formateurs, setFormateurs] = useState([]);
    const [formData, setFormData] = useState({
        nom: '',
        description: '',
        responsable_id: '',
        duree_estimee: '',
        date_debut: '',
        niveau_requis: 'Débutant',
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchFormations();
        if (isResponsable) {
            fetchFormateurs();
        }
    }, [isResponsable]);

    const fetchFormations = async () => {
        try {
            setLoading(true);
            const response = await formationAPI.getAll();
            setFormations(response.data.formations);
        } catch (error) {
            console.error('Error fetching formations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFormateurs = async () => {
        try {
            const response = await userAPI.getAll();
            // Filter eligible responsibles (ONLY formateurs as requested)
            const eligible = response.data.users.filter(u => u.role === 'formateur');
            setFormateurs(eligible);
        } catch (error) {
            console.error('Error fetching formateurs:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await formationAPI.create(formData);
            setShowCreateModal(false);
            setFormData({
                nom: '',
                description: '',
                responsable_id: '',
                duree_estimee: '',
                date_debut: '',
                niveau_requis: 'Débutant',
            });
            fetchFormations();
        } catch (error) {
            console.error('Error creating formation:', error);
            alert("Erreur lors de la création (Vérifier que le nom est unique)");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette formation ?')) {
            try {
                await formationAPI.delete(id);
                fetchFormations();
            } catch (error) {
                console.error('Error deleting formation:', error);
            }
        }
    };

    // Role check specifically for formateur vs manage roles
    const showAsTable = user?.role === 'formateur';

    return (
        <div className="formation-list">
            <div className="page-header">
                <div>
                    <h1>{showAsTable ? 'Mes Formations' : 'Formations'}</h1>
                    <p>{showAsTable ? 'Liste des formations vous étant assignées' : 'Gérer le catalogue des formations'}</p>
                </div>
                {isResponsable && (
                    <Button onClick={() => setShowCreateModal(true)}>
                        Nouvelle Formation
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="loading-state">Chargement...</div>
            ) : formations.length === 0 ? (
                <Card className="empty-state">
                    <p>Aucune formation trouvée</p>
                </Card>
            ) : showAsTable ? (
                <Card className="table-card">
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Formation</th>
                                    <th>Description</th>
                                    <th>Date Début</th>
                                    <th>Durée</th>
                                    <th>Niveau</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formations.map((formation) => (
                                    <tr key={formation._id}>
                                        <td className="bold">{formation.nom}</td>
                                        <td className="text-muted">{formation.description?.substring(0, 60)}...</td>
                                        <td>{new Date(formation.date_debut).toLocaleDateString()}</td>
                                        <td>{formation.duree_mois} mois</td>
                                        <td>
                                            <span className="badge-info">{formation.niveau_requis}</span>
                                        </td>
                                        <td>
                                            <Link to={`/formations/${formation._id}`}>
                                                <Button variant="ghost" size="small">
                                                    Consulter
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            ) : (
                <div className="formations-grid">
                    {formations.map((formation) => (
                        <Card key={formation._id} className="formation-card">
                            <div className="formation-header">
                                <h3>{formation.nom}</h3>
                            </div>
                            <p className="formation-desc">{formation.description}</p>
                            <div className="formation-meta">
                                <span>📅 {new Date(formation.date_debut).toLocaleDateString()}</span>
                                <span>⏱️ {formation.duree_mois} mois</span>
                                <span>📚 {formation.niveau_requis}</span>
                            </div>
                            <div className="formation-actions">
                                <Link to={`/formations/${formation._id}`}>
                                    <Button variant="secondary" size="small" fullWidth>
                                        Voir détails
                                    </Button>
                                </Link>
                                {isResponsable && (
                                    <Button
                                        variant="danger"
                                        size="small"
                                        onClick={() => handleDelete(formation._id)}
                                    >
                                        Supprimer
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Nouvelle Formation"
            >
                <form onSubmit={handleSubmit}>
                    <Input
                        label="Titre"
                        name="nom"
                        value={formData.nom}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                    />

                    <div className="input-group">
                        <label className="input-label">Formateur Responsable</label>
                        <select
                            name="responsable_id"
                            value={formData.responsable_id}
                            onChange={handleChange}
                            className="input"
                            required
                        >
                            <option value="">-- Sélectionner un formateur --</option>
                            {formateurs.map(f => (
                                <option key={f._id} value={f._id}>
                                    {f.nom} {f.prenom}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <Input
                            label="Durée estimée (ex: 3 mois)"
                            name="duree_estimee"
                            value={formData.duree_estimee}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Date de début"
                            type="date"
                            name="date_debut"
                            value={formData.date_debut}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Niveau requis</label>
                        <select
                            name="niveau_requis"
                            value={formData.niveau_requis}
                            onChange={handleChange}
                            className="input"
                        >
                            <option value="Débutant">Débutant</option>
                            <option value="Intermédiaire">Intermédiaire</option>
                            <option value="Avancé">Avancé</option>
                        </select>
                    </div>
                    <div className="modal-actions">
                        <Button type="submit" loading={submitting} fullWidth>
                            Créer
                        </Button>
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

export default FormationList;
