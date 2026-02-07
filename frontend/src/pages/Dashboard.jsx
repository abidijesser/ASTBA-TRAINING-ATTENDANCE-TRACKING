import { useAuth } from '../context/AuthContext';
import FileUpload from '../components/FileUpload';

/**
 * Dashboard Page
 * Protected page for authenticated users
 */
const Dashboard = () => {
    const { user } = useAuth();

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h1 style={{ color: '#1a1a2e', marginBottom: '2rem' }}>Dashboard</h1>

            {/* User Info Card */}
            <div style={{
                backgroundColor: '#f8f9fa',
                padding: '2rem',
                borderRadius: '8px',
                marginBottom: '2rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{ marginTop: 0, color: '#3498db' }}>Welcome, {user?.name}! 👋</h2>
                <div style={{ color: '#666' }}>
                    <p><strong>Email:</strong> {user?.email}</p>
                    <p><strong>User ID:</strong> {user?.id}</p>
                    {user?.createdAt && (
                        <p><strong>Member since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
                    )}
                </div>
            </div>

            {/* File Upload Section */}
            <div style={{
                backgroundColor: '#fff',
                padding: '2rem',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{ marginTop: 0, color: '#3498db' }}>File Upload</h2>
                <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                    Try uploading an image to Cloudinary using the form below:
                </p>
                <FileUpload />
            </div>

            {/* Info Section */}
            <div style={{
                backgroundColor: '#e7f3ff',
                padding: '1.5rem',
                borderRadius: '8px',
                marginTop: '2rem',
                border: '1px solid #b3d9ff'
            }}>
                <h3 style={{ marginTop: 0, color: '#1a1a2e' }}>ℹ️ About This App</h3>
                <p style={{ color: '#666', margin: 0 }}>
                    This is a production-ready MERN stack application featuring JWT authentication,
                    protected routes, MongoDB integration, and Cloudinary file storage. You're currently
                    viewing a protected route that requires authentication.
                </p>
            </div>
        </div>
    );
};

export default Dashboard;
