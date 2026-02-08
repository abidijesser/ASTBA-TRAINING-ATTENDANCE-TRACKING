import { useEffect, useMemo, useRef, useState } from 'react';
import Modal from './ui/Modal';
import { usePreferences } from '../context/PreferenceContext';
import {
  getSignEntryForPhrase,
  getGenericFallbackEntryForPhrase,
  normalizePhraseExact,
  searchWikimediaCommonsVideos,
  upsertCustomSignEntry,
} from '../sign/signLanguageLibrary';

function SignLanguagePlayer() {
  const { prefs, setPrefs } = usePreferences();
  const [isOpen, setIsOpen] = useState(false);
  const [phrase, setPhrase] = useState('');
  const [loadError, setLoadError] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoResults, setAutoResults] = useState([]);
  const [autoEntry, setAutoEntry] = useState(null);
  const [autoSaveMsg, setAutoSaveMsg] = useState('');
  const videoRef = useRef(null);
  const lastFocusRef = useRef(null);
  const searchCacheRef = useRef(new Map());

  const entry = useMemo(() => getSignEntryForPhrase(phrase), [phrase]);
  const genericFallbackEntry = useMemo(() => getGenericFallbackEntryForPhrase(phrase), [phrase]);
  const effectiveEntry = entry || autoEntry || genericFallbackEntry;
  const videoUrl = effectiveEntry?.videoUrl || '';

  const close = () => {
    setIsOpen(false);
    setLoadError(false);
    setAutoLoading(false);
    setAutoResults([]);
    setAutoEntry(null);
    setAutoSaveMsg('');
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
    setAutoSaveMsg('');
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

  // If phrase not in the library, automatically search Commons for a usable LSF/FSL video.
  // This makes the feature work “on every page”, even for new UI labels.
  useEffect(() => {
    if (!isOpen) return undefined;
    const p = normalizePhraseExact(phrase);
    if (!p) return undefined;

    // If we already have an explicit mapping, skip auto-search.
    if (entry) {
      setAutoLoading(false);
      setAutoResults([]);
      setAutoEntry(null);
      return undefined;
    }

    const cacheKey = p.toLowerCase();
    const cached = searchCacheRef.current.get(cacheKey);
    if (Array.isArray(cached)) {
      setAutoResults(cached);
      const first = cached[0];
      setAutoEntry(
        first
          ? {
              phrase: p,
              videoUrl: first.videoUrl,
              language: 'LSF',
              source: first.source || 'commons.wikimedia.org',
            }
          : null
      );
      setAutoLoading(false);
      return undefined;
    }

    let cancelled = false;
    setAutoLoading(true);
    setAutoResults([]);
    setAutoEntry(null);

    (async () => {
      try {
        const results = await searchWikimediaCommonsVideos(p, { limit: 10 });
        if (cancelled) return;
        searchCacheRef.current.set(cacheKey, results);
        setAutoResults(results);
        const first = results[0];
        setAutoEntry(
          first
            ? {
                phrase: p,
                videoUrl: first.videoUrl,
                language: 'LSF',
                source: first.source || 'commons.wikimedia.org',
              }
            : null
        );
      } catch {
        if (cancelled) return;
        setAutoResults([]);
        setAutoEntry(null);
      } finally {
        if (!cancelled) setAutoLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, phrase, entry]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={phrase ? `Langue des signes — “${phrase}”` : 'Langue des signes'}
      size="medium"
    >
      {effectiveEntry ? (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            <span style={{ marginRight: 12 }}>Langue: <b>{effectiveEntry.language || 'LSF'}</b></span>
            <span>Source: <b>{effectiveEntry.source || 'external'}</b></span>
            {!entry && autoEntry && (
              <span style={{ marginLeft: 12, padding: '2px 8px', borderRadius: 999, border: '1px solid rgba(59,130,246,0.35)', background: 'rgba(59,130,246,0.10)' }}>
                Auto (non enregistré)
              </span>
            )}
            {!entry && !autoEntry && genericFallbackEntry && (
              <span style={{ marginLeft: 12, padding: '2px 8px', borderRadius: 999, border: '1px solid rgba(148,163,184,0.5)', background: 'rgba(148,163,184,0.12)' }}>
                Générique
              </span>
            )}
          </div>

          {!entry && autoLoading && (
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              Recherche d’une vidéo en LSF…
            </div>
          )}

          {!entry && !autoLoading && !autoEntry && (
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              Aucune vidéo spécifique trouvée pour cette phrase. Lecture d’une vidéo générique.
            </div>
          )}

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

          {!entry && autoEntry && autoResults.length > 1 && (
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Autres résultats:</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {autoResults.slice(0, 6).map((r) => (
                  <button
                    key={r.videoUrl}
                    type="button"
                    onClick={() => {
                      setAutoEntry({
                        phrase: normalizePhraseExact(phrase),
                        videoUrl: r.videoUrl,
                        language: 'LSF',
                        source: r.source || 'commons.wikimedia.org',
                      });
                      setLoadError(false);
                      setAutoSaveMsg('');
                    }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 999,
                      border: '1px solid var(--border-color, #e5e7eb)',
                      background: 'var(--card-bg, #fff)',
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                    title={r.title || ''}
                  >
                    {String(r.title || 'Vidéo').replace(/^File:/, '').slice(0, 26)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {autoSaveMsg && (
            <output aria-live="polite" style={{ fontSize: 12, color: 'var(--color-success, #16a34a)' }}>
              {autoSaveMsg}
            </output>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            {!entry && autoEntry && (
              <button
                type="button"
                onClick={() => {
                  const ok = upsertCustomSignEntry(phrase, {
                    videoUrl: autoEntry.videoUrl,
                    language: autoEntry.language || 'LSF',
                    source: autoEntry.source || 'commons.wikimedia.org',
                  });
                  setAutoSaveMsg(ok ? 'Associé à cette phrase.' : 'Impossible d’enregistrer cette vidéo.');
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(59,130,246,0.35)',
                  background: 'rgba(59,130,246,0.10)',
                  cursor: 'pointer',
                }}
              >
                Enregistrer
              </button>
            )}
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

          {!entry && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
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
                Gérer la bibliothèque
              </button>
            </div>
          )}
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
