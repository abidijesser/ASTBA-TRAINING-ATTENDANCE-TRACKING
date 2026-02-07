import './Button.css';

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
    const classNames = [
        'btn',
        `btn-${variant}`,
        `btn-${size}`,
        fullWidth && 'btn-full-width',
        loading && 'btn-loading',
    ]
        .filter(Boolean)
        .join(' ');

    return (
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
};

export default Button;
