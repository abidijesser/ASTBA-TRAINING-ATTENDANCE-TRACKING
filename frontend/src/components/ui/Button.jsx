import './Button.css';
import { hasSignVideoForPhrase, normalizePhraseExact } from '../../sign/signLanguageLibrary';
import PropTypes from 'prop-types';

/**
 * Button Component
 * Professional button with multiple variants
 */
const Button = ({
    children,
    variant = 'primary',
    size = 'medium',
    fullWidth = false,
    disabled = false,
    loading = false,
    onClick,
    type = 'button',
    ...props
}) => {
    const phrase = typeof children === 'string' ? normalizePhraseExact(children) : '';
    const signSupported = phrase ? hasSignVideoForPhrase(phrase) : false;

    const classNames = [
        'btn',
        `btn-${variant}`,
        `btn-${size}`,
        fullWidth && 'btn-full-width',
        loading && 'btn-loading',
        signSupported && 'btn-sign-supported',
    ]
        .filter(Boolean)
        .join(' ');

    const mainButton = (
        <button
            type={type}
            className={classNames}
            disabled={disabled || loading}
            onClick={onClick}
            aria-busy={loading}
            aria-disabled={disabled || loading}
            {...props}
        >
            {loading && <span className="btn-spinner" aria-hidden="true"></span>}
            <span className={loading ? 'btn-content-loading' : ''}>{children}</span>
        </button>
    );

    if (!signSupported) return mainButton;

    return (
        <span className="btn-sign-wrap" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {mainButton}
            <button
                type="button"
                className="btn-sign-icon"
                onClick={() => globalThis.openSignLanguage?.(phrase)}
                aria-label="Voir en langue des signes"
                title="Voir en langue des signes"
                disabled={disabled || loading}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 34,
                    height: 34,
                    borderRadius: 999,
                    border: '1px solid var(--border-color, #e5e7eb)',
                    background: 'var(--card-bg, #fff)',
                    color: 'var(--text-color, #111)',
                    cursor: disabled || loading ? 'not-allowed' : 'pointer',
                }}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="4" r="2" />
                    <path d="M10 22l2-7 2 7" />
                    <path d="M12 6v6" />
                    <path d="M7 10h10" />
                    <path d="M9 22h6" />
                </svg>
            </button>
        </span>
    );
};

export default Button;

Button.propTypes = {
    children: PropTypes.node,
    variant: PropTypes.string,
    size: PropTypes.string,
    fullWidth: PropTypes.bool,
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    onClick: PropTypes.func,
    type: PropTypes.string,
};
