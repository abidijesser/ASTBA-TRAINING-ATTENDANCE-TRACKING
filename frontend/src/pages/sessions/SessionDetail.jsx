import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { sessionAPI } from '../../api/sessions';
import { Button, Card } from '../../components/ui';
import './SessionDetail.css';

const SessionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [attendanceMap, setAttendanceMap] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchSessionData();
    }, [id]);

    const fetchSessionData = async () => {
        try {
            setLoading(true);
            // Fetch session details
            const sessionRes = await sessionAPI.getById(id);
            setSession(sessionRes.data);

            // Fetch attendance list (which includes students assigned to the formation)
            const attendanceRes = await sessionAPI.getAttendance(id);
            setStudents(attendanceRes.data);

            // Initialize attendance map
            const initialMap = {};
            attendanceRes.data.forEach(student => {
                initialMap[student._id] = student.statut || 'Absent';
            });
            setAttendanceMap(initialMap);

        } catch (error) {
            console.error('Error fetching session data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAttendanceChange = (studentId, status) => {
        setAttendanceMap(prev => ({
            ...prev,
            [studentId]: status
        }));
    };

    const handleSaveAttendance = async () => {
        try {
            setSubmitting(true);
            const attendanceData = Object.entries(attendanceMap).map(([eleveId, statut]) => ({
                eleveId,
                statut
            }));

            await sessionAPI.markAttendance(id, { presences: attendanceData });
            alert('Présences enregistrées avec succès !');
            fetchSessionData(); // Refresh data
        } catch (error) {
            console.error('Error saving attendance:', error);
            alert("Erreur lors de l'enregistrement des présences");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="loading-state">Chargement...</div>;
    if (!session) return <div className="empty-state">Séance non trouvée</div>;

    return (
        <div className="session-detail">
            <div className="page-header">
                <div>
                    <Button variant="ghost" onClick={() => navigate('/sessions')}>
                        ← Retour aux séances
                    </Button>
                    <h1>Séance du {new Date(session.date).toLocaleDateString()}</h1>
                    <p>{session.niveau_id?.nom} - {session.type}</p>
                </div>
                <div className="header-actions">
                    <Button onClick={handleSaveAttendance} loading={submitting}>
                        Enregistrer les présences
                    </Button>
                </div>
            </div>

            <div className="detail-grid">
                <Card className="info-card">
                    <h3>Informations</h3>
                    <div className="info-row">
                        <div><strong>Date:</strong> {new Date(session.date).toLocaleDateString()}</div>
                        <div><strong>Horaire:</strong> {session.heure_debut} - {session.heure_fin}</div>
                        <div><strong>Type:</strong> {session.type}</div>
                        <div><strong>Formation:</strong> {session.niveau_id?.formation_id?.nom}</div>
                    </div>
                </Card>

                <Card className="attendance-card">
                    <h3>Liste de présence ({students.length})</h3>

                    <div className="attendance-list">
                        {students.length === 0 ? (
                            <p>Aucun élève inscrit à ce niveau.</p>
                        ) : (
                            <table className="attendance-table">
                                <thead>
                                    <tr>
                                        <th>Élève</th>
                                        <th>Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map(student => (
                                        <tr key={student._id}>
                                            <td>
                                                <div className="student-name">
                                                    {student.nom} {student.prenom}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="status-buttons">
                                                    <button
                                                        className={`status-btn present ${attendanceMap[student._id] === 'Présent' ? 'active' : ''}`}
                                                        onClick={() => handleAttendanceChange(student._id, 'Présent')}
                                                    >
                                                        P
                                                    </button>
                                                    <button
                                                        className={`status-btn absent ${attendanceMap[student._id] === 'Absent' ? 'active' : ''}`}
                                                        onClick={() => handleAttendanceChange(student._id, 'Absent')}
                                                    >
                                                        A
                                                    </button>
                                                    <button
                                                        className={`status-btn retard ${attendanceMap[student._id] === 'Retard' ? 'active' : ''}`}
                                                        onClick={() => handleAttendanceChange(student._id, 'Retard')}
                                                    >
                                                        R
                                                    </button>
                                                    <button
                                                        className={`status-btn excuse ${attendanceMap[student._id] === 'Excusé' ? 'active' : ''}`}
                                                        onClick={() => handleAttendanceChange(student._id, 'Excusé')}
                                                    >
                                                        E
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default SessionDetail;
