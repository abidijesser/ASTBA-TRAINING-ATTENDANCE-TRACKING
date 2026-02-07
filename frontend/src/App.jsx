import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DialogProvider } from './context/DialogContext';
import { PreferenceProvider, usePreferences } from './context/PreferenceContext';
import DialogContainer from './components/DialogContainer';
import ProtectedRoute from './components/ProtectedRoute';
import AvatarAssistant from './components/AvatarAssistant';
import SignInterpreter from './components/SignInterpreter';
import SignAvatar from './components/SignAvatar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/students/StudentList';
import StudentDetail from './pages/students/StudentDetail';
import FormationList from './pages/formations/FormationList';
import FormationDetail from './pages/formations/FormationDetail';
import SessionList from './pages/sessions/SessionList';
import SessionDetail from './pages/sessions/SessionDetail';
import CertificationList from './pages/certifications/CertificationList';
import History from './pages/History';

// Layout
import Layout from './components/Layout';

function AppRoot() {
    const { prefs } = usePreferences();

    // Apply global classes for accessibility/mobile modes
    const classes = [
        prefs.accessibilityMode ? 'high-contrast' : '',
        prefs.mobileMode ? 'touch-targets' : '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={classes}>
            <DialogContainer />
            <BrowserRouter>
                <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Routes */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="students" element={<StudentList />} />
                    <Route path="students/:id" element={<StudentDetail />} />

                    <Route path="formations" element={<FormationList />} />
                    <Route path="formations/:id" element={<FormationDetail />} />

                    <Route path="sessions" element={<SessionList />} />
                    <Route path="sessions/:id" element={<SessionDetail />} />
                    <Route path="certifications" element={<CertificationList />} />
                    <Route path="history" element={<History />} />
                </Route>

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <AvatarAssistant />
                {/* Show avatar signer when sign mode on; keep video as fallback */}
                <SignInterpreter />
                <SignAvatar />
            </BrowserRouter>
        </div>
    );
}

function App() {
    return (
        <DialogProvider>
            <AuthProvider>
                <PreferenceProvider>
                    <AppRoot />
                </PreferenceProvider>
            </AuthProvider>
        </DialogProvider>
    );
}

export default App;
