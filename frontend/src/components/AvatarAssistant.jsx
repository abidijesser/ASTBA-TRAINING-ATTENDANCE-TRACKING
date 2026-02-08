import { useEffect, useMemo, useRef, useState } from 'react';
import { usePreferences } from '../context/PreferenceContext';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import assistantIcon from '../assets/icons/assistant.svg';
import deafMuteIcon from '../assets/icons/profile-deaf-mute.svg';
import lowVisionIcon from '../assets/icons/profile-low-vision.svg';
import cameraIcon from '../assets/icons/camera.svg';
import speakerIcon from '../assets/icons/speaker.svg';

function SmartImg({ src, fallbackSrc, alt = '', ...props }) {
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  return (
    <img
      {...props}
      src={currentSrc}
      alt={alt}
      onError={() => {
        if (fallbackSrc && currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}

SmartImg.propTypes = {
  src: PropTypes.string.isRequired,
  fallbackSrc: PropTypes.string,
  alt: PropTypes.string,
};

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
  const [interpreterVideoReady, setInterpreterVideoReady] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handsRef = useRef(null);
  const rafRef = useRef(null);
  const listenStartRef = useRef(0);
  const okFramesRef = useRef(0);
  const [detectedOK, setDetectedOK] = useState(false);

  const images = useMemo(
    () => ({
      assistant: { primary: '/assistant/assistant.jpg', fallback: assistantIcon },
      deafMute: { primary: '/assistant/profile-deaf-mute.jpg', fallback: deafMuteIcon },
      lowVision: { primary: '/assistant/profile-low-vision.jpg', fallback: lowVisionIcon },
      camera: { primary: '/assistant/camera.png', fallback: cameraIcon },
      speaker: { primary: '/assistant/speaker.png', fallback: speakerIcon },
    }),
    []
  );
    // Open assistant when flag set after login, even if previously dismissed
    useEffect(() => {
      if (prefs.assistantOnLogin) {
        setOpen(true);
        setPrefs((p) => ({ ...p, assistantOnLogin: false }));
      }
    }, [prefs.assistantOnLogin, setPrefs]);

    // If requested, start camera listening automatically
    useEffect(() => {
      if (!open) return;
      if (!prefs.assistantForceCamera) return;
      setListenSign(true);
      setPrefs((p) => ({ ...p, assistantForceCamera: false }));
    }, [open, prefs.assistantForceCamera, setPrefs]);

    // Default behavior: camera is the Deaf+Mute indicator, so open it immediately.
    useEffect(() => {
      if (!open) return;
      if (detectedOK) return;
      if (prefs.deafMuteMode) return;
      setListenSign(true);
    }, [open, detectedOK, prefs.deafMuteMode]);

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
    // Default preview clip. Replace with your own LSF video later.
    return 'https://upload.wikimedia.org/wikipedia/commons/4/46/Libras_-_Oi%2C_tudo_bem%3F.webm';
  }, []);

  // Hide interpreter preview while loading / when switching language
  useEffect(() => {
    if (!open) return;
    setInterpreterVideoReady(false);
  }, [open, videoByLang]);

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
    const message = t('chooseProfile');
    setCaption(message);
    // Autoplay policies often block auto-speak; require user click to enable
    if (prefs.voiceEnabled && voicesReady) {
      speak(message, prefs.language);
    }
  }, [open, prefs.language, t, prefs.voiceEnabled, voicesReady]);

  const onClose = () => {
    setListenSign(false);
    setOpen(false);
    try { localStorage.setItem('assistantDismissed', '1'); } catch {}
    speechSynthesis.cancel();
  };

  // Force assistant question in French by default (no language selector)
  useEffect(() => {
    if (!open) return;
    if (prefs.language !== 'fr') {
      setPrefs((p) => ({ ...p, language: 'fr' }));
    }
  }, [open, prefs.language, setPrefs]);

  const enableVoice = () => {
    setPrefs((p) => ({ ...p, voiceEnabled: true }));
    const message = t('chooseProfile');
    speak(message, prefs.language);
  };

  // Camera listening to confirm Deaf+Mute via OK gesture
  useEffect(() => {
    if (!open || !listenSign) return;
    listenStartRef.current = performance.now?.() || Date.now();
    okFramesRef.current = 0;
    let stream;
    const primaryColor = () => {
      try {
        return getComputedStyle(document.documentElement)
          .getPropertyValue('--color-primary')
          .trim() || '#111827';
      } catch {
        return '#111827';
      }
    };
    const onResults = (results) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx || !videoRef.current) return;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const lm = results.multiHandLandmarks?.[0];
      if (lm) {
        ctx.fillStyle = primaryColor();
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
          setPrefs((p) => ({
            ...p,
            signVideosUnlocked: true,
            signLanguageMode: true,
            deafMuteMode: true,
            voiceEnabled: false,
            assistantOnLogin: false,
            assistantForceCamera: false,
            autoStartGuided: true,
          }));
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
          <SmartImg
            className="assistant-avatar-img"
            src={images.assistant.primary}
            fallbackSrc={images.assistant.fallback}
            alt=""
            aria-hidden="true"
          />
          <div className="assistant-title">{t('welcome')}</div>
          <button className="assistant-close" onClick={onClose} aria-label="Fermer">✕</button>
        </div>

        <div className="assistant-caption" aria-live="polite">{caption}</div>
        {!prefs.voiceEnabled && (
          <div className="assistant-language" style={{ justifyContent: 'space-between' }}>
            <SmartImg
              className="assistant-inline-icon"
              src={images.speaker.primary}
              fallbackSrc={images.speaker.fallback}
              alt=""
              aria-hidden="true"
            />
            <button
              type="button"
              className="assistant-icon-btn"
              onClick={enableVoice}
              aria-label={t('enableVoiceShort')}
              title={t('enableVoiceShort')}
            >
              <SmartImg
                src={images.speaker.primary}
                fallbackSrc={images.speaker.fallback}
                alt=""
                aria-hidden="true"
              />
              <span className="sr-only">{t('enableVoiceShort')}</span>
            </button>
          </div>
        )}

        {/* Profile selection: Camera (OK detection), Low-vision */}
        <div className="assistant-grid">
          <div className="assistant-camera-tile" aria-label="Caméra (détection du geste OK)">
            {listenSign ? (
              <div className="camera-box assistant-camera-box" style={{ margin: 0, position: 'relative', width: '100%', height: 220 }}>
                <video
                  ref={videoRef}
                  className="camera-video"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12, maxWidth: 'none' }}
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="camera-canvas"
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: 12, maxWidth: 'none' }}
                />
                {detectedOK && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      background: 'color-mix(in srgb, var(--color-success) 88%, transparent)',
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
                    <span>OK</span>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="assistant-profile-btn"
                onClick={() => setListenSign(true)}
                aria-label="Activer la caméra"
                title="Caméra"
              >
                <SmartImg
                  src={images.camera.primary}
                  fallbackSrc={images.camera.fallback}
                  alt=""
                  aria-hidden="true"
                />
                <span className="sr-only">Caméra</span>
              </button>
            )}
          </div>
          <button
            className={`assistant-profile-btn ${prefs.colorblindMode ? 'active' : ''}`}
            onClick={() => {
              // Bouton "œil" (à droite) :
              // Active le mode daltonisme RG (protanopie/deutéranopie) puis ferme la popup
              // pour que l'utilisateur navigue sur le site avec une palette adaptée.
              // La classe `colorblind-friendly` est appliquée sur <html> (voir App.jsx).
              setPrefs((p) => ({ ...p, colorblindMode: true, voiceEnabled: true }));
              onClose();
            }}
            aria-label="Activer le mode daltonisme (RG)"
            title="Activer le mode daltonisme (RG)"
          >
            <SmartImg
              src={images.lowVision.primary}
              fallbackSrc={images.lowVision.fallback}
              alt=""
              aria-hidden="true"
            />
            <span className="sr-only">Activer le mode daltonisme (RG)</span>
          </button>
        </div>

        <div className="assistant-signlang" style={{ marginTop: 8 }}>
          {interpreterVideoReady && (
            <div className="assistant-mini-row" style={{ marginTop: 4 }}>
              <span />
              <span className="sr-only">Aperçu vidéo</span>
            </div>
          )}

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
            preload="metadata"
            style={{ display: interpreterVideoReady ? 'block' : 'none' }}
            onLoadedMetadata={() => setInterpreterVideoReady(true)}
            onCanPlay={() => setInterpreterVideoReady(true)}
            onError={(e) => {
              // If the external demo fails, try a local loop clip shown by SignInterpreter
              setInterpreterVideoReady(false);
              try { globalThis.playSign?.('welcome'); } catch {}
            }}
          >
            <source src={videoByLang} type="video/webm" />
          </video>

          {/* Camera UI moved to the top grid (replaces Deaf+Mute button) */}

          {/* Removed: presence shortcut button (requested) */}
        </div>
      </div>
    </dialog>
  );
}

export default AvatarAssistant;
