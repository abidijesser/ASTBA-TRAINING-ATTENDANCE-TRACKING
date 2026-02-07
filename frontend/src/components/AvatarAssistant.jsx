import { useEffect, useMemo, useState } from 'react';
import { usePreferences } from '../context/PreferenceContext';

function pickVoice(langCode) {
  try {
    const voices = speechSynthesis.getVoices?.() || [];
    const target = langCode === 'ar' ? 'ar' : langCode === 'en' ? 'en' : 'fr';
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
    utter.lang = lang === 'ar' ? 'ar' : lang === 'en' ? 'en-US' : 'fr-FR';
    if (voice) utter.voice = voice;
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  } catch {}
}

function AvatarAssistant() {
  const { prefs, setPrefs, t } = usePreferences();
  const [open, setOpen] = useState(() => !localStorage.getItem('assistantDismissed'));
  const [caption, setCaption] = useState('');
  const [voicesReady, setVoicesReady] = useState(false);

  const options = useMemo(
    () => [
      { key: 'presenceQuickMode', label: t('presence'), action: () => setPrefs((p) => ({ ...p, presenceQuickMode: true })) },
      { key: 'mobileMode', label: t('mobile'), action: () => setPrefs((p) => ({ ...p, mobileMode: true })) },
      { key: 'accessibilityMode', label: t('accessibility'), action: () => setPrefs((p) => ({ ...p, accessibilityMode: true })) },
      { key: 'language', label: t('language'), action: null },
      { key: 'signLanguageMode', label: t('signLanguage'), action: () => setPrefs((p) => ({ ...p, signLanguageMode: true })) },
    ],
    [setPrefs, t]
  );

  useEffect(() => {
    const onVoicesChanged = () => setVoicesReady(true);
    if ('speechSynthesis' in window) {
      const list = speechSynthesis.getVoices();
      setVoicesReady(list && list.length > 0);
      window.speechSynthesis.addEventListener?.('voiceschanged', onVoicesChanged);
    }
    return () => {
      window.speechSynthesis?.removeEventListener?.('voiceschanged', onVoicesChanged);
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

  if (!open) return null;

  return (
    <div className="assistant-backdrop" role="dialog" aria-modal="true">
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

        <div className="assistant-grid">
          {options.map((opt) => (
            <button
              key={opt.key}
              className="assistant-btn"
              onClick={() => {
                if (opt.key === 'language') return; // handled below
                opt.action?.();
                onClose();
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="assistant-language">
          <span>{t('language')}:</span>
          <div className="assistant-lang-buttons">
            <button onClick={() => setLanguage('fr')} className={prefs.language === 'fr' ? 'active' : ''}>FR</button>
            <button onClick={() => setLanguage('ar')} className={prefs.language === 'ar' ? 'active' : ''}>AR</button>
            <button onClick={() => setLanguage('en')} className={prefs.language === 'en' ? 'active' : ''}>EN</button>
          </div>
        </div>

        {prefs.signLanguageMode && (
          <div className="assistant-signlang">
            {/* Placeholder: integrate short sign-language videos or 3D avatar */}
            <video controls width="100%" aria-label="Message en langue des signes">
              <source src="/assets/sign-language/welcome.mp4" type="video/mp4" />
            </video>
          </div>
        )}
      </div>
    </div>
  );
}

export default AvatarAssistant;
