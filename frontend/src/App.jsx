import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DialogProvider } from './context/DialogContext';
import DialogContainer from './components/DialogContainer';
import ProtectedRoute from './components/ProtectedRoute';

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

// Layout
import Layout from './components/Layout';

function App() {
    return (
        <DialogProvider>
            <AuthProvider>
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
                    </Route>

                    {/* Catch all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                </BrowserRouter>
            </AuthProvider>
        </DialogProvider>
    );
}

export default App;
