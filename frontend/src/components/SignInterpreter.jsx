import { useEffect, useMemo, useRef, useState } from 'react';
import { usePreferences } from '../context/PreferenceContext';

function SignInterpreter() {
  const { prefs, setPrefs } = usePreferences();
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hintRef = useRef(null);
  const queueRef = useRef([]);
  const playingRef = useRef(false);
  const [currentClip, setCurrentClip] = useState(null);

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
    const playNext = async () => {
      if (!videoRef.current) return;
      const next = queueRef.current.shift();
      if (!next) {
        playingRef.current = false;
        // resume default loop
        try {
          const langCatalog = catalog[prefs.language] || catalog.fr;
          videoRef.current.src = '/assets/sign-language/loop.webm';
          videoRef.current.play?.();
        } catch {}
        return;
      }
      playingRef.current = true;
      setCurrentClip(next);
      videoRef.current.loop = false;
      videoRef.current.src = next;
      await videoRef.current.play?.();
    };

    const onEnded = () => playNext();
    videoRef.current?.addEventListener('ended', onEnded);

    globalThis.playSignClip = (url) => {
      queueRef.current.push(url);
      if (!playingRef.current) {
        playNext();
      }
    };
    globalThis.playSign = (key) => {
      const langCatalog = catalog[prefs.language] || catalog.fr;
      const url = langCatalog[key] || langCatalog.fallback;
      globalThis.playSignClip(url);
    };
    return () => {
      try { delete globalThis.playSignClip; } catch {}
      try { delete globalThis.playSign; } catch {}
      videoRef.current?.removeEventListener('ended', onEnded);
    };
  }, [catalog, prefs.language]);

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

  if (!prefs.signLanguageMode && !prefs.showInterpreterHint) return null;

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
        zIndex: 1000,
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
          <div style={{ width: '100%', height: 170, background: '#000' }}>
            <video
              ref={videoRef}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              playsInline
              muted
              autoPlay
              loop={currentClip ? false : true}
              crossOrigin="anonymous"
              onError={(e) => {
                // Fallback: show a simple emoji if video fails
                if (containerRef.current) {
                  containerRef.current.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:64px">🤟</div>';
                }
              }}
            >
              <source src="/assets/sign-language/loop.webm" type="video/webm" />
            </video>
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
            <source src="/assets/sign-language/loop.webm" type="video/webm" />
          </video>
        </div>
      )}
    </div>
  );
}

export default SignInterpreter;
