import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button, Input, Card } from '../components/ui';
import './Login.css';

/**
 * Register Page
 * Create new admin/responsable/formateur account
 */
const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const { t } = useLanguage();

    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        password: '',
        role: 'formateur',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [generalError, setGeneralError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.nom) {
            newErrors.nom = t('common.errorName');
        }

        if (!formData.prenom) {
            newErrors.prenom = t('common.errorFirstName');
        }

        if (!formData.email) {
            newErrors.email = t('auth.emailRequired');
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = t('auth.emailInvalid');
        }

        if (!formData.password) {
            newErrors.password = t('auth.passwordRequired');
        } else if (formData.password.length < 6) {
            newErrors.password = t('auth.passwordMinLength');
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGeneralError('');

        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);

        try {
            console.log('Sending registration data:', formData);
            await register(formData);
            navigate('/dashboard');
        } catch (error) {
            console.error('Registration Error:', error);
            console.error('Error Response:', error.response);

            if (error.response?.data?.errors) {
                const backendErrors = {};
                error.response.data.errors.forEach(err => {
                    // Map backend field names to frontend state names if needed
                    // The validator uses 'path' which matches our field names (nom, prenom, etc)
                    backendErrors[err.field] = err.message;
                });
                setErrors(backendErrors);
                setGeneralError(t('auth.fixErrors'));
            } else {
                const errorMessage = error.response?.data?.message ||
                    error.message ||
                    t('auth.registerError');
                setGeneralError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="login-header">

                    <h1 className="login-title">ASTBA</h1>
                </div>

                <Card>
                    <form onSubmit={handleSubmit} className="login-form">
                        {generalError && (
                            <div className="login-error-banner" style={{ whiteWhiteSpace: 'pre-wrap' }}>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                {generalError}
                            </div>
                        )}

                        <Input
                            label={t('auth.lastName')}
                            type="text"
                            name="nom"
                            value={formData.nom}
                            onChange={handleChange}
                            placeholder={t('auth.lastName')}
                            error={errors.nom}
                            required
                        />

                        <Input
                            label={t('auth.firstName')}
                            type="text"
                            name="prenom"
                            value={formData.prenom}
                            onChange={handleChange}
                            placeholder={t('auth.firstName')}
                            error={errors.prenom}
                            required
                        />

                        <Input
                            label={t('auth.email')}
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="votreemail@exemple.com"
                            error={errors.email}
                            required
                        />

                        <Input
                            label={t('auth.password')}
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            error={errors.password}
                            required
                        />

                        <div className="input-group">
                            <label htmlFor="role" className="input-label">
                                {t('auth.role')} <span className="input-required">*</span>
                            </label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="input"
                            >
                                <option value="formateur">{t('auth.trainer')}</option>
                                <option value="responsable">{t('auth.manager')}</option>
                                <option value="admin">{t('auth.admin')}</option>
                            </select>
                        </div>

                        <Button type="submit" fullWidth loading={loading}>
                            {t('auth.createAccount')}
                        </Button>
                    </form>
                </Card>

                <p className="login-footer">
                    {t('auth.alreadyRegistered')}{' '}
                    <Link to="/login" className="login-link">
                        {t('auth.loginButton')}
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
