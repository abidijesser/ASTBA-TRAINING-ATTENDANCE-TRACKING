import { Link } from 'react-router-dom';

/**
 * Home Page
 * Public landing page
 */
const Home = () => {
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <h1 style={{ fontSize: '3rem', color: '#1a1a2e', marginBottom: '1rem' }}>
                Welcome to Maratech ASTBA
            </h1>
            <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '2rem' }}>
                A production-ready MERN stack application with authentication and cloud file storage
            </p>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '2rem',
                marginTop: '3rem'
            }}>
                <div style={{
                    padding: '2rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ color: '#3498db' }}>🔐 JWT Authentication</h3>
                    <p style={{ color: '#666' }}>Secure user registration and login with JSON Web Tokens</p>
                </div>

                <div style={{
                    padding: '2rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ color: '#3498db' }}>☁️ Cloud Storage</h3>
                    <p style={{ color: '#666' }}>Upload and manage files with Cloudinary integration</p>
                </div>

                <div style={{
                    padding: '2rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ color: '#3498db' }}>🚀 Production Ready</h3>
                    <p style={{ color: '#666' }}>Built with best practices and scalable architecture</p>
                </div>
            </div>

            <div style={{ marginTop: '3rem' }}>
                <Link
                    to="/register"
                    style={{
                        display: 'inline-block',
                        padding: '1rem 2rem',
                        backgroundColor: '#3498db',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        fontSize: '1.1rem',
                        marginRight: '1rem'
                    }}
                >
                    Get Started
                </Link>
                <Link
                    to="/login"
                    style={{
                        display: 'inline-block',
                        padding: '1rem 2rem',
                        backgroundColor: '#2ecc71',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        fontSize: '1.1rem'
                    }}
                >
                    Login
                </Link>
            </div>
        </div>
    );
};

export default Home;
