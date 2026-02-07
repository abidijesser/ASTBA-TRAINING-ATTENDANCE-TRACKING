import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessionAPI } from '../../api/sessions';
import { usePreferences } from '../../context/PreferenceContext';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';
import { Button, Card } from '../../components/ui';
import './SessionDetail.css';

const SessionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showConfirm, showError, showSuccess } = useDialog();
    const [session, setSession] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [attendanceMap, setAttendanceMap] = useState({});
    const [savingAttendance, setSavingAttendance] = useState(false);
    const [finishingSession, setFinishingSession] = useState(false);
    // Guided mode state
    const [guidedMode, setGuidedMode] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const currentIndexRef = useRef(0);
    const [cameraOn, setCameraOn] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const handsRef = useRef(null);
    const rafRef = useRef(null);
    const gestureCooldownRef = useRef(0);
    const advanceTimerRef = useRef(null);
    const advancingRef = useRef(false);

    const { user } = useAuth();
    const { prefs, t, setPrefs } = usePreferences();

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
                // Set UI status based on existing record; leave empty if not marked
                let uiStatus = '';
                if (student.statut === 'present') uiStatus = 'Présent';
                else if (student.statut === 'absent') uiStatus = 'Absent';
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
            setSavingAttendance(true);

            // Map UI labels back to backend enums
            const statusMap = {
                'Présent': 'present',
                'Absent': 'absent'
            };

            const attendanceData = Object.entries(attendanceMap).map(([eleve_id, uiStatus]) => ({
                eleve_id,
                statut: statusMap[uiStatus] || 'absent'
            }));

            // The sessionAPI.markAttendance helper already wraps the argument in { attendances: ... }
            await sessionAPI.markAttendance(id, attendanceData);
            showSuccess('Présences enregistrées avec succès !');
            try {
                if (prefs.voiceEnabled) {
                    const utter = new SpeechSynthesisUtterance(t('presenceRecorded'));
                    let langCode = 'fr-FR';
                    if (prefs.language === 'ar') langCode = 'ar';
                    else if (prefs.language === 'en') langCode = 'en-US';
                    utter.lang = langCode;
                    globalThis.speechSynthesis.cancel();
                    globalThis.speechSynthesis.speak(utter);
                }
            } catch {}
            fetchSessionData(); // Refresh data
        } catch (error) {
            console.error('Error saving attendance:', error);
            showError("Erreur lors de l'enregistrement des présences");
        } finally {
            setSavingAttendance(false);
        }
    };

    const markAllPresent = () => {
        const updated = {};
        students.forEach((s) => {
            updated[s._id] = 'Présent';
        });
        setAttendanceMap(updated);
        try {
            if (prefs.voiceEnabled) {
                const utter = new SpeechSynthesisUtterance(t('confirmPresenceAll'));
                let langCode = 'fr-FR';
                if (prefs.language === 'ar') langCode = 'ar';
                else if (prefs.language === 'en') langCode = 'en-US';
                utter.lang = langCode;
                globalThis.speechSynthesis.cancel();
                globalThis.speechSynthesis.speak(utter);
            }
        } catch {}
    };

    // Guided mode helpers
    const speakText = (text) => {
        try {
            if (!prefs.voiceEnabled) return;
            const utter = new SpeechSynthesisUtterance(text);
            let langCode = 'fr-FR';
            if (prefs.language === 'ar') langCode = 'ar';
            else if (prefs.language === 'en') langCode = 'en-US';
            utter.lang = langCode;
            globalThis.speechSynthesis.cancel();
            globalThis.speechSynthesis.speak(utter);
        } catch {}
    };

    const startGuidedMode = () => {
        setGuidedMode(true);
        setCurrentIndex(0);
        currentIndexRef.current = 0;
        setPrefs((p) => ({ ...p, voiceEnabled: true }));
        setCameraOn(true);
        const s = students[0];
        if (s) speakText(`${s.nom} ${s.prenom}`);
    };

    // Removed unused toggleVoice handler

    const advanceStudent = () => {
        const next = currentIndexRef.current + 1;
        if (next < students.length) {
            // Wait ~3 seconds before advancing to next student
            if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
            advanceTimerRef.current = setTimeout(() => {
                setCurrentIndex(next);
                currentIndexRef.current = next;
                advancingRef.current = false;
                const s = students[next];
                if (s) speakText(`${s.nom} ${s.prenom}`);
            }, 3000);
        } else {
            setGuidedMode(false);
            showSuccess('Liste terminée');
            advancingRef.current = false;
        }
    };

    const markCurrent = (statusLabel) => {
        const idx = currentIndexRef.current;
        const s = students[idx];
        if (!s) return;
        if (advancingRef.current) return; // already waiting to advance
        setAttendanceMap((prev) => ({ ...prev, [s._id]: statusLabel }));
        advancingRef.current = true;
        // Block further gesture triggers during the wait window
        try {
            gestureCooldownRef.current = performance.now() + 2900;
        } catch {}
        advanceStudent();
    };

    useEffect(() => {
        currentIndexRef.current = currentIndex;
    }, [currentIndex]);

    // Camera + gesture detection using MediaPipe Hands via CDN
    useEffect(() => {
        if (!cameraOn) return;
        let stream;
        const onResults = (results) => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (!ctx || !videoRef.current) return;
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const lm = results.multiHandLandmarks?.[0];
            if (lm) {
                ctx.fillStyle = '#3B82F6';
                lm.forEach((p) => ctx.fillRect(p.x * canvas.width, p.y * canvas.height, 4, 4));
                // Helper: finger extended if tip above pip
                const extended = [8, 12, 16, 20].reduce((acc, tipIdx) => {
                    const pipIdx = tipIdx - 2;
                    const tip = lm[tipIdx];
                    const pip = lm[pipIdx];
                    return acc + (tip.y < pip.y ? 1 : 0);
                }, 0);

                const now = performance.now();
                if (now < gestureCooldownRef.current) return;

                if (guidedMode) {
                    // Mapping: open palm -> Absent, fist -> Present
                    if (extended >= 3) {
                        markCurrent('Absent');
                        gestureCooldownRef.current = now + 1000;
                    } else if (extended <= 1) {
                        markCurrent('Présent');
                        gestureCooldownRef.current = now + 1000;
                    }
                }
            }
        };
        const load = async () => {
            try {
                if (!globalThis.Hands) {
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
                        script.onload = resolve;
                        script.onerror = reject;
                        document.body.appendChild(script);
                    });
                }
                const hands = new globalThis.Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
                hands.setOptions({ maxNumHands: 1, modelComplexity: 0, minDetectionConfidence: 0.7, minTrackingConfidence: 0.6 });
                hands.onResults(onResults);
                handsRef.current = hands;

                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }
                showSuccess('Caméra activée');
                const process = async () => {
                    if (!videoRef.current || !handsRef.current) return;
                    await handsRef.current.send({ image: videoRef.current });
                    rafRef.current = requestAnimationFrame(process);
                };
                process();
            } catch (e) {
                console.error('Camera/Hands error', e);
                let msg = 'La caméra ou le modèle de main est indisponible.';
                if (e?.name === 'NotAllowedError') msg = 'Autorisez la caméra dans le navigateur (blocage permissions).';
                else if (e?.name === 'NotFoundError') msg = 'Aucune caméra détectée sur l’appareil.';
                showError(msg);
                setCameraOn(false);
            }
        };
        load();
        return () => {
            cancelAnimationFrame(rafRef.current);
            try { handsRef.current?.close(); } catch {}
            try { stream?.getTracks()?.forEach((t) => t.stop()); } catch {}
            try { advanceTimerRef.current && clearTimeout(advanceTimerRef.current); } catch {}
        };
    }, [cameraOn, guidedMode]);

    const handleFinishSession = async () => {
        const confirmed = await showConfirm('Êtes-vous sûr de vouloir terminer cette séance ? Cette action est irréversible.', 'Terminer la séance');
        if (!confirmed) return;

        try {
            setFinishingSession(true);
            const res = await sessionAPI.finish(id);
            showSuccess(res.message || 'Séance terminée avec succès !');
            fetchSessionData();
        } catch (error) {
            console.error('Error finishing session:', error);
            showError(error.response?.data?.message || 'Erreur lors de la validation de la séance');
        } finally {
            setFinishingSession(false);
        }
    };

    // Auto-start guided mode when pref flag set (from assistant CTA)
    useEffect(() => {
        if (
            prefs.autoStartGuided &&
            !guidedMode &&
            session &&
            session.statut !== 'terminee' &&
            user?.role === 'formateur' &&
            students && students.length > 0
        ) {
            startGuidedMode();
            setPrefs((p) => ({ ...p, autoStartGuided: false }));
        }
    }, [prefs.autoStartGuided, guidedMode, session, students, user, setPrefs]);

    if (loading) return <div className="loading-state">Chargement...</div>;
    if (!session) return <div className="empty-state">Séance non trouvée</div>;

    const isFinished = session.statut === 'terminee';
    const canEditAttendance = user?.role === 'formateur';

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
                    {!isFinished && canEditAttendance && (
                        <>
                            <Button onClick={startGuidedMode} variant="secondary">
                                🧑‍🏫 Mode signes
                            </Button>
                            <Button onClick={handleSaveAttendance} loading={savingAttendance} variant="secondary">
                                Enregistrer les présences
                            </Button>
                            <Button onClick={handleFinishSession} loading={finishingSession} variant="primary">
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

                    {guidedMode && students[currentIndex] && (
                        <div className="guided-banner">
                            <div className="guided-name">
                                {students[currentIndex].nom} {students[currentIndex].prenom}
                            </div>
                        </div>
                    )}

                    {guidedMode && (
                        <div className="camera-box">
                            <video ref={videoRef} className="camera-video" playsInline muted />
                            <canvas ref={canvasRef} className="camera-canvas" />
                        </div>
                    )}

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
                                                        onClick={() => !isFinished && canEditAttendance && handleAttendanceChange(student._id, 'Présent')}
                                                        disabled={isFinished || !canEditAttendance}
                                                    >
                                                        P
                                                    </button>
                                                    <button
                                                        className={`status-btn absent ${attendanceMap[student._id] === 'Absent' ? 'active' : ''}`}
                                                        onClick={() => !isFinished && canEditAttendance && handleAttendanceChange(student._id, 'Absent')}
                                                        disabled={isFinished || !canEditAttendance}
                                                    >
                                                        A
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
