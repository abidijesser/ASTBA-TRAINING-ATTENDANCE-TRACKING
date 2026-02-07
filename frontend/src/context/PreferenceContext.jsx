import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const PreferenceContext = createContext(null);

const defaultPrefs = {
  presenceQuickMode: false,
  mobileMode: false,
  accessibilityMode: false,
  language: 'fr',
  signLanguageMode: false,
  voiceEnabled: false,
};

function detectMobile() {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function PreferenceProvider({ children }) {
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('prefs');
      const parsed = saved ? JSON.parse(saved) : defaultPrefs;
      return { ...defaultPrefs, ...parsed, mobileMode: parsed?.mobileMode ?? detectMobile() };
    } catch {
      return { ...defaultPrefs, mobileMode: detectMobile() };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('prefs', JSON.stringify(prefs));
    } catch {}
  }, [prefs]);

  // Simple i18n dictionary focused on assistant content for now
  const dictionary = useMemo(
    () => ({
      fr: {
        welcome: "Bienvenue ! Pour mieux vous aider, choisissez un mode.",
        ask: "Souhaitez-vous un mode simplifié, mobile, accessibilité ou multilingue ?",
        presence: "Présences intelligentes",
        mobile: "Mode mobile",
        accessibility: "Accessibilité renforcée",
        language: "Choisir la langue",
        signLanguage: "Langue des signes",
        confirmPresenceAll: "Tous marqués présents",
        presenceRecorded: "Présence enregistrée",
      },
      ar: {
        welcome: "مرحبًا! لمساعدتك بشكل أفضل، اختر وضعًا.",
        ask: "هل تريد وضع مبسط، المحمول، إمكانية الوصول أو متعدد اللغات؟",
        presence: "حضور ذكي",
        mobile: "وضع المحمول",
        accessibility: "وضع إمكانية الوصول",
        language: "اختر اللغة",
        signLanguage: "لغة الإشارة",
        confirmPresenceAll: "تم تحديد الجميع حاضرًا",
        presenceRecorded: "تم تسجيل الحضور",
      },
      en: {
        welcome: "Welcome! To help you best, pick a mode.",
        ask: "Do you want simplified, mobile, accessibility or multilingual?",
        presence: "Smart Attendance",
        mobile: "Mobile Mode",
        accessibility: "Accessibility Mode",
        language: "Choose Language",
        signLanguage: "Sign Language",
        confirmPresenceAll: "All marked present",
        presenceRecorded: "Attendance recorded",
      },
    }),
    []
  );

  const t = (key) => dictionary[prefs.language]?.[key] ?? dictionary.fr[key] ?? key;

  const value = useMemo(
    () => ({ prefs, setPrefs, t }),
    [prefs]
  );

  return <PreferenceContext.Provider value={value}>{children}</PreferenceContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferenceContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferenceProvider');
  return ctx;
}
