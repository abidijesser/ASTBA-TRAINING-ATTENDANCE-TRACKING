import { useEffect, useMemo, useRef, useState } from 'react';
import { usePreferences } from '../context/PreferenceContext';

function SignInterpreter() {
  const { prefs, setPrefs } = usePreferences();
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hintRef = useRef(null);
  const queueRef = useRef([]);
  const playingRef = useRef(false);
  const playNextRef = useRef(null);
  const [currentClip, setCurrentClip] = useState(null); // { url, text } | null
  const [lastError, setLastError] = useState(null);
  const [playIssue, setPlayIssue] = useState(null); // 'gesture-required' | 'load-failed' | null

  const catalog = useMemo(() => ({
    fr: {
      welcome: '/assets/sign-language/welcome-fr.webm',
      presenceRecorded: '/assets/sign-language/presence-recorded-fr.webm',
      confirmProfile: '/assets/sign-language/confirm-profile-fr.webm',
      fallback: 'https://upload.wikimedia.org/wikipedia/commons/4/46/Libras_-_Oi%2C_tudo_bem%3F.webm',
    },
    ar: {
      welcome: '/assets/sign-language/welcome-ar.webm',
      presenceRecorded: '/assets/sign-language/presence-recorded-ar.webm',
      confirmProfile: '/assets/sign-language/confirm-profile-ar.webm',
      fallback: 'https://upload.wikimedia.org/wikipedia/commons/b/bf/Arab_sign_language_demo.webm',
    },
    en: {
      welcome: '/assets/sign-language/welcome-en.webm',
      presenceRecorded: '/assets/sign-language/presence-recorded-en.webm',
      confirmProfile: '/assets/sign-language/confirm-profile-en.webm',
      fallback: 'https://upload.wikimedia.org/wikipedia/commons/5/57/ASL_Hello_sign.webm',
    },
  }), []);

  // Expose a simple global API to play a sign clip anywhere
  useEffect(() => {
    const langCatalog = catalog[prefs.language] || catalog.fr;
    const defaultLoopUrl = langCatalog.fallback;

    const setAndPlay = async (url, loop) => {
      if (!videoRef.current) return;
      setPlayIssue(null);
      videoRef.current.loop = !!loop;
      videoRef.current.src = url;
      try {
        videoRef.current.load?.();
        await videoRef.current.play?.();
      } catch {
        // Some browsers still require user gesture; keep poster area visible
        setPlayIssue('gesture-required');
      }
    };

    const playNext = async () => {
      if (!videoRef.current) return;
      const next = queueRef.current.shift();
      if (!next) {
        playingRef.current = false;
        // resume default loop
        try {
          setCurrentClip(null);
          await setAndPlay(defaultLoopUrl, true);
        } catch {}
        return;
      }
      playingRef.current = true;
      setLastError(null);
      setCurrentClip(next);
      await setAndPlay(next.url, false);
    };

    playNextRef.current = playNext;

    const onEnded = () => playNext();
    videoRef.current?.addEventListener('ended', onEnded);

    // Ensure we always have something visible even if no local assets exist
    setAndPlay(defaultLoopUrl, true).catch(() => {});

    globalThis.playSignClip = (clip) => {
      const entry = typeof clip === 'string' ? { url: clip, text: '' } : { url: clip?.url, text: clip?.text || '' };
      if (!entry.url) return;
      if (!prefs.signLanguageMode) {
        setPrefs((p) => ({ ...p, signLanguageMode: true, showInterpreterHint: false }));
      }
      queueRef.current.push(entry);
      if (!playingRef.current) {
        if (videoRef.current) {
          playNext();
        }
      }
    };
    globalThis.playSign = (key) => {
      const langCatalog = catalog[prefs.language] || catalog.fr;
      const url = langCatalog[key] || langCatalog.fallback;
      globalThis.playSignClip({ url, text: String(key || '') });
    };
    return () => {
      try { delete globalThis.playSignClip; } catch {}
      try { delete globalThis.playSign; } catch {}
      videoRef.current?.removeEventListener('ended', onEnded);
      playNextRef.current = null;
    };
  }, [catalog, prefs.language, prefs.signLanguageMode, setPrefs]);

  // If a clip was queued while the panel was closed, start playback once the video element exists.
  useEffect(() => {
    if (!prefs.signLanguageMode) return;
    if (!videoRef.current) return;
    if (playingRef.current) return;
    if (!queueRef.current.length) return;
    playNextRef.current?.();
  }, [prefs.signLanguageMode]);

  // Inject simple keyframes for a floating animation
  useEffect(() => {
    const id = 'sign-interpreter-anim';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = `
        @keyframes float {
          0% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Show small animated hint only right after login, then hide
  useEffect(() => {
    if (prefs.showInterpreterHint && !prefs.signLanguageMode) {
      const timer = setTimeout(() => {
        setPrefs((p) => ({ ...p, showInterpreterHint: false }));
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [prefs.showInterpreterHint, prefs.signLanguageMode, setPrefs]);

  if (!prefs.signLanguageMode && !prefs.showInterpreterHint) {
    return (
      <button
        type="button"
        onClick={() => setPrefs((p) => ({ ...p, signLanguageMode: true, showInterpreterHint: false }))}
        style={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          height: 44,
          padding: '0 12px',
          borderRadius: 999,
          border: '1px solid var(--border-color, #e5e7eb)',
          background: 'var(--card-bg, #fff)',
          color: 'var(--text-color, #111)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          zIndex: 1200,
          cursor: 'pointer',
          fontWeight: 700,
          letterSpacing: 0.4,
        }}
        aria-label="Activer l’interprète en langue des signes"
      >
        LSF
      </button>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        width: prefs.signLanguageMode ? 280 : 120,
        height: prefs.signLanguageMode ? 220 : 96,
        background: 'var(--card-bg, #fff)',
        color: 'var(--text-color, #111)',
        borderRadius: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        zIndex: 1200,
        border: '1px solid var(--border-color, #e5e7eb)',
        overflow: 'hidden',
      }}
      aria-label="Interprète en langue des signes"
    >
      {prefs.signLanguageMode ? (
        <>
          <div style={{ padding: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600 }}>Interprète</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.7 }}>Toujours disponible</span>
          </div>
          <div style={{ width: '100%', height: 170, background: '#000', position: 'relative' }}>
            <video
              ref={videoRef}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              playsInline
              muted
              autoPlay
              loop={!currentClip}
              onError={(e) => {
                // Fallback to a safe public clip if current URL fails
                try {
                  setPlayIssue('load-failed');
                  const langCatalog = catalog[prefs.language] || catalog.fr;
                  const fallbackUrl = langCatalog.fallback;
                  const failedUrl = currentClip?.url || '';
                  if (failedUrl?.startsWith?.('/sign/')) {
                    setLastError('video-missing');
                    // If local clip missing, open text controls as fallback
                    globalThis.openSignControls?.(currentClip?.text || '');
                  }
                  if (videoRef.current && videoRef.current.src !== fallbackUrl) {
                    videoRef.current.loop = true;
                    videoRef.current.src = fallbackUrl;
                    videoRef.current.load?.();
                    videoRef.current.play?.().catch?.(() => {
                      setPlayIssue('gesture-required');
                    });
                  }
                } catch {}
              }}
            >
              <source src={(catalog[prefs.language] || catalog.fr).fallback} type="video/webm" />
            </video>

            {(playIssue || lastError) && (
              <div
                style={{
                  position: 'absolute',
                  left: 12,
                  right: 12,
                  top: 12,
                  padding: '8px 10px',
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  borderRadius: 10,
                  fontSize: 12,
                }}
              >
                {lastError === 'video-missing' ? (
                  <div style={{ marginBottom: 8 }}>
                    Vidéo introuvable. Ajoute un fichier dans <b>frontend/public/sign/lsf</b>.
                  </div>
                ) : null}
                {playIssue === 'gesture-required' ? (
                  <div style={{ marginBottom: 8 }}>
                    Lecture bloquée par le navigateur. Clique sur “Démarrer”.
                  </div>
                ) : null}
                {playIssue === 'load-failed' && !lastError ? (
                  <div style={{ marginBottom: 8 }}>
                    Impossible de charger la vidéo (réseau ou format). Essaie “Ouvrir”.
                  </div>
                ) : null}

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const v = videoRef.current;
                      v?.play?.().then?.(() => setPlayIssue(null)).catch?.(() => setPlayIssue('gesture-required'));
                    }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.25)',
                      background: 'rgba(255,255,255,0.12)',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    Démarrer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const url = videoRef.current?.currentSrc || videoRef.current?.src || (catalog[prefs.language] || catalog.fr).fallback;
                      try {
                        window.open(url, '_blank', 'noopener,noreferrer');
                      } catch {}
                    }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.25)',
                      background: 'rgba(255,255,255,0.12)',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    Ouvrir
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div
          ref={hintRef}
          className="interpreter-hint"
          style={{ width: '100%', height: '100%', background: '#000' }}
          aria-label="Indicateur d’interprète"
        >
          <video
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            playsInline
            muted
            autoPlay
            loop
            crossOrigin="anonymous"
          >
            <source src={(catalog[prefs.language] || catalog.fr).fallback} type="video/webm" />
          </video>
        </div>
      )}
    </div>
  );
}

export default SignInterpreter;
