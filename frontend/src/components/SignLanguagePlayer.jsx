import { useEffect, useMemo, useRef, useState } from 'react';
import Modal from './ui/Modal';
import { usePreferences } from '../context/PreferenceContext';
import { getSignEntryForPhrase, normalizePhraseExact } from '../sign/signLanguageLibrary';

function SignLanguagePlayer() {
  const { prefs, setPrefs } = usePreferences();
  const [isOpen, setIsOpen] = useState(false);
  const [phrase, setPhrase] = useState('');
  const [loadError, setLoadError] = useState(false);
  const videoRef = useRef(null);
  const lastFocusRef = useRef(null);

  const entry = useMemo(() => getSignEntryForPhrase(phrase), [phrase]);
  const videoUrl = entry?.videoUrl || '';

  const close = () => {
    setIsOpen(false);
    setLoadError(false);
    try {
      videoRef.current?.pause?.();
    } catch {}
    const el = lastFocusRef.current;
    if (el && typeof el.focus === 'function') {
      try { el.focus(); } catch {}
    }
  };

  const openForPhrase = (nextPhrase) => {
    if (!prefs.signVideosUnlocked) {
      // No access yet: reopen assistant and request camera confirmation
      setPrefs((p) => ({ ...p, assistantOnLogin: true, assistantForceCamera: true }));
      return;
    }
    lastFocusRef.current = document.activeElement;
    const normalized = normalizePhraseExact(nextPhrase);
    setPhrase(normalized);
    setLoadError(false);
    setIsOpen(true);
  };

  // Global API
  useEffect(() => {
    globalThis.openSignLanguage = (p) => openForPhrase(p);
    return () => {
      try { delete globalThis.openSignLanguage; } catch {}
    };
  }, [prefs.signVideosUnlocked]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  // Attempt to play when opened (may still require gesture)
  useEffect(() => {
    if (!isOpen) return;
    if (!videoUrl) return;
    const v = videoRef.current;
    if (!v) return;
    try {
      setLoadError(false);
      v.load?.();
      v.play?.();
    } catch {}
  }, [isOpen, videoUrl]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={phrase ? `Langue des signes — “${phrase}”` : 'Langue des signes'}
      size="medium"
    >
      {entry ? (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            <span style={{ marginRight: 12 }}>Langue: <b>{entry.language || 'LSF'}</b></span>
            <span>Source: <b>{entry.source || 'external'}</b></span>
          </div>

          <div style={{ background: '#000', borderRadius: 10, overflow: 'hidden' }}>
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              playsInline
              style={{ width: '100%', height: 320, objectFit: 'contain', background: '#000' }}
              onError={() => setLoadError(true)}
            >
              <track
                kind="captions"
                src="/captions/empty.vtt"
                srcLang="fr"
                label="Français"
                default
              />
            </video>
          </div>

          {loadError && (
            <output
              aria-live="polite"
              style={{
                padding: 10,
                borderRadius: 10,
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
              }}
            >
              Impossible de charger la vidéo dans l’application. Tu peux l’ouvrir directement:
              {' '}
              <a
                href={videoRef.current?.currentSrc || videoUrl}
                target="_blank"
                rel="noreferrer"
              >
                ouvrir la vidéo
              </a>.
            </output>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                const v = videoRef.current;
                v?.play?.();
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                border: '1px solid var(--border-color, #e5e7eb)',
                background: 'var(--card-bg, #fff)',
                cursor: 'pointer',
              }}
            >
              Lecture
            </button>
            <button
              type="button"
              onClick={() => {
                const v = videoRef.current;
                v?.pause?.();
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                border: '1px solid var(--border-color, #e5e7eb)',
                background: 'var(--card-bg, #fff)',
                cursor: 'pointer',
              }}
            >
              Pause
            </button>
            <button
              type="button"
              onClick={close}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                border: '1px solid var(--border-color, #e5e7eb)',
                background: 'var(--card-bg, #fff)',
                cursor: 'pointer',
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      ) : (
        <output aria-live="polite" style={{ display: 'grid', gap: 10 }}>
          <div>
            Sign language translation not available for this phrase.
          </div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            Ajoute-la dans <b>signLanguageLibrary</b> pour l’activer.
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => globalThis.openSignLibrary?.()}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                border: '1px solid var(--border-color, #e5e7eb)',
                background: 'var(--card-bg, #fff)',
                cursor: 'pointer',
              }}
            >
              Voir les phrases disponibles
            </button>
            <button
              type="button"
              onClick={close}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                border: '1px solid var(--border-color, #e5e7eb)',
                background: 'var(--card-bg, #fff)',
                cursor: 'pointer',
              }}
            >
              Fermer
            </button>
          </div>
        </output>
      )}
    </Modal>
  );
}

export default SignLanguagePlayer;
