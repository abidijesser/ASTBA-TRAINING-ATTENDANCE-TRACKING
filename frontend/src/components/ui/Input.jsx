import './Input.css';

/**
 * Input Component
 * Professional form input with label and error display
 */
const Input = ({
    label,
    type = 'text',
    name,
    value,
    onChange,
    placeholder,
    error,
    required = false,
    disabled = false,
    ...props
}) => {
    const errorId = error ? `${name}-error` : undefined;

    return (
        <div className="input-group">
            {label && (
                <label htmlFor={name} className="input-label">
                    {label}
                    {required && <span className="input-required" aria-label="required">*</span>}
                </label>
            )}
            <input
                type={type}
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                aria-required={required}
                aria-invalid={!!error}
                aria-describedby={errorId}
                className={`input ${error ? 'input-error' : ''}`}
                {...props}
            />
            {error && (
                <span
                    id={errorId}
                    className="input-error-message"
                    role="alert"
                    aria-live="polite"
                >
                    {error}
                </span>
            )}
        </div>
    );
};

export default Input;
