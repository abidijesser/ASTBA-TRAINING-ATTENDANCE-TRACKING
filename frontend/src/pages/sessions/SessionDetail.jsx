import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessionAPI } from '../../api/sessions';
import { usePreferences } from '../../context/PreferenceContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useDialog } from '../../context/DialogContext';
import { Button, Card } from '../../components/ui';
import cameraIcon from '../../assets/icons/camera.svg';
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
    const [announcement, setAnnouncement] = useState('');
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
    const cameraStartRef = useRef(0);
    const gestureIndicatorRef = useRef(null);
    const [gestureIndicator, setGestureIndicator] = useState(null); // 'present' | 'absent' | null
    const autoStartedRef = useRef(false);

    const { user } = useAuth();
    const { prefs, t: prefsT, setPrefs } = usePreferences();
    const { t, language } = useLanguage();

    // Sourd+Muet: marquage présence uniquement via caméra/gestes
    // IMPORTANT: ne pas utiliser signLanguageMode ici, car il peut être activé pour un user normal (ex: hint interprète).
    const cameraOnlyAttendance = !!prefs.deafMuteMode;

    const getStatusPillClass = (uiStatus) => {
        if (uiStatus === 'Présent') return 'present';
        if (uiStatus === 'Absent') return 'absent';
        return 'unmarked';
    };

    useEffect(() => {
        fetchSessionData();
    }, [id]);

    useEffect(() => {
        autoStartedRef.current = false;
    }, [id]);

    const fetchSessionData = async () => {
        try {
            setLoading(true);
            // Fetch session details
            const sessionRes = await sessionAPI.getById(id);
            setSession(sessionRes.data.seance);

            // Fetch attendance list (which includes students assigned to the formation)
            const attendanceRes = await sessionAPI.getAttendance(id);
            setStudents(attendanceRes.data);

            // Initialize attendance map with status mapping
            const initialMap = {};
            attendanceRes.data.forEach(student => {
                // Set UI status based on existing record; leave empty if not marked
                let uiStatus = '';
                if (student.statut === 'present') uiStatus = 'present'; // Keep technical key
                else if (student.statut === 'absent') uiStatus = 'absent'; // Keep technical key
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
        if (cameraOnlyAttendance) return;
        setAttendanceMap(prev => ({
            ...prev,
            [studentId]: status
        }));
    };

    const handleSaveAttendance = async () => {
        try {
            setSavingAttendance(true);

            // Map UI labels back to backend enums
            // In new implementation using technical keys 'present'/'absent' directly

            const attendanceData = Object.entries(attendanceMap).map(([eleve_id, uiStatus]) => ({
                eleve_id,
                statut: uiStatus || 'absent'
            }));

            // The sessionAPI.markAttendance helper already wraps the argument in { attendances: ... }
            await sessionAPI.markAttendance(id, attendanceData);
            showSuccess(t('session.attendanceSuccess'));
            try {
                if (prefs.voiceEnabled) {
                    const utter = new SpeechSynthesisUtterance(t('session.presenceRecorded'));
                    let langCode = 'fr-FR';
                    if (prefs.language === 'ar') langCode = 'ar';
                    else if (prefs.language === 'en') langCode = 'en-US';
                    utter.lang = langCode;
                    globalThis.speechSynthesis.cancel();
                    globalThis.speechSynthesis.speak(utter);
                }
                // Trigger sign clip for confirmation if sign mode is on
                if (prefs.signLanguageMode) {
                    try { globalThis.playSign?.('presenceRecorded'); } catch { }
                }
            } catch { }
            fetchSessionData(); // Refresh data
        } catch (error) {
            console.error('Error saving attendance:', error);
            showError(t('session.attendanceError'));
        } finally {
            setSavingAttendance(false);
        }
    };

    // Removed unused markAllPresent

    // Guided mode helpers
    const speakText = (text, { force = false } = {}) => {
        try {
            if (!prefs.voiceEnabled && !force) return;
            const utter = new SpeechSynthesisUtterance(text);
            let langCode = 'fr-FR';
            if (prefs.language === 'ar') langCode = 'ar';
            else if (prefs.language === 'en') langCode = 'en-US';
            utter.lang = langCode;
            globalThis.speechSynthesis.cancel();
            globalThis.speechSynthesis.speak(utter);
        } catch { }
    };

    const startGuidedMode = ({ forceVoice = true } = {}) => {
        setGuidedMode(true);
        setCurrentIndex(0);
        currentIndexRef.current = 0;
        if (forceVoice) {
            setPrefs((p) => ({ ...p, voiceEnabled: true }));
        }
        setCameraOn(true);
        const s = students[0];
        if (s) speakText(`${s.nom} ${s.prenom}`, { force: forceVoice });
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
            showSuccess(t('session.listCompleted'));
            advancingRef.current = false;
        }
    };

    const markCurrent = (statusLabel) => {
        const idx = currentIndexRef.current;
        const s = students[idx];
        if (!s) return;
        if (advancingRef.current) return; // already waiting to advance
        // statusLabel passed here is 'Présent' or 'Absent' from gesture detection
        // Convert to technical key
        const statusKey = statusLabel === 'Présent' ? 'present' : 'absent';

        setAttendanceMap((prev) => ({ ...prev, [s._id]: statusKey }));
        // Show visual indicator briefly
        try {
            setGestureIndicator(statusLabel === 'Présent' ? 'present' : 'absent');
            clearTimeout(gestureIndicatorRef.current);
            gestureIndicatorRef.current = setTimeout(() => setGestureIndicator(null), 1000);
        } catch { }
        advancingRef.current = true;
        // Block further gesture triggers during the wait window
        try {
            gestureCooldownRef.current = performance.now() + 2900;
        } catch { }
        advanceStudent();
    };

    useEffect(() => {
        currentIndexRef.current = currentIndex;
    }, [currentIndex]);

    // Camera + gesture detection using MediaPipe Hands via CDN
    useEffect(() => {
        if (!cameraOn) return;
        cameraStartRef.current = performance.now?.() || Date.now();
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
                // Let camera stabilize ~1.5s before detecting
                if (now - cameraStartRef.current < 1500) return;
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
                showSuccess(t('session.cameraActivated'));
                const process = async () => {
                    if (!videoRef.current || !handsRef.current) return;
                    await handsRef.current.send({ image: videoRef.current });
                    rafRef.current = requestAnimationFrame(process);
                };
                process();
            } catch (e) {
                console.error('Camera/Hands error', e);
                let msg = t('session.cameraError');
                if (e?.name === 'NotAllowedError') msg = t('session.cameraPermissionError');
                else if (e?.name === 'NotFoundError') msg = t('session.cameraNotFoundError');
                showError(msg);
                setCameraOn(false);
            }
        };
        load();
        return () => {
            cancelAnimationFrame(rafRef.current);
            try { handsRef.current?.close(); } catch { }
            try { stream?.getTracks()?.forEach((t) => t.stop()); } catch { }
            try { advanceTimerRef.current && clearTimeout(advanceTimerRef.current); } catch { }
        };
    }, [cameraOn, guidedMode]);

    const handleFinishSession = async () => {
        const confirmed = await showConfirm(t('session.finishConfirmMessage'), t('session.finishConfirmTitle'));
        if (!confirmed) return;

        try {
            setFinishingSession(true);
            const res = await sessionAPI.finish(id);

            // Announce session completion
            setAnnouncement(t('session.finishedAnnouncement'));

            // Check if level was unlocked from the response
            if (res.data?.levelCompleted || res.levelCompleted) {
                setTimeout(() => {
                    setAnnouncement(t('session.nextLevelUnlocked'));
                }, 1500);
            }

            showSuccess(res.message || t('session.finishSuccess'));
            fetchSessionData();
        } catch (error) {
            console.error('Error finishing session:', error);
            showError(error.response?.data?.message || t('session.finishError'));
        } finally {
            setFinishingSession(false);
        }
    };

    // Auto-start guided mode:
    // - Always auto-start for sourd-muet users (cameraOnlyAttendance)
    // - Also supports one-shot autoStartGuided (assistant CTA)
    useEffect(() => {
        const shouldAutoStart = cameraOnlyAttendance || prefs.autoStartGuided;
        if (!shouldAutoStart) return;
        if (autoStartedRef.current) return;
        if (guidedMode) return;
        if (!session || session.statut === 'terminee') return;
        if (user?.role !== 'formateur') return;
        if (!students || students.length === 0) return;

        autoStartedRef.current = true;
        startGuidedMode({ forceVoice: !cameraOnlyAttendance });

        if (prefs.autoStartGuided) {
            setPrefs((p) => ({ ...p, autoStartGuided: false }));
        }
    }, [cameraOnlyAttendance, prefs.autoStartGuided, guidedMode, session, students, user, setPrefs]);

    if (loading) return <div className="loading-state">{t('common.loading')}</div>;
    if (!session) return <div className="empty-state">{t('session.notFound')}</div>;

    const isFinished = session.statut === 'terminee';
    const canEditAttendance = user?.role === 'formateur';

    // Check if all attendance is marked
    const allAttendanceMarked = students.length > 0 && students.every(student =>
        attendanceMap[student._id] === 'present' || attendanceMap[student._id] === 'absent'
    );

    return (
        <div className="session-detail">
            <div className="page-header">
                <div>
                    <Button variant="ghost" onClick={() => navigate('/sessions')}>
                        ← {t('session.backToSessions')}
                    </Button>
                    <h1>{t('session.title')} {session.date ? new Date(session.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : (language === 'en' ? 'en-US' : 'fr-FR')) : ''}</h1>
                    <div className="session-status-badges">
                        <span className={`badge level-badge`}>{session.niveau_id?.nom}</span>
                        <span className={`badge type-badge`}>{session.type}</span>
                        <span className={`badge status-badge ${session.statut}`}>
                            {session.statut ? (t(`formation.status${session.statut.charAt(0).toUpperCase() + session.statut.slice(1)}`) || session.statut) : ''}
                        </span>
                    </div>
                </div>
                <div className="header-actions">
                    {!isFinished && canEditAttendance && (
                        <>
                            {cameraOnlyAttendance && (
                                <Button
                                    onClick={() => startGuidedMode({ forceVoice: true })}
                                    variant="secondary"
                                    aria-label="Activer la caméra pour marquer la présence"
                                    title="Caméra"
                                >
                                    <img className="session-icon" src={cameraIcon} alt="" aria-hidden="true" />
                                    <span className="sr-only">Caméra</span>
                                </Button>
                            )}
                            <Button onClick={handleSaveAttendance} loading={savingAttendance} variant="secondary">
                                {t('session.saveAttendance')}
                            </Button>
                            <Button
                                onClick={handleFinishSession}
                                loading={finishingSession}
                                variant="primary"
                                disabled={!allAttendanceMarked}
                                aria-disabled={!allAttendanceMarked}
                                aria-label={allAttendanceMarked ? t('session.finishSession') : t('session.finishSessionDisabled')}
                            >
                                {t('session.finishSession')}
                            </Button>
                        </>
                    )}
                    {isFinished && (
                        <span className="finished-message">✅ {t('session.sessionFinished')}</span>
                    )}
                </div>
            </div>

            <div className="detail-grid">
                <Card className="info-card">
                    <h3>{t('session.infoTitle')}</h3>
                    <div className="info-row">
                        <div><strong>{t('session.dateLabel')}</strong> {session.date ? new Date(session.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : (language === 'en' ? 'en-US' : 'fr-FR')) : ''}</div>
                        <div><strong>{t('session.timeLabel')}</strong> {session.heure_debut} - {session.heure_fin}</div>
                        <div><strong>{t('session.typeLabel')}</strong> {session.type}</div>
                        <div><strong>{t('session.formationLabel')}</strong> {session.niveau_id?.formation_id?.nom}</div>
                    </div>
                </Card>

                <Card className="attendance-card">
                    <h3>{t('session.attendanceListTitle')} ({students.length})</h3>

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
                            {gestureIndicator && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 12,
                                        right: 12,
                                        background: gestureIndicator === 'present' ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)',
                                        color: '#fff',
                                        borderRadius: 12,
                                        padding: '8px 12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        fontWeight: 600,
                                    }}
                                >
                                    <span style={{ fontSize: 20 }}>
                                        {gestureIndicator === 'present' ? '✊' : '🖐️'}
                                    </span>
                                    <span>{gestureIndicator === 'present' ? t('session.present') : t('session.absent')}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <output aria-live="polite" aria-atomic="true" className="sr-only">
                        {announcement}
                    </output>

                    <div className="attendance-list">
                        {students.length === 0 ? (
                            <p>{t('session.noStudents')}</p>
                        ) : (
                            <table className="attendance-table">
                                <thead>
                                    <tr>
                                        <th>{t('session.studentHeader')}</th>
                                        <th>{t('session.status')}</th>
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
                                                {cameraOnlyAttendance ? (
                                                    <span
                                                        className={`status-pill ${getStatusPillClass(attendanceMap[student._id])}`}
                                                        aria-label={attendanceMap[student._id] || 'Non marqué'}
                                                    >
                                                        {attendanceMap[student._id] || '—'}
                                                    </span>
                                                ) : (
                                                    <div className="status-buttons">
                                                        <button
                                                            type="button"
                                                            className={`status-btn present ${attendanceMap[student._id] === 'Présent' ? 'active' : ''}`}
                                                            onClick={() => !isFinished && canEditAttendance && handleAttendanceChange(student._id, 'Présent')}
                                                            disabled={isFinished || !canEditAttendance}
                                                            aria-label={`Marquer ${student.nom} ${student.prenom} comme présent`}
                                                            aria-pressed={attendanceMap[student._id] === 'Présent'}
                                                        >
                                                            P
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={`status-btn absent ${attendanceMap[student._id] === 'Absent' ? 'active' : ''}`}
                                                            onClick={() => !isFinished && canEditAttendance && handleAttendanceChange(student._id, 'Absent')}
                                                            disabled={isFinished || !canEditAttendance}
                                                            aria-label={`Marquer ${student.nom} ${student.prenom} comme absent`}
                                                            aria-pressed={attendanceMap[student._id] === 'Absent'}
                                                        >
                                                            A
                                                        </button>
                                                    </div>
                                                )}
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
