import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const PreferenceContext = createContext(null);

const defaultPrefs = {
  presenceQuickMode: false,
  mobileMode: false,
  accessibilityMode: false,
  // Toggle colorblind-friendly palette across the UI.
  // Normal mode: false, Colorblind-friendly mode: true.
  colorblindMode: false,
  language: 'fr',
  signLanguageMode: false,
  deafMuteMode: false,
  signVideosUnlocked: false,
  voiceEnabled: false,
  assistantOnLogin: false,
  assistantForceCamera: false,
  autoStartGuided: false,
  showInterpreterHint: false,
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
        welcome: "Bienvenue ! Pour mieux vous aider, choisissez votre profil.",
        ask: "Sélectionnez le type de besoin : Sourd, Muet, ou Malvoyant.",
        chooseProfile: "Choisissez un profil.",
        enableVoiceShort: "Activer la voix",
        presence: "Présences intelligentes",
        mobile: "Mode mobile",
        accessibility: "Accessibilité renforcée",
        language: "Choisir la langue",
        signLanguage: "Langue des signes",
        confirmPresenceAll: "Tous marqués présents",
        presenceRecorded: "Présence enregistrée",
      },
      ar: {
        welcome: "مرحبًا! لمساعدتك بشكل أفضل، اختر نوع الاحتياج.",
        ask: "اختر: صمم (أصم)، أبكم، أو ضعيف البصر.",
        chooseProfile: "اختر ملفًا.",
        enableVoiceShort: "تفعيل الصوت",
        presence: "حضور ذكي",
        mobile: "وضع المحمول",
        accessibility: "وضع إمكانية الوصول",
        language: "اختر اللغة",
        signLanguage: "لغة الإشارة",
        confirmPresenceAll: "تم تحديد الجميع حاضرًا",
        presenceRecorded: "تم تسجيل الحضور",
      },
      en: {
        welcome: "Welcome! To help you best, choose your profile.",
        ask: "Select your need: Deaf, Non‑verbal, or Low‑vision.",
        chooseProfile: "Choose a profile.",
        enableVoiceShort: "Enable voice",
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

PreferenceProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function usePreferences() {
  const ctx = useContext(PreferenceContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferenceProvider');
  return ctx;
}
