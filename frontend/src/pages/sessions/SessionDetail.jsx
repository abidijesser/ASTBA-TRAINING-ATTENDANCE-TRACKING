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

            // Initialize attendance map with status mapping
            const initialMap = {};
            attendanceRes.data.forEach(student => {
                // Map backend enums to UI labels
                let uiStatus = 'Absent';
                if (student.statut === 'present') uiStatus = 'Présent';
                else if (student.statut === 'absent') uiStatus = 'Absent';
                else if (student.statut === 'retard') uiStatus = 'Retard';
                else if (student.statut === 'justifie') uiStatus = 'Excusé';

                initialMap[student._id] = uiStatus;
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

            // Map UI labels back to backend enums
            const statusMap = {
                'Présent': 'present',
                'Absent': 'absent',
                'Retard': 'retard',
                'Excusé': 'justifie'
            };

            const attendanceData = Object.entries(attendanceMap).map(([eleve_id, uiStatus]) => ({
                eleve_id,
                statut: statusMap[uiStatus] || 'absent'
            }));

            // The sessionAPI.markAttendance helper already wraps the argument in { attendances: ... }
            await sessionAPI.markAttendance(id, attendanceData);
            alert('Présences enregistrées avec succès !');
            fetchSessionData(); // Refresh data
        } catch (error) {
            console.error('Error saving attendance:', error);
            alert("Erreur lors de l'enregistrement des présences");
        } finally {
            setSubmitting(false);
        }
    };

    const handleFinishSession = async () => {
        if (!window.confirm('Êtes-vous sûr de vouloir terminer cette séance ? Cette action est irréversible.')) return;

        try {
            setSubmitting(true);
            const res = await sessionAPI.finish(id);
            alert(res.message || 'Séance terminée avec succès !');
            fetchSessionData();
        } catch (error) {
            console.error('Error finishing session:', error);
            alert(error.response?.data?.message || 'Erreur lors de la validation de la séance');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="loading-state">Chargement...</div>;
    if (!session) return <div className="empty-state">Séance non trouvée</div>;

    const isFinished = session.statut === 'terminee';

    return (
        <div className="session-detail">
            <div className="page-header">
                <div>
                    <Button variant="ghost" onClick={() => navigate('/sessions')}>
                        ← Retour aux séances
                    </Button>
                    <h1>Séance du {new Date(session.date).toLocaleDateString()}</h1>
                    <div className="session-status-badges">
                        <span className={`badge level-badge`}>{session.niveau_id?.nom}</span>
                        <span className={`badge type-badge`}>{session.type}</span>
                        <span className={`badge status-badge ${session.statut}`}>{session.statut}</span>
                    </div>
                </div>
                <div className="header-actions">
                    {!isFinished && (
                        <>
                            <Button onClick={handleSaveAttendance} loading={submitting} variant="secondary">
                                Enregistrer les présences
                            </Button>
                            <Button onClick={handleFinishSession} loading={submitting} variant="primary">
                                Terminer la séance
                            </Button>
                        </>
                    )}
                    {isFinished && (
                        <span className="finished-message">✅ Séance terminée</span>
                    )}
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
                                                        onClick={() => !isFinished && handleAttendanceChange(student._id, 'Présent')}
                                                        disabled={isFinished}
                                                    >
                                                        P
                                                    </button>
                                                    <button
                                                        className={`status-btn absent ${attendanceMap[student._id] === 'Absent' ? 'active' : ''}`}
                                                        onClick={() => !isFinished && handleAttendanceChange(student._id, 'Absent')}
                                                        disabled={isFinished}
                                                    >
                                                        A
                                                    </button>
                                                    <button
                                                        className={`status-btn retard ${attendanceMap[student._id] === 'Retard' ? 'active' : ''}`}
                                                        onClick={() => !isFinished && handleAttendanceChange(student._id, 'Retard')}
                                                        disabled={isFinished}
                                                    >
                                                        R
                                                    </button>
                                                    <button
                                                        className={`status-btn excuse ${attendanceMap[student._id] === 'Excusé' ? 'active' : ''}`}
                                                        onClick={() => !isFinished && handleAttendanceChange(student._id, 'Excusé')}
                                                        disabled={isFinished}
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
