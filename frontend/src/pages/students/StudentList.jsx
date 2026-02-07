import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';
import { studentAPI } from '../../api/students';
import { formationAPI } from '../../api/formations';
import { Button, Card, Modal, Input } from '../../components/ui';
import './StudentList.css';

/**
 * Student List Page
 * View, search, and manage students
 */
const StudentList = () => {
    const { isResponsable } = useAuth();
    const { showAlert, showConfirm, showError, showSuccess } = useDialog();
    const [students, setStudents] = useState([]);
    const [formations, setFormations] = useState([]); // Formations for assignment
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        date_naissance: '',
        adresse: '',
        formation_id: '', // For immediate assignment
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchStudents();
        fetchFormations();
    }, []);

    const fetchFormations = async () => {
        try {
            // Only fetch active formations for assignment
            const response = await formationAPI.getAll({ actif: true });
            setFormations(response.data.formations);
        } catch (error) {
            console.error('Error fetching formations:', error);
        }
    };

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await studentAPI.getAll({ search });
            setStudents(response.data.eleves);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchStudents();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.nom) newErrors.nom = 'Nom requis';
        if (!formData.prenom) newErrors.prenom = 'Prénom requis';
        if (!formData.email) newErrors.email = 'Email requis';
        if (!formData.telephone) newErrors.telephone = 'Téléphone requis';
        if (!formData.date_naissance) newErrors.date_naissance = 'Date de naissance requise';
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            setSubmitting(true);
            const response = await studentAPI.create({
                nom: formData.nom,
                prenom: formData.prenom,
                email: formData.email,
                telephone: formData.telephone,
                date_naissance: formData.date_naissance,
                adresse: formData.adresse,
            });

            // If formation selected, assign it
            if (formData.formation_id) {
                try {
                    await formationAPI.assignStudent(formData.formation_id, response.data.eleve._id);
                } catch (assignError) {
                    console.error('Error assigning formation:', assignError);
                    showAlert("L'élève a été créé mais l'inscription à la formation a échoué.");
                }
            }

            setShowCreateModal(false);
            setFormData({
                nom: '',
                prenom: '',
                email: '',
                telephone: '',
                date_naissance: '',
                adresse: '',
                formation_id: '',
            });
            fetchStudents();
        } catch (error) {
            console.error('Error creating student:', error);
            showError(error.response?.data?.message || 'Erreur lors de la création');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await showConfirm('Êtes-vous sûr de vouloir supprimer cet élève ?', 'Supprimer l\'élève');
        if (confirmed) {
            try {
                await studentAPI.delete(id);
                fetchStudents();
            } catch (error) {
                console.error('Error deleting student:', error);
            }
        }
    };

    return (
        <div className="student-list">
            <div className="page-header">
                <div>
                    <h1>Gestion des Élèves</h1>
                    <p>Gérer les informations des élèves</p>
                </div>
                {isResponsable && (
                    <Button onClick={() => setShowCreateModal(true)} className="btn-new">
                        + Nouvel Élève
                    </Button>
                )}
            </div>

            <Card className="search-card">
                <form onSubmit={handleSearch} className="search-form">
                    <input
                        type="text"
                        placeholder="Rechercher par nom, prénom ou email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-input"
                    />
                    <Button type="submit">Rechercher</Button>
                </form>
            </Card>

            {loading ? (
                <div className="loading-state">Chargement...</div>
            ) : students.length === 0 ? (
                <Card className="empty-state">
                    <p>Aucun élève trouvé</p>
                </Card>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Prénom</th>
                                <th>Email</th>
                                <th>Téléphone</th>
                                <th>Date de naissance</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student) => (
                                <tr key={student._id}>
                                    <td>{student.nom}</td>
                                    <td>{student.prenom}</td>
                                    <td>{student.email}</td>
                                    <td>{student.telephone}</td>
                                    <td>{new Date(student.date_naissance).toLocaleDateString()}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <Link to={`/students/${student._id}`} className="btn-icon">
                                                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                </svg>
                                            </Link>
                                            {isResponsable && (
                                                <button onClick={() => handleDelete(student._id)} className="btn-icon btn-danger">
                                                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Nouvel Élève"
            >
                <form onSubmit={handleSubmit}>
                    <Input
                        label="Nom"
                        name="nom"
                        value={formData.nom}
                        onChange={handleChange}
                        error={errors.nom}
                        required
                    />
                    <Input
                        label="Prénom"
                        name="prenom"
                        value={formData.prenom}
                        onChange={handleChange}
                        error={errors.prenom}
                        required
                    />
                    <Input
                        label="Email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        error={errors.email}
                        required
                    />
                    <Input
                        label="Téléphone"
                        name="telephone"
                        value={formData.telephone}
                        onChange={handleChange}
                        error={errors.telephone}
                        required
                    />
                    <Input
                        label="Date de naissance"
                        type="date"
                        name="date_naissance"
                        value={formData.date_naissance}
                        onChange={handleChange}
                        error={errors.date_naissance}
                        required
                    />
                    <Input
                        label="Adresse"
                        name="adresse"
                        value={formData.adresse}
                        onChange={handleChange}
                    />

                    <div className="input-group">
                        <label className="input-label">Assigner à une formation (Optionnel)</label>
                        <select
                            name="formation_id"
                            value={formData.formation_id}
                            onChange={handleChange}
                            className="input"
                        >
                            <option value="">-- Aucune formation --</option>
                            {formations.map(f => (
                                <option key={f._id} value={f._id}>
                                    {f.nom} ({f.niveau_actuel || 'Active'})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                        <Button type="submit" fullWidth loading={submitting}>
                            Créer
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            fullWidth
                            onClick={() => setShowCreateModal(false)}
                        >
                            Annuler
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default StudentList;
