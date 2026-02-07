
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferenceContext';
import { Button, Input, Card } from '../components/ui';
import './Login.css';

/**
 * Login Page
 * Modern, professional login interface
 */
const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { setPrefs } = usePreferences();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
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
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.email) {
            newErrors.email = "L'email est requis";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email invalide';
        }

        if (!formData.password) {
            newErrors.password = 'Le mot de passe est requis';
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
            await login(formData);
            // Show assistant right after login and a short interpreter hint
            setPrefs((p) => ({ ...p, assistantOnLogin: true, voiceEnabled: true, showInterpreterHint: true }));
            navigate('/dashboard');
        } catch (error) {
            setGeneralError(
                error.response?.data?.message || 'Erreur de connexion. Veuillez réessayer.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="login-container">
            <div className="login-box">
                <header className="login-header">
                    <div className="login-logo" aria-hidden="true">
                        <div className="logo-icon">AS</div>
                    </div>
                    <h1 className="login-title">ASTBA</h1>
                    <p className="login-subtitle">Système de Gestion de Formations</p>
                </header>

                <Card>
                    <form onSubmit={handleSubmit} className="login-form" aria-label="Formulaire de connexion">
                        {generalError && (
                            <div className="login-error-banner" role="alert" aria-live="assertive">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
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
                            label="Email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="votreemail@exemple.com"
                            error={errors.email}
                            required
                        />

                        <Input
                            label="Mot de passe"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            error={errors.password}
                            required
                        />

                        <Button type="submit" fullWidth loading={loading}>
                            Se connecter
                        </Button>
                    </form>
                </Card>

                <p className="login-footer">
                    Première connexion ?{' '}
                    <Link to="/register" className="login-link">
                        Créer un compte
                    </Link>
                </p>
            </div>
        </main>
    );
};

export default Login;