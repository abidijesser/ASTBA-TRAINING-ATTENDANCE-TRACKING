import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';
import { studentAPI } from '../../api/students';
import { formationAPI } from '../../api/formations';
import { attendanceAPI } from '../../api/attendance';
import { Button, Card, Modal, Input } from '../../components/ui';
import './StudentDetail.css';

/**
 * Student Detail Page
 * View and manage individual student details
 */
const StudentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isResponsable } = useAuth();
    const { showAlert, showError, showSuccess } = useDialog();
    const [student, setStudent] = useState(null);
    const [studentFormations, setStudentFormations] = useState([]);
    const [allFormations, setAllFormations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [attendanceStats, setAttendanceStats] = useState({});

    // Edit State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        date_naissance: '',
        adresse: '',
        selectedFormation: ''
    });
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchStudent();
        fetchStudentFormations();
        if (isResponsable) {
            fetchAllFormations();
        }
    }, [id, isResponsable]);

    const fetchStudent = async () => {
        try {
            setLoading(true);
            const response = await studentAPI.getById(id);
            setStudent(response.data.eleve);
        } catch (error) {
            console.error('Error fetching student:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentFormations = async () => {
        try {
            const response = await studentAPI.getFormations(id);
            setStudentFormations(response.data.formations);
            // Fetch attendance stats for each formation
            const statsPromises = (response.data.formations || []).map(async (f) => {
                const formationId = f.formation_id?._id || f.formation_id;
                if (!formationId) return null;
                try {
                    const res = await attendanceAPI.getStudentFormationAttendance(formationId, id);
                    return { formationId, stats: res.data.statistics };
                } catch (e) {
                    console.warn('Failed to fetch attendance stats', e);
                    return { formationId, stats: null };
                }
            });
            const results = await Promise.all(statsPromises);
            const mapped = {};
            results.filter(Boolean).forEach(({ formationId, stats }) => {
                mapped[formationId] = stats;
            });
            setAttendanceStats(mapped);
        } catch (error) {
            console.error('Error fetching student formations:', error);
        }
    };

    const fetchAllFormations = async () => {
        try {
            // Fetch only non-active or all? The user said "affecter un eleve a une formation"
            // Usually we assign to formations that are not yet active (open for registration)
            const response = await formationAPI.getAll();
            setAllFormations(response.data.formations || []);
        } catch (error) {
            console.error('Error fetching all formations:', error);
        }
    };

    const handleEditClick = () => {
        setEditData({
            nom: student.nom,
            prenom: student.prenom,
            email: student.email,
            telephone: student.telephone,
            date_naissance: student.date_naissance ? new Date(student.date_naissance).toISOString().split('T')[0] : '',
            adresse: student.adresse || '',
            selectedFormation: '' // Reset selection on edit click
        });
        setShowEditModal(true);
    };

    const handleUpdateStudent = async (e) => {
        e.preventDefault();
        try {
            setUpdating(true);

            // 1. Update basic info
            const { selectedFormation, ...basicInfo } = editData;
            await studentAPI.update(id, basicInfo);

            // 2. Handle formation assignment if selected
            if (selectedFormation) {
                try {
                    await formationAPI.assignStudent(selectedFormation, id);
                } catch (assignError) {
                    console.error('Error assigning formation:', assignError);
                    showAlert('L\'élève a été mis à jour, mais l\'assignation à la formation a échoué (déjà inscrit ?)');
                }
            }

            fetchStudent();
            fetchStudentFormations();
            setShowEditModal(false);
            showSuccess('Données mises à jour avec succès');
        } catch (error) {
            console.error('Error updating student:', error);
            showError('Erreur lors de la mise à jour');
        } finally {
            setUpdating(false);
        }
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
    };

    if (loading) {
        return <div className="loading-state">Chargement...</div>;
    }

    if (!student) {
        return <div className="empty-state">Élève non trouvé</div>;
    }

    return (
        <div className="student-detail">
            <div className="page-header">
                <div>
                    <Button variant="ghost" onClick={() => navigate(-1)}>
                        ← Retour
                    </Button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <h1>{student.nom} {student.prenom}</h1>
                        {isResponsable && (
                            <Button size="small" variant="secondary" onClick={handleEditClick}>
                                ✏️ Modifier
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="detail-grid">
                <Card>
                    <h3>Informations personnelles</h3>
                    <div className="info-grid">
                        <div className="info-item">
                            <div className="info-label">Nom</div>
                            <div className="info-value">{student.nom}</div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Prénom</div>
                            <div className="info-value">{student.prenom}</div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Email</div>
                            <div className="info-value">{student.email}</div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Téléphone</div>
                            <div className="info-value">{student.telephone}</div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Date de naissance</div>
                            <div className="info-value">
                                {new Date(student.date_naissance).toLocaleDateString()}
                            </div>
                        </div>
                        {student.adresse && (
                            <div className="info-item">
                                <div className="info-label">Adresse</div>
                                <div className="info-value">{student.adresse}</div>
                            </div>
                        )}
                    </div>
                </Card>

                <Card>
                    <h3>Formations</h3>
                    {studentFormations.length > 0 ? (
                        <div className="formations-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {studentFormations.map((f) => (
                                <div key={f._id} style={{
                                    padding: '10px',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-md)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: 0 }}>{f.formation_id?.nom || 'Formation'}</h4>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                            Niveau: {f.niveau_actuel} | Statut: {f.statut}
                                        </p>
                                        {/* Progress bar and stats */}
                                        {(() => {
                                            const fid = f.formation_id?._id || f.formation_id;
                                            const st = attendanceStats[fid];
                                            if (!st) return null;
                                            const pct = Math.min(100, Math.max(0, st.pourcentage_presence || 0));
                                            const present = st.present || 0;
                                            const absent = st.absent || 0;
                                            const total = st.total_seances || 0;
                                            return (
                                                <div style={{ marginTop: '8px' }}>
                                                    <div style={{
                                                        width: '100%',
                                                        height: '12px',
                                                        background: 'var(--color-border)',
                                                        borderRadius: '8px',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <div style={{
                                                            width: `${pct}%`,
                                                            height: '100%',
                                                            background: 'var(--color-success)',
                                                            transition: 'width 0.3s ease'
                                                        }} />
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '6px' }}>
                                                        <span>Progression: {pct}%</span>
                                                        <span>Présences: {present}/{total}</span>
                                                        <span>Absences: {absent}/{total}</span>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                        {new Date(f.date_inscription).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-4)' }}>
                            Aucune formation assignée
                        </p>
                    )}
                </Card>
            </div>

            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Modifier l'élève"
            >
                <form onSubmit={handleUpdateStudent}>
                    <Input
                        label="Nom"
                        name="nom"
                        value={editData.nom}
                        onChange={handleEditChange}
                        required
                    />
                    <Input
                        label="Prénom"
                        name="prenom"
                        value={editData.prenom}
                        onChange={handleEditChange}
                        required
                    />
                    <Input
                        label="Email"
                        type="email"
                        name="email"
                        value={editData.email}
                        onChange={handleEditChange}
                        required
                    />
                    <Input
                        label="Téléphone"
                        name="telephone"
                        value={editData.telephone}
                        onChange={handleEditChange}
                        required
                    />
                    <Input
                        label="Date de naissance"
                        type="date"
                        name="date_naissance"
                        value={editData.date_naissance}
                        onChange={handleEditChange}
                        required
                    />
                    <Input
                        label="Adresse"
                        name="adresse"
                        value={editData.adresse}
                        onChange={handleEditChange}
                    />

                    {isResponsable && (
                        <div className="input-group">
                            <label className="input-label">Assigner à une nouvelle formation</label>
                            <select
                                className="input"
                                name="selectedFormation"
                                value={editData.selectedFormation}
                                onChange={handleEditChange}
                            >
                                <option value="">-- Ne pas changer / Pas d'assignation --</option>
                                {allFormations
                                    .filter(f => f.actif) // Only show active formations
                                    .filter(f => !studentFormations.some(sf => sf.formation_id?._id === f._id)) // Only show ones not already in
                                    .map(formation => (
                                        <option key={formation._id} value={formation._id}>
                                            {formation.nom}
                                        </option>
                                    ))}
                            </select>
                            <p className="helper-text">
                                L'élève sera ajouté au niveau 1 de la formation sélectionnée.
                            </p>
                        </div>
                    )}

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

export default StudentDetail;
