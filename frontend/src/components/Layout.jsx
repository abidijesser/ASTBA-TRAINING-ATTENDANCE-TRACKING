import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Layout Component
 * Provides consistent header/navigation across all pages
 */
const Layout = ({ children }) => {
    const { isAuthenticated, user, logout } = useAuth();

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header / Navbar */}
            <header style={{
                padding: '1rem 2rem',
                backgroundColor: '#1a1a2e',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>
                    <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
                        Maratech ASTBA
                    </Link>
                </h1>

                <nav>
                    {isAuthenticated ? (
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>
                                Dashboard
                            </Link>
                            <span style={{ color: '#aaa' }}>|</span>
                            <span>Welcome, {user?.name}</span>
                            <button
                                onClick={logout}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#e74c3c',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>
                                Login
                            </Link>
                            <span style={{ color: '#aaa' }}>|</span>
                            <Link to="/register" style={{ color: 'white', textDecoration: 'none' }}>
                                Register
                            </Link>
                        </div>
                    )}
                </nav>
            </header>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '2rem' }}>
                {children}
            </main>

            {/* Footer */}
            <footer style={{
                padding: '1rem 2rem',
                backgroundColor: '#f8f9fa',
                textAlign: 'center',
                borderTop: '1px solid #e0e0e0'
            }}>
                <p style={{ margin: 0, color: '#666' }}>
                    © 2026 Maratech ASTBA. Built with MERN Stack.
                </p>
            </footer>
        </div>
    );
};

export default Layout;
