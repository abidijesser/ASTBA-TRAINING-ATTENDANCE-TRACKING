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
        <div className="language-switcher" style={{ display: 'flex', gap: '10px', padding: '10px' }}>
            {languages.map((lang) => (
                <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`lang-btn ${language === lang.code ? 'active' : ''}`}
                    style={{
                        padding: '5px 10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: language === lang.code ? '#007bff' : '#fff',
                        color: language === lang.code ? '#fff' : '#333',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                    }}
                    aria-label={`Switch to ${lang.label}`}
                >
                    {lang.label}
                </button>
            ))}
        </div>
    );
};

export default LanguageSwitcher;
