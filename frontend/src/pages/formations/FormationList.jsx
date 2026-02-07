import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';
import { formationAPI } from '../../api/formations';
import { userAPI } from '../../api/users';
import { Button, Card, Modal, Input } from '../../components/ui';
import { uploadFile as uploadMediaFile, deleteFile as deleteMediaFile } from '../../services/uploadService';
import './FormationList.css';

const FormationList = () => {
    const { user, isResponsable } = useAuth();
    const { showAlert, showConfirm, showError, showSuccess } = useDialog();
    const [formations, setFormations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formateurs, setFormateurs] = useState([]);
    const [formData, setFormData] = useState({
        nom: '',
        description: '',
        responsable_id: '',
        duree_estimee: '',
        date_debut: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [medias, setMedias] = useState([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchFormations();
    }, [search]);

    useEffect(() => {
        if (isResponsable) {
            fetchFormateurs();
        }
    }, [isResponsable]);

    const fetchFormations = async () => {
        try {
            setLoading(true);
            const params = search ? { search } : {};
            const response = await formationAPI.getAll(params);
            setFormations(response.data.formations);
        } catch (error) {
            console.error('Error fetching formations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchFormations();
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
            await formationAPI.create({
                ...formData,
                medias,
            });
            setShowCreateModal(false);
            setFormData({
                nom: '',
                description: '',
                responsable_id: '',
                duree_estimee: '',
                date_debut: '',
            });
            setMedias([]);
            fetchFormations();
        } catch (error) {
            console.error('Error creating formation:', error);
            showError("Erreur lors de la création (Vérifier que le nom est unique)");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await showConfirm('Êtes-vous sûr de vouloir supprimer cette formation ?', 'Supprimer la formation');
        if (confirmed) {
            try {
                await formationAPI.delete(id);
                fetchFormations();
            } catch (error) {
                console.error('Error deleting formation:', error);
            }
        }
    };

    const handleMediaSelect = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        try {
            setUploading(true);
            const uploads = [];
            for (const file of files) {
                // Only allow images
                const mime = file.type || '';
                if (!mime.startsWith('image/')) {
                    continue;
                }
                const res = await uploadMediaFile(file);
                const payload = res?.data || res;
                const cloud = payload?.data || payload;
                const { url, publicId, format } = cloud;
                uploads.push({ url, publicId, type: 'image', format });
            }
            if (uploads.length === 0) {
                showAlert('Seules les images sont autorisées.');
            }
            setMedias(prev => [...prev, ...uploads]);
            e.target.value = '';
        } catch (error) {
            console.error('Error uploading media:', error);
            showError("Échec du téléversement d'un ou plusieurs médias");
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveMedia = async (index) => {
        const item = medias[index];
        try {
            await deleteMediaFile(item.publicId);
        } catch (error) {
            // Even if deletion fails, allow removing from form
            console.warn('Cloudinary deletion failed:', error);
        }
        setMedias(prev => prev.filter((_, i) => i !== index));
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
                    <Button onClick={() => setShowCreateModal(true)} className="btn-new">
                        + Nouvelle Formation
                    </Button>
                )}
            </div>

            <Card className="search-card">
                <form onSubmit={handleSearch} className="search-form">
                    <input
                        type="text"
                        placeholder="Rechercher une formation..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-input"
                    />
                    <Button type="submit">Rechercher</Button>
                </form>
            </Card>

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
                                {formations.map((formation) => {
                                    const hasDate = !!formation.date_debut;
                                    const dateText = hasDate
                                        ? new Date(formation.date_debut).toLocaleDateString()
                                        : '--';
                                    const dureeMois = parseInt(formation.duree_estimee);
                                    const dureeText = Number.isFinite(dureeMois)
                                        ? `${dureeMois} mois`
                                        : (formation.duree_estimee || '--');

                                    const niveauLabel = Number.isFinite(formation.niveau_actuel)
                                        ? (formation.niveau_actuel <= 4 ? `Niveau ${formation.niveau_actuel}` : 'Terminé')
                                        : '--';

                                    return (
                                        <tr key={formation._id}>
                                            <td className="bold">{formation.nom}</td>
                                            <td className="text-muted">{formation.description?.substring(0, 60)}...</td>
                                            <td>{dateText}</td>
                                            <td>{dureeText}</td>
                                            <td>
                                                <span className="badge-info">{niveauLabel}</span>
                                            </td>
                                            <td>
                                                <Link to={`/formations/${formation._id}`}>
                                                    <Button variant="ghost" size="small">
                                                        Consulter
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            ) : (
                <div className="formations-grid">
                    {formations.map((formation) => {
                        const hasDate = !!formation.date_debut;
                        const dateText = hasDate
                            ? new Date(formation.date_debut).toLocaleDateString()
                            : '--';
                        const dureeMois = parseInt(formation.duree_estimee);
                        const dureeText = Number.isFinite(dureeMois)
                            ? `${dureeMois} mois`
                            : (formation.duree_estimee || '--');
                        const niveauLabel = Number.isFinite(formation.niveau_actuel)
                            ? (formation.niveau_actuel <= 4 ? `Niveau ${formation.niveau_actuel}` : 'Terminé')
                            : '--';

                        return (
                            <Card key={formation._id} className="formation-card">
                                <div className="formation-header">
                                    <h3>{formation.nom}</h3>
                                </div>
                                <p className="formation-desc">{formation.description}</p>
                                <div className="formation-meta">
                                    <span>📅 {dateText}</span>
                                    <span>⏱️ {dureeText}</span>
                                    <span>📚 {niveauLabel}</span>
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
                        );
                    })}
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
                        <label className="input-label">Médias (images uniquement)</label>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleMediaSelect}
                            className="input"
                        />
                        {medias.length > 0 && (
                            <div className="media-preview-list" style={{ marginTop: '10px' }}>
                                {medias.map((m, idx) => (
                                    <div key={idx} className="media-preview-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        {m.type === 'image' ? (
                                            <img src={m.url} alt="media" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                                        ) : (
                                            <a href={m.url} target="_blank" rel="noreferrer" style={{ fontSize: '12px' }}>
                                                {m.type.toUpperCase()} · {m.format || ''}
                                            </a>
                                        )}
                                        <Button size="small" variant="danger" onClick={() => handleRemoveMedia(idx)}>Retirer</Button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {uploading && <p className="text-muted">Téléversement en cours...</p>}
                    </div>

                    {/* Champ "Niveau requis" supprimé (non nécessaire) */}
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
