import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const LanguageSwitcher = () => {
    const { language, changeLanguage } = useLanguage();

    const languages = [
        { code: 'en', label: '🇬🇧 English' },
        { code: 'fr', label: '🇫🇷 Français' },
        { code: 'ar', label: '🇸🇦 العربية' }
    ];

    return (
        <fieldset className="topbar-controls">
            <legend className="sr-only">Language</legend>
            {languages.map((lang) => (
                <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`topbar-btn ${language === lang.code ? 'active' : ''}`}
                    aria-label={`Switch to ${lang.label}`}
                >
                    {lang.label}
                </button>
            ))}
        </fieldset>
    );
};

export default LanguageSwitcher;
