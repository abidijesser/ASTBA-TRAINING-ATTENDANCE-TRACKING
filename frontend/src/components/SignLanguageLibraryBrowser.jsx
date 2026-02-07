import { useEffect, useMemo, useState } from 'react';
import Modal from './ui/Modal';
import Input from './ui/Input';
import {
  isCustomSignPhrase,
  listSupportedSignPhrases,
  normalizePhraseExact,
  removeCustomSignEntry,
  searchWikimediaCommonsVideos,
  subscribeSignLibraryChanged,
  upsertCustomSignEntry,
} from '../sign/signLanguageLibrary';

function SignLanguageLibraryBrowser() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [newPhrase, setNewPhrase] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newLanguage, setNewLanguage] = useState('LSF');
  const [saveError, setSaveError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const phrases = useMemo(() => listSupportedSignPhrases(), [refreshKey]);

  const filtered = useMemo(() => {
    const q = normalizePhraseExact(query).toLowerCase();
    if (!q) return phrases;
    return phrases.filter((p) => p.toLowerCase().includes(q));
  }, [phrases, query]);

  const close = () => setIsOpen(false);

  useEffect(() => {
    globalThis.openSignLibrary = () => {
      setIsOpen(true);
      setQuery('');
      setSaveError('');
      setSearchError('');
      setSearchResults([]);
      setSearchQuery('');
    };
    return () => {
      try { delete globalThis.openSignLibrary; } catch {}
    };
  }, []);

  useEffect(() => {
    return subscribeSignLibraryChanged(() => setRefreshKey((k) => k + 1));
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={`Phrases disponibles en langue des signes (${filtered.length}/${phrases.length})`}
      size="medium"
    >
      <div style={{ display: 'grid', gap: 12 }}>
        <Input
          label="Rechercher"
          name="sign-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tape une phrase (ex: Tableau de bord)"
        />

        <div style={{ padding: 12, borderRadius: 12, border: '1px solid var(--border-color, #e5e7eb)' }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Ajouter une phrase</div>
          <div style={{ display: 'grid', gap: 10 }}>
            <Input
              label="Phrase (exacte)"
              name="sign-phrase"
              value={newPhrase}
              onChange={(e) => setNewPhrase(e.target.value)}
              placeholder="Ex: Liste des formations vous étant assignées"
            />
            <Input
              label="Lien vidéo direct (mp4/webm)"
              name="sign-url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://upload.wikimedia.org/.../xxx.webm"
            />
            <Input
              label="Langue (ex: LSF)"
              name="sign-lang"
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              placeholder="LSF"
            />

            {saveError && (
              <output aria-live="polite" style={{ color: 'var(--color-danger, #ef4444)', fontSize: 12 }}>
                {saveError}
              </output>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setSaveError('');
                  const ok = upsertCustomSignEntry(newPhrase, {
                    videoUrl: newUrl,
                    language: newLanguage,
                    source: 'external',
                  });
                  if (!ok) {
                    setSaveError('URL invalide. Colle un lien direct https://... vers un fichier .mp4/.webm.');
                    return;
                  }
                  setNewPhrase('');
                  setNewUrl('');
                  setNewLanguage('LSF');
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--border-color, #e5e7eb)',
                  background: 'var(--card-bg, #fff)',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: 12, borderRadius: 12, border: '1px solid var(--border-color, #e5e7eb)' }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Trouver une vidéo gratuite (Wikimedia Commons)</div>
          <div style={{ display: 'grid', gap: 10 }}>
            <Input
              label="Recherche"
              name="sign-commons-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ex: Élève, Formation, Chercher"
            />

            {searchError && (
              <output aria-live="polite" style={{ color: 'var(--color-danger, #ef4444)', fontSize: 12 }}>
                {searchError}
              </output>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={async () => {
                  setSearchError('');
                  setSearchLoading(true);
                  try {
                    const results = await searchWikimediaCommonsVideos(searchQuery, { limit: 12 });
                    setSearchResults(results);
                    if (!results.length) setSearchError('Aucun résultat .webm/.mp4 trouvé. Essaie un mot plus simple.');
                  } catch {
                    setSearchError('Recherche impossible (réseau).');
                  } finally {
                    setSearchLoading(false);
                  }
                }}
                disabled={searchLoading}
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--border-color, #e5e7eb)',
                  background: 'var(--card-bg, #fff)',
                  cursor: searchLoading ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                }}
              >
                {searchLoading ? 'Recherche…' : 'Rechercher'}
              </button>
            </div>

            {!!searchResults.length && (
              <div style={{ display: 'grid', gap: 8, maxHeight: 220, overflow: 'auto', paddingRight: 4 }}>
                {searchResults.map((r) => (
                  <div
                    key={r.videoUrl}
                    style={{
                      display: 'grid',
                      gap: 6,
                      padding: 10,
                      borderRadius: 10,
                      border: '1px solid var(--border-color, #e5e7eb)',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{r.title || r.videoUrl}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setNewUrl(r.videoUrl);
                          setNewLanguage('LSF');
                          setSaveError('');
                        }}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 10,
                          border: '1px solid var(--border-color, #e5e7eb)',
                          background: 'var(--card-bg, #fff)',
                          cursor: 'pointer',
                        }}
                      >
                        Utiliser ce lien
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const phrase = normalizePhraseExact(newPhrase);
                          if (!phrase) {
                            setSaveError('Écris d’abord la “Phrase (exacte)” à laquelle tu veux associer la vidéo.');
                            return;
                          }
                          const ok = upsertCustomSignEntry(phrase, {
                            videoUrl: r.videoUrl,
                            language: newLanguage || 'LSF',
                            source: r.source || 'commons.wikimedia.org',
                          });
                          if (!ok) setSaveError('Impossible de sauvegarder cette vidéo (URL invalide).');
                        }}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 10,
                          border: '1px solid var(--border-color, #e5e7eb)',
                          background: 'var(--card-bg, #fff)',
                          cursor: 'pointer',
                        }}
                      >
                        Associer à la phrase
                      </button>
                      {r.descriptionUrl && (
                        <a
                          href={r.descriptionUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: 12, alignSelf: 'center' }}
                        >
                          Détails
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {phrases.length === 0 ? (
          <output aria-live="polite">
            Aucune phrase n’est configurée. Ajoute des entrées dans <b>signLanguageLibrary</b>.
          </output>
        ) : (
          <div style={{ display: 'grid', gap: 8, maxHeight: 340, overflow: 'auto', paddingRight: 4 }}>
            {filtered.map((p) => (
              <div
                key={p}
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <button
                  type="button"
                  onClick={() => globalThis.openSignLanguage?.(p)}
                  style={{
                    flex: 1,
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid var(--border-color, #e5e7eb)',
                    background: 'var(--card-bg, #fff)',
                    cursor: 'pointer',
                  }}
                >
                  {p}
                  {isCustomSignPhrase(p) && (
                    <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.7 }}>(custom)</span>
                  )}
                </button>
                {isCustomSignPhrase(p) && (
                  <button
                    type="button"
                    onClick={() => removeCustomSignEntry(p)}
                    aria-label="Supprimer cette phrase"
                    title="Supprimer"
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--border-color, #e5e7eb)',
                      background: 'var(--card-bg, #fff)',
                      cursor: 'pointer',
                    }}
                  >
                    Suppr.
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
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
    </Modal>
  );
}

export default SignLanguageLibraryBrowser;
