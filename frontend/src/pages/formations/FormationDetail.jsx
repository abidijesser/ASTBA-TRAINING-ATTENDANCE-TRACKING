import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formationAPI } from '../../api/formations';
import { certificationAPI } from '../../api/certifications';
import { studentAPI } from '../../api/students';
import { userAPI } from '../../api/users';
import { Button, Card, Modal, Input } from '../../components/ui';
import './FormationDetail.css';

const FormationDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isResponsable } = useAuth();

    const [formation, setFormation] = useState(null);
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Student Assignment State
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [availableStudents, setAvailableStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [assigning, setAssigning] = useState(false);

    // Formateur Assignment State
    const [showFormateurModal, setShowFormateurModal] = useState(false);
    const [availableFormateurs, setAvailableFormateurs] = useState([]);
    const [selectedFormateur, setSelectedFormateur] = useState('');
    const [assigningFormateur, setAssigningFormateur] = useState(false);

    // Edit Formation State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({
        nom: '',
        description: '',
        duree_estimee: '',
        date_debut: '',
        niveau_requis: 'Débutant',
        actif: true
    });
    const [updating, setUpdating] = useState(false);
    const [generatingCertificates, setGeneratingCertificates] = useState(false);

    useEffect(() => {
        fetchFormation();
        fetchEnrolledStudents();
    }, [id]);

    const fetchFormation = async () => {
        try {
            setLoading(true);
            const response = await formationAPI.getById(id);
            setFormation(response.data.formation);
        } catch (error) {
            console.error('Error fetching formation:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEnrolledStudents = async () => {
        try {
            const response = await formationAPI.getStudents(id);
            setEnrolledStudents(response.data.students);
        } catch (error) {
            console.error('Error fetching enrolled students:', error);
        }
    };

    const handleAssignStudent = async (e) => {
        e.preventDefault();
        try {
            setAssigning(true);
            await formationAPI.assignStudent(id, selectedStudent);
            // Refresh formation to see updated stats or list
            fetchFormation();
            fetchEnrolledStudents();
            // Also need to fetch students list again if we displayed it
            setShowAssignModal(false);
            setSelectedStudent('');
            alert('Élève assigné avec succès');
        } catch (error) {
            console.error('Error assigning student:', error);
            alert('Erreur lors de l\'assignation (ex: déjà inscrit)');
        } finally {
            setAssigning(false);
        }
    };

    const handleAssignFormateur = async (e) => {
        e.preventDefault();
        try {
            setAssigningFormateur(true);
            // Updating the formation's responsable_id
            await formationAPI.update(id, { responsable_id: selectedFormateur });
            fetchFormation();
            setShowFormateurModal(false);
            setSelectedFormateur('');
            alert('Formateur assigné avec succès');
        } catch (error) {
            console.error('Error assigning formateur:', error);
            alert('Erreur lors de l\'assignation du formateur');
        } finally {
            setAssigningFormateur(false);
        }
    };

    const handleEditClick = () => {
        setEditData({
            nom: formation.nom,
            description: formation.description,
            duree_estimee: formation.duree_estimee || '',
            date_debut: formation.date_debut ? new Date(formation.date_debut).toISOString().split('T')[0] : '',
            niveau_requis: formation.niveau_requis || 'Débutant',
            actif: formation.actif
        });
        setShowEditModal(true);
    };

    const handleUpdateFormation = async (e) => {
        e.preventDefault();
        try {
            setUpdating(true);
            await formationAPI.update(id, editData);
            fetchFormation();
            setShowEditModal(false);
            alert('Formation mise à jour avec succès');
        } catch (error) {
            console.error('Error updating formation:', error);
            alert('Erreur lors de la mise à jour');
        } finally {
            setUpdating(false);
        }
    };

    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleGenerateCertificates = async () => {
        if (!window.confirm('Voulez-vous générer les certificats pour tous les élèves éligibles de cette formation ?')) {
            return;
        }

        try {
            setGeneratingCertificates(true);
            const response = await certificationAPI.generateBulk(id);
            alert(response.message);
            // Refresh detail to potentially show updated student statuses
            fetchEnrolledStudents();
        } catch (error) {
            console.error('Error generating certificates:', error);
            alert('Erreur lors de la génération des certificats');
        } finally {
            setGeneratingCertificates(false);
        }
    };

    const openAssignModal = async () => {
        // Fetch students to populate the select
        // In a real app, this should be a searchable dropdown
        try {
            const response = await studentAPI.getAll();
            setAvailableStudents(response.data.eleves);
            setShowAssignModal(true);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const openFormateurModal = async () => {
        try {
            // Fetch formateurs and responsables
            const response = await userAPI.getAll();
            // Filter to keep only formateurs (no responsables or admins as requested)
            const eligible = response.data.users.filter(u => u.role === 'formateur');
            setAvailableFormateurs(eligible);
            setShowFormateurModal(true);
        } catch (error) {
            console.error('Error fetching formateurs:', error);
        }
    };

    if (loading) return <div className="loading-state">Chargement...</div>;
    if (!formation) return <div className="empty-state">Formation non trouvée</div>;

    const canAssign = isResponsable && !formation.actif; // "affect them to non actif formations only"

    return (
        <div className="formation-detail">
            <div className="page-header">
                <div>
                    <Button variant="ghost" onClick={() => navigate('/formations')}>
                        ← Retour
                    </Button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <h1>{formation.nom}</h1>
                        {isResponsable && (
                            <Button size="small" variant="secondary" onClick={handleEditClick}>
                                ✏️ Modifier
                            </Button>
                        )}
                    </div>
                    <span className={`status-badge ${formation.actif ? 'active' : 'inactive'}`}>
                        {formation.actif ? 'Active' : 'Non Active'}
                    </span>
                    {!formation.actif && isResponsable && (
                        <Button
                            variant="success"
                            size="small"
                            onClick={handleGenerateCertificates}
                            loading={generatingCertificates}
                            style={{ marginLeft: '15px' }}
                        >
                            🎓 Générer les Certificats
                        </Button>
                    )}
                </div>
            </div>

            <div className="detail-grid">
                <Card className="main-info">
                    <h3>Informations Générales</h3>
                    <p>{formation.description}</p>
                    <div className="info-row">
                        <div><strong>Durée:</strong> {formation.duree_mois} mois</div>
                        <div><strong>Début:</strong> {new Date(formation.date_debut).toLocaleDateString()}</div>
                        <div><strong>Niveau Actuel:</strong> {formation.niveau_actuel ? `Niveau ${formation.niveau_actuel}` : 'N/A'}</div>
                        <div><strong>Niveau requis:</strong> {formation.niveau_requis}</div>
                        <div>
                            <strong>Responsable:</strong> {formation.responsable_id?.nom} {formation.responsable_id?.prenom}
                            {isResponsable && (
                                <Button size="small" variant="secondary" onClick={openFormateurModal} style={{ marginLeft: '10px' }}>
                                    Modifier
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>

                <Card className="levels-card">
                    <div className="card-header">
                        <h3>Niveaux ({formation.niveaux?.length || 0})</h3>
                    </div>
                    <div className="levels-list">
                        {formation.niveaux?.map((niveau, index) => (
                            <div key={niveau._id} className={`level-item ${formation.niveau_actuel === niveau.numero ? 'current-level' : ''}`}>
                                <div className="level-header-row">
                                    <div className="level-number">{index + 1}</div>
                                    <div className="level-info">
                                        <h4>{niveau.nom}</h4>
                                        <p>{niveau.description}</p>
                                    </div>
                                    <span className={`level-status-badge ${formation.niveau_actuel > niveau.numero ? 'completed' : formation.niveau_actuel === niveau.numero ? 'active' : 'locked'}`}>
                                        {formation.niveau_actuel > niveau.numero ? 'Terminé' : formation.niveau_actuel === niveau.numero ? 'En cours' : 'Bloqué'}
                                    </span>
                                </div>

                                <div className="level-sessions">
                                    <h5>Séances du niveau</h5>
                                    <div className="sessions-list-mini">
                                        {niveau.seances?.map((seance) => (
                                            <div key={seance._id} className={`session-item-mini ${seance.statut}`}>
                                                <div className="session-mini-info">
                                                    <span className="session-num">S{seance.numero}</span>
                                                    <span className="session-date">{new Date(seance.date).toLocaleDateString()}</span>
                                                </div>
                                                <Button
                                                    size="small"
                                                    variant="ghost"
                                                    onClick={() => navigate(`/sessions/${seance._id}`)}
                                                    disabled={formation.niveau_actuel < niveau.numero}
                                                >
                                                    {seance.statut === 'terminee' ? 'Consulter' : 'Gérer'}
                                                </Button>
                                            </div>
                                        ))}
                                        {(!niveau.seances || niveau.seances.length === 0) && (
                                            <p className="no-sessions">Aucune séance générée.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="students-card">
                    <div className="card-header">
                        <h3>Élèves Inscrits ({enrolledStudents.length})</h3>
                        {canAssign && (
                            <Button size="small" onClick={openAssignModal}>
                                + Inscrire un élève
                            </Button>
                        )}
                    </div>

                    {enrolledStudents.length > 0 ? (
                        <div className="students-grid" style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                            {enrolledStudents.map(ef => (
                                <div key={ef._id} style={{
                                    padding: '10px',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-md)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '5px'
                                }}>
                                    <div style={{ fontWeight: '600' }}>
                                        {ef.eleve_id?.nom} {ef.eleve_id?.prenom}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                        Inscrit le: {new Date(ef.date_inscription).toLocaleDateString()}
                                    </div>
                                    <div style={{ fontSize: '0.85rem' }}>
                                        Statut: <span style={{
                                            color: ef.statut === 'en_cours' ? 'var(--color-primary)' :
                                                ef.statut === 'complete' ? 'var(--color-success)' : 'var(--color-danger)'
                                        }}>{ef.statut}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="placeholder-text">
                            {canAssign
                                ? "Aucun élève inscrit. Utilisez le bouton pour inscrire des élèves."
                                : formation.actif
                                    ? "Les inscriptions sont fermées (Formation Active)."
                                    : "Vous n'avez pas les droits pour inscrire des élèves."}
                        </p>
                    )}
                </Card>
            </div>

            <Modal
                isOpen={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                title="Inscrire un élève"
            >
                <form onSubmit={handleAssignStudent}>
                    <div className="input-group">
                        <label className="input-label">Choisir un élève</label>
                        <select
                            className="input"
                            value={selectedStudent}
                            onChange={(e) => setSelectedStudent(e.target.value)}
                            required
                        >
                            <option value="">-- Sélectionner --</option>
                            {availableStudents.map(student => (
                                <option key={student._id} value={student._id}>
                                    {student.nom} {student.prenom} ({student.email})
                                </option>
                            ))}
                        </select>
                    </div>
                    <p className="helper-text">
                        Note: Seuls les élèves non encore inscrits peuvent être sélectionnés.
                    </p>
                    <div className="modal-actions">
                        <Button type="submit" loading={assigning} fullWidth>
                            Inscrire
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setShowAssignModal(false)} fullWidth>
                            Annuler
                        </Button>
                    </div>
                </form>
            </Modal>
            {/* Formateur Assignment Modal */}
            <Modal
                isOpen={showFormateurModal}
                onClose={() => setShowFormateurModal(false)}
                title="Assigner un Formateur (Responsable)"
            >
                <form onSubmit={handleAssignFormateur}>
                    <div className="input-group">
                        <label className="input-label">Choisir un formateur</label>
                        <select
                            className="input"
                            value={selectedFormateur}
                            onChange={(e) => setSelectedFormateur(e.target.value)}
                            required
                        >
                            <option value="">-- Sélectionner --</option>
                            {availableFormateurs.map(formateur => (
                                <option key={formateur._id} value={formateur._id}>
                                    {formateur.nom} {formateur.prenom}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="modal-actions">
                        <Button type="submit" loading={assigningFormateur} fullWidth>
                            Assigner
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setShowFormateurModal(false)} fullWidth>
                            Annuler
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Edit Formation Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Modifier la Formation"
            >
                <form onSubmit={handleUpdateFormation}>
                    <Input
                        label="Titre"
                        name="nom"
                        value={editData.nom}
                        onChange={handleEditChange}
                        required
                    />
                    <Input
                        label="Description"
                        name="description"
                        value={editData.description}
                        onChange={handleEditChange}
                        required
                    />
                    <div className="form-row">
                        <Input
                            label="Durée estimée"
                            name="duree_estimee"
                            value={editData.duree_estimee}
                            onChange={handleEditChange}
                            required
                        />
                        <Input
                            label="Date de début"
                            type="date"
                            name="date_debut"
                            value={editData.date_debut}
                            onChange={handleEditChange}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Niveau requis</label>
                        <select
                            name="niveau_requis"
                            value={editData.niveau_requis}
                            onChange={handleEditChange}
                            className="input"
                        >
                            <option value="Débutant">Débutant</option>
                            <option value="Intermédiaire">Intermédiaire</option>
                            <option value="Avancé">Avancé</option>
                        </select>
                    </div>

                    <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                        <input
                            type="checkbox"
                            name="actif"
                            checked={editData.actif}
                            onChange={handleEditChange}
                            id="actif-chk"
                        />
                        <label htmlFor="actif-chk" style={{ marginBottom: 0 }}>Formation Active (Ouverte aux inscriptions)</label>
                    </div>

                    <div className="modal-actions">
                        <Button type="submit" loading={updating} fullWidth>
                            Enregistrer
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)} fullWidth>
                            Annuler
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default FormationDetail;
