import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useDialog } from '../../context/DialogContext';
import { formationAPI } from '../../api/formations';
import { certificationAPI } from '../../api/certifications';
import { studentAPI } from '../../api/students';
import { userAPI } from '../../api/users';
import { Button, Card, Modal, Input } from '../../components/ui';
import './FormationDetail.css';

// Backend API base URL for non-Axios links (e.g., file downloads)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const FormationDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isResponsable } = useAuth();
    const { t } = useLanguage();
    const { showAlert, showConfirm, showError, showSuccess } = useDialog();

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
    const [levelAnnouncement, setLevelAnnouncement] = useState('');

    useEffect(() => {
        fetchFormation();
        fetchEnrolledStudents();
    }, [id]);

    // Watch for niveau_actuel changes to announce level unlock
    useEffect(() => {
        if (formation && formation.niveau_actuel) {
            // Only announce if level changed (not on initial load)
            const storedLevel = sessionStorage.getItem(`formation_${id}_level`);
            if (storedLevel && parseInt(storedLevel) < formation.niveau_actuel) {
                setLevelAnnouncement(t('formation.levelAccessible'));
            }
            sessionStorage.setItem(`formation_${id}_level`, formation.niveau_actuel.toString());
        }
    }, [formation?.niveau_actuel, id]);

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
            showSuccess(t('formation.assignSuccess'));
        } catch (error) {
            console.error('Error assigning student:', error);
            showError(t('formation.assignError'));
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
            showSuccess(t('formation.trainerAssignSuccess'));
        } catch (error) {
            console.error('Error assigning formateur:', error);
            showError(t('formation.trainerAssignError'));
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
            showSuccess(t('formation.updateSuccess'));
        } catch (error) {
            console.error('Error updating formation:', error);
            showError(t('formation.updateError'));
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
        const confirmed = await showConfirm(t('formation.generateCertificatesConfirm'), t('formation.generateCertificatesTitle'));
        if (!confirmed) {
            return;
        }

        try {
            setGeneratingCertificates(true);
            const response = await certificationAPI.generateBulk(id);
            showSuccess(response.message);
            // Refresh detail to potentially show updated student statuses
            fetchEnrolledStudents();
        } catch (error) {
            console.error('Error generating certificates:', error);
            showError(t('formation.generateCertificatesError'));
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

    if (loading) return <div className="loading-state">{t('common.loading')}</div>;
    if (!formation) return <div className="empty-state">{t('formation.notFound')}</div>;

    const canAssign = isResponsable && !formation.actif; // "affect them to non actif formations only"

    return (
        <div className="formation-detail">
            <div className="page-header">
                <div>
                    <Button variant="ghost" onClick={() => navigate('/formations')}>
                        ← {t('common.back')}
                    </Button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <h1>{formation.nom}</h1>
                        {isResponsable && (
                            <Button size="small" variant="secondary" onClick={handleEditClick}>
                                ✏️ {t('common.edit')}
                            </Button>
                        )}
                    </div>
                    <span className={`status-badge ${formation.actif ? 'active' : 'inactive'}`}>
                        {formation.actif ? t('formation.activeTrainings') : t('formation.inactiveTrainings')}
                    </span>
                    {!formation.actif && isResponsable && (
                        <Button
                            variant="success"
                            size="small"
                            onClick={handleGenerateCertificates}
                            loading={generatingCertificates}
                            style={{ marginLeft: '15px' }}
                        >
                            🎓 {t('formation.generateCertificates')}
                        </Button>
                    )}
                </div>
            </div>

            <div className="detail-grid">
                <Card className="main-info">
                    <h3>{t('formation.generalInfo')}</h3>
                    <p>{formation.description}</p>
                    <div className="info-row">
                        <div>
                            <strong>{t('formation.duration')}:</strong>{' '}
                            {Number.isFinite(parseInt(formation.duree_estimee))
                                ? `${parseInt(formation.duree_estimee)} ${t('formation.month')}`
                                : (formation.duree_estimee || '--')}
                        </div>
                        <div>
                            <strong>{t('formation.startDate')}:</strong>{' '}
                            {formation.date_debut
                                ? new Date(formation.date_debut).toLocaleDateString()
                                : '--'}
                        </div>
                        <div><strong>{t('formation.currentLevel')}:</strong> {formation.niveau_actuel ? `${t('student.level')} ${formation.niveau_actuel}` : 'N/A'}</div>
                        {/* Champ "Niveau requis" retiré de l'affichage */}
                        <div>
                            <strong>{t('formation.responsible')}:</strong> {formation.responsable_id?.nom} {formation.responsable_id?.prenom}
                            {isResponsable && (
                                <Button size="small" variant="secondary" onClick={openFormateurModal} style={{ marginLeft: '10px' }}>
                                    {t('common.edit')}
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>

                <Card className="media-card">
                    <div className="card-header">
                        <h3>{t('formation.media')}</h3>
                    </div>
                    {(() => {
                        const imageMedias = (formation.medias || []).filter(m => m.type === 'image');
                        if (imageMedias.length === 0) {
                            return <p className="text-muted">{t('formation.mediaError')}</p>;
                        }
                        return (
                            <div className="media-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
                                {imageMedias.map((m) => (
                                    <div key={m.publicId || m.url} className="media-item" style={{ border: '1px solid #eee', borderRadius: '8px', padding: '8px' }}>
                                        <a href={m.url} target="_blank" rel="noreferrer" title={t('common.view')}>
                                            <img src={m.url} alt={m.title || 'image'} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '6px' }} />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </Card>

                <Card className="levels-card">
                    <div className="card-header">
                        <h3>{t('formation.levelsTitle')} ({formation.niveaux?.length || 0})</h3>
                    </div>
                    <div className="levels-list">
                        {formation.niveaux?.map((niveau, index) => {
                            const isLocked = formation.niveau_actuel < niveau.numero;
                            const isAccessible = formation.niveau_actuel >= niveau.numero;
                            const statusLabel = formation.niveau_actuel > niveau.numero ? t('formation.statusCompleted') :
                                formation.niveau_actuel === niveau.numero ? t('formation.statusInProgress') : t('formation.statusLocked');

                            return (
                                <div
                                    key={niveau._id}
                                    className={`level-item ${formation.niveau_actuel === niveau.numero ? 'current-level' : ''}`}
                                    tabIndex={isLocked ? -1 : 0}
                                    aria-disabled={isLocked}
                                    aria-label={`${niveau.nom} - ${isLocked ? t('formation.levelLocked') : t('formation.levelAccessible')} - ${statusLabel}`}
                                    role="region"
                                >
                                    <div className="level-header-row">
                                        <div className="level-number">{index + 1}</div>
                                        <div className="level-info">
                                            <h4>{niveau.nom}</h4>
                                            <p>{niveau.description}</p>
                                        </div>
                                        <span className={`level-status-badge ${formation.niveau_actuel > niveau.numero ? 'completed' : formation.niveau_actuel === niveau.numero ? 'active' : 'locked'}`}>
                                            {statusLabel}
                                        </span>
                                    </div>

                                    <div className="level-sessions">
                                        <h5>{t('formation.levelSessions')}</h5>
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
                                                        aria-label={isLocked ? `Sessions ${seance.numero} - ${t('formation.levelLocked')}` : `${seance.statut === 'terminee' ? t('common.view') : t('common.manage')} session ${seance.numero}`}
                                                    >
                                                        {seance.statut === 'terminee' ? t('common.view') : t('common.manage')}
                                                    </Button>
                                                </div>
                                            ))}
                                            {(!niveau.seances || niveau.seances.length === 0) && (
                                                <p className="no-sessions">{t('formation.noSessions')}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Screen reader announcement for level unlock */}
                    <div
                        role="status"
                        aria-live="polite"
                        aria-atomic="true"
                        className="sr-only"
                    >
                        {levelAnnouncement}
                    </div>
                </Card>

                <Card className="students-card">
                    <div className="card-header">
                        <h3>{t('formation.enrolledStudents')} ({enrolledStudents.length})</h3>
                        {canAssign && (
                            <Button size="small" onClick={openAssignModal}>
                                + {t('formation.enrollStudent')}
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
                                        {t('student.enrolledOn')}: {new Date(ef.date_inscription).toLocaleDateString()}
                                    </div>
                                    <div style={{ fontSize: '0.85rem' }}>
                                        {t('student.status')}: <span style={{
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
                                ? t('formation.noStudentsEnrolled')
                                : formation.actif
                                    ? t('formation.enrollmentClosed')
                                    : t('formation.noPermissionEnroll')}
                        </p>
                    )}
                </Card>
            </div>

            <Modal
                isOpen={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                title={t('formation.enrollStudentTitle')}
            >
                <form onSubmit={handleAssignStudent}>
                    <div className="input-group">
                        <label className="input-label">{t('formation.selectStudent')}</label>
                        <select
                            className="input"
                            value={selectedStudent}
                            onChange={(e) => setSelectedStudent(e.target.value)}
                            required
                        >
                            <option value="">{t('common.select')}</option>
                            {availableStudents.map(student => (
                                <option key={student._id} value={student._id}>
                                    {student.nom} {student.prenom} ({student.email})
                                </option>
                            ))}
                        </select>
                    </div>
                    <p className="helper-text">
                        {t('formation.enrollNote')}
                    </p>
                    <div className="modal-actions">
                        <Button type="submit" loading={assigning} fullWidth>
                            {t('formation.enrollButton')}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setShowAssignModal(false)} fullWidth>
                            {t('common.cancel')}
                        </Button>
                    </div>
                </form>
            </Modal>
            {/* Formateur Assignment Modal */}
            <Modal
                isOpen={showFormateurModal}
                onClose={() => setShowFormateurModal(false)}
                title={t('formation.assignTrainerTitle')}
            >
                <form onSubmit={handleAssignFormateur}>
                    <div className="input-group">
                        <label className="input-label">{t('formation.selectTrainer')}</label>
                        <select
                            className="input"
                            value={selectedFormateur}
                            onChange={(e) => setSelectedFormateur(e.target.value)}
                            required
                        >
                            <option value="">{t('common.select')}</option>
                            {availableFormateurs.map(formateur => (
                                <option key={formateur._id} value={formateur._id}>
                                    {formateur.nom} {formateur.prenom}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="modal-actions">
                        <Button type="submit" loading={assigningFormateur} fullWidth>
                            {t('common.assign')}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setShowFormateurModal(false)} fullWidth>
                            {t('common.cancel')}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Edit Formation Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title={t('formation.editTitle')}
            >
                <form onSubmit={handleUpdateFormation}>
                    <Input
                        label={t('formation.name')}
                        name="nom"
                        value={editData.nom}
                        onChange={handleEditChange}
                        required
                    />
                    <Input
                        label={t('formation.description')}
                        name="description"
                        value={editData.description}
                        onChange={handleEditChange}
                        required
                    />
                    <div className="form-row">
                        <Input
                            label={t('formation.duration')}
                            name="duree_estimee"
                            value={editData.duree_estimee}
                            onChange={handleEditChange}
                            required
                        />
                        <Input
                            label={t('formation.startDate')}
                            type="date"
                            name="date_debut"
                            value={editData.date_debut}
                            onChange={handleEditChange}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">{t('formation.level')}</label>
                        <select
                            name="niveau_requis"
                            value={editData.niveau_requis}
                            onChange={handleEditChange}
                            className="input"
                        >
                            <option value="Débutant">{t('formation.beginner')}</option>
                            <option value="Intermédiaire">{t('formation.intermediate')}</option>
                            <option value="Avancé">{t('formation.advanced')}</option>
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
                        <label htmlFor="actif-chk" style={{ marginBottom: 0 }}>{t('formation.activeTrainingLabel')}</label>
                    </div>

                    <div className="modal-actions">
                        <Button type="submit" loading={updating} fullWidth>
                            {t('common.save')}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)} fullWidth>
                            {t('common.cancel')}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default FormationDetail;
