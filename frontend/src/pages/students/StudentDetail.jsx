import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { studentAPI } from '../../api/students';
import { Button, Card, Modal, Input } from '../../components/ui';
import './StudentDetail.css';

/**
 * Student Detail Page
 * View and manage individual student details
 */
const StudentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isResponsable } = useAuth(); // Need to import useAuth
    const [student, setStudent] = useState(null);
    const [formations, setFormations] = useState([]);
    const [loading, setLoading] = useState(true);

    // Edit State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        date_naissance: '',
        adresse: ''
    });
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchStudent();
        fetchFormations();
    }, [id]);

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

    const fetchFormations = async () => {
        try {
            const response = await studentAPI.getFormations(id);
            setFormations(response.data.formations);
        } catch (error) {
            console.error('Error fetching formations:', error);
        }
    };

    const handleEditClick = () => {
        setEditData({
            nom: student.nom,
            prenom: student.prenom,
            email: student.email,
            telephone: student.telephone,
            date_naissance: student.date_naissance ? new Date(student.date_naissance).toISOString().split('T')[0] : '',
            adresse: student.adresse || ''
        });
        setShowEditModal(true);
    };

    const handleUpdateStudent = async (e) => {
        e.preventDefault();
        try {
            setUpdating(true);
            await studentAPI.update(id, editData);
            fetchStudent();
            setShowEditModal(false);
            alert('Élève mis à jour avec succès');
        } catch (error) {
            console.error('Error updating student:', error);
            alert('Erreur lors de la mise à jour');
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
                    {formations.length > 0 ? (
                        <div className="formations-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {formations.map((f) => (
                                <div key={f._id} style={{
                                    padding: '10px',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-md)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <h4 style={{ margin: 0 }}>{f.formation_id?.nom || 'Formation'}</h4>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                            Niveau: {f.niveau_actuel} | Statut: {f.statut}
                                        </p>
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
