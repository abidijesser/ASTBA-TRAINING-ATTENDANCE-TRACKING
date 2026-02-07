import { useEffect, useMemo, useRef, useState } from 'react';
import { usePreferences } from '../context/PreferenceContext';
import { useNavigate } from 'react-router-dom';

function pickVoice(langCode) {
  try {
    const voices = globalThis.speechSynthesis.getVoices?.() || [];
    let target = 'fr';
    if (langCode === 'ar') target = 'ar';
    else if (langCode === 'en') target = 'en';
    // Prefer exact language match, then locale startsWith
    const exact = voices.find((v) => v.lang?.toLowerCase() === target);
    if (exact) return exact;
    const starts = voices.find((v) => v.lang?.toLowerCase().startsWith(target));
    return starts || voices[0] || null;
  } catch {
    return null;
  }
}

function speak(text, lang) {
  try {
    const voice = pickVoice(lang);
    const utter = new SpeechSynthesisUtterance(text);
    let langCode = 'fr-FR';
    if (lang === 'ar') langCode = 'ar';
    else if (lang === 'en') langCode = 'en-US';
    utter.lang = langCode;
    if (voice) utter.voice = voice;
    globalThis.speechSynthesis.cancel();
    globalThis.speechSynthesis.speak(utter);
  } catch {}
}

function AvatarAssistant() {
  const { prefs, setPrefs, t } = usePreferences();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [voicesReady, setVoicesReady] = useState(false);
  const [listenSign, setListenSign] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handsRef = useRef(null);
  const rafRef = useRef(null);
  const listenStartRef = useRef(0);
  const okFramesRef = useRef(0);
  const [detectedOK, setDetectedOK] = useState(false);
    // Open assistant when flag set after login, even if previously dismissed
    useEffect(() => {
      if (prefs.assistantOnLogin) {
        setOpen(true);
        setPrefs((p) => ({ ...p, assistantOnLogin: false }));
      }
    }, [prefs.assistantOnLogin, setPrefs]);

    // Show on first visit if not dismissed
    useEffect(() => {
      try {
        if (!localStorage.getItem('assistantDismissed')) {
          setOpen(true);
        }
      } catch {}
    }, []);
  // Interpreter video per language (instead of camera listening in assistant)
  const videoByLang = useMemo(() => {
    // External placeholder demo clips with a person signing
    // Replace with your LSF/ASL/Arabic SL interpreter videos later
    if (prefs.language === 'ar') {
      return 'https://upload.wikimedia.org/wikipedia/commons/b/bf/Arab_sign_language_demo.webm';
    }
    if (prefs.language === 'en') {
      return 'https://upload.wikimedia.org/wikipedia/commons/5/57/ASL_Hello_sign.webm';
    }
    return 'https://upload.wikimedia.org/wikipedia/commons/4/46/Libras_-_Oi%2C_tudo_bem%3F.webm';
  }, [prefs.language]);

  // Legacy options removed in favor of profile buttons

  useEffect(() => {
    const onVoicesChanged = () => setVoicesReady(true);
    if ('speechSynthesis' in globalThis) {
      const list = globalThis.speechSynthesis.getVoices();
      setVoicesReady(list && list.length > 0);
      globalThis.speechSynthesis.addEventListener?.('voiceschanged', onVoicesChanged);
    }
    return () => {
      globalThis.speechSynthesis?.removeEventListener?.('voiceschanged', onVoicesChanged);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const message = `${t('welcome')} ${t('ask')}`;
    setCaption(message);
    // Autoplay policies often block auto-speak; require user click to enable
    if (prefs.voiceEnabled && voicesReady) {
      speak(message, prefs.language);
    }
  }, [open, prefs.language, t, prefs.voiceEnabled, voicesReady]);

  const onClose = () => {
    setOpen(false);
    try { localStorage.setItem('assistantDismissed', '1'); } catch {}
    speechSynthesis.cancel();
  };

  const setLanguage = (lang) => setPrefs((p) => ({ ...p, language: lang }));

  const enableVoice = () => {
    setPrefs((p) => ({ ...p, voiceEnabled: true }));
    const message = `${t('welcome')} ${t('ask')}`;
    speak(message, prefs.language);
  };

  // Camera listening to confirm Deaf+Mute via OK gesture
  useEffect(() => {
    if (!open || !listenSign) return;
    listenStartRef.current = performance.now?.() || Date.now();
    okFramesRef.current = 0;
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
        const thumbTip = lm[4];
        const indexTip = lm[8];
        const dx = (thumbTip.x - indexTip.x) * canvas.width;
        const dy = (thumbTip.y - indexTip.y) * canvas.height;
        const dist = Math.hypot(dx, dy);
        const now = performance.now?.() || Date.now();
        // Wait ~2s after camera starts to stabilize before detecting
        if (now - listenStartRef.current < 2000) return;
        // OK gesture: thumb + index form a circle (small distance)
        const threshold = Math.max(canvas.width, canvas.height) * 0.05;
        if (dist < threshold) {
          okFramesRef.current += 1;
        } else {
          okFramesRef.current = 0;
        }
        // Require ~10 consecutive frames to confirm (~0.3s at ~30fps)
        if (okFramesRef.current >= 10) {
          setDetectedOK(true);
          setListenSign(false);
          setPrefs((p) => ({ ...p, signLanguageMode: true, voiceEnabled: false, assistantOnLogin: false, autoStartGuided: true }));
          try { localStorage.setItem('assistantDismissed', '1'); } catch {}
          // Show visual confirmation briefly before navigating
          setTimeout(() => {
            setOpen(false);
            navigate('/sessions');
          }, 800);
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
        const tick = async () => {
          if (!videoRef.current || !handsRef.current) return;
          await handsRef.current.send({ image: videoRef.current });
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch (e) {
        console.error('Assistant camera error', e);
      }
    };
    load();
    return () => {
      cancelAnimationFrame(rafRef.current);
      try { handsRef.current?.close(); } catch {}
      try { stream?.getTracks()?.forEach((t) => t.stop()); } catch {}
    };
  }, [open, listenSign, setPrefs, navigate]);

  if (!open) return null;

  return (
    <dialog className="assistant-backdrop" open>
      <div className="assistant-modal">
        <div className="assistant-header">
          <div className="assistant-avatar" aria-hidden="true">🧑‍🏫</div>
          <div className="assistant-title">{t('welcome')}</div>
          <button className="assistant-close" onClick={onClose} aria-label="Fermer">✕</button>
        </div>

        <div className="assistant-caption" aria-live="polite">{caption}</div>
        {!prefs.voiceEnabled && (
          <div className="assistant-language" style={{ justifyContent: 'space-between' }}>
            <span>Le son est désactivé (politique navigateur). Activez la voix.</span>
            <button className="assistant-btn" onClick={enableVoice}>Activer la voix</button>
          </div>
        )}

        {/* Profile selection: Deaf+Mute (combined), Low-vision */}
        <div className="assistant-grid">
          <button
            className="assistant-btn"
            onClick={() => {
              setListenSign(true);
            }}
          >
            Sourd + Muet (confirmer en signes)
          </button>
          <button
            className="assistant-btn"
            onClick={() => {
              setPrefs((p) => ({ ...p, accessibilityMode: true, voiceEnabled: true }));
              onClose();
            }}
          >
            Malvoyant
          </button>
        </div>

        <div className="assistant-language">
          <span>{t('language')}:</span>
          <div className="assistant-lang-buttons">
            <button onClick={() => setLanguage('fr')} className={prefs.language === 'fr' ? 'active' : ''}>FR</button>
            <button onClick={() => setLanguage('ar')} className={prefs.language === 'ar' ? 'active' : ''}>AR</button>
            <button onClick={() => setLanguage('en')} className={prefs.language === 'en' ? 'active' : ''}>EN</button>
          </div>
        </div>

        <div className="assistant-language" style={{ marginTop: 12 }}>
          <span>Interprète en langue des signes (aperçu vidéo).</span>
        </div>

        <div className="assistant-signlang" style={{ marginTop: 8 }}>
          <video
            controls
            width="100%"
            aria-label="Question en langue des signes"
            crossOrigin="anonymous"
            poster="https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Ok_gesture.svg/640px-Ok_gesture.svg.png"
            playsInline
            muted
            autoPlay
            loop
            onError={(e) => {
              // If the external demo fails, try a local loop clip shown by SignInterpreter
                try { globalThis.playSignClip?.('/assets/sign-language/loop.webm'); } catch {}
            }}
          >
            <source src={videoByLang} type="video/webm" />
          </video>

          <div className="assistant-language" style={{ marginTop: 12 }}>
            <span>Répondez en signes: faites “OK” devant la caméra pour confirmer le profil Sourd+Muet.</span>
            <button className="assistant-btn" onClick={() => setListenSign(true)}>Activer écoute des signes</button>
          </div>

          {listenSign && (
            <div className="camera-box" style={{ marginTop: 8, position: 'relative', width: '100%', height: 260 }}>
              <video
                ref={videoRef}
                className="camera-video"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }}
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                className="camera-canvas"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: 12 }}
              />
              {detectedOK && (
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    background: 'rgba(16,185,129,0.9)',
                    color: '#fff',
                    borderRadius: 12,
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontWeight: 600,
                  }}
                >
                  <span style={{ fontSize: 20 }}>👌</span>
                  <span>OK détecté</span>
                </div>
              )}
            </div>
          )}

          <div className="assistant-language" style={{ marginTop: 8 }}>
            <button
              className="assistant-btn"
              onClick={() => {
                setPrefs((p) => ({ ...p, signLanguageMode: true, voiceEnabled: true, assistantOnLogin: false, autoStartGuided: true }));
                try { localStorage.setItem('assistantDismissed', '1'); } catch {}
                setOpen(false);
                navigate('/sessions');
              }}
            >
              Activer mode signes pour la présence
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}

export default AvatarAssistant;
