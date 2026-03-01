import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Layouts
import AppLayout from './components/AppLayout';

// Citizen pages
import CitizenDashboard from './pages/citizen/Dashboard';
import ReportIssue from './pages/citizen/ReportIssue';

// Staff pages
import StaffDashboard from './pages/staff/Dashboard';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminIssueList from './pages/admin/IssueList';
import AdminUsers from './pages/admin/Users';
import AdminDepartments from './pages/admin/Departments';
import AdminOverdue from './pages/admin/OverdueIssues';
import AdminAuditLogs from './pages/admin/AuditLogs';

// Shared
import IssueDetail from './pages/shared/IssueDetail';
import NotFound from './pages/NotFound';

function ProtectedRoute({ children }) {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" replace />;
}

function RoleRoute({ roles, children }) {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    if (!roles.includes(user.role)) {
        if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
        if (user.role === 'STAFF') return <Navigate to="/staff" replace />;
        return <Navigate to="/dashboard" replace />;
    }
    return children;
}

function RootRedirect() {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'STAFF') return <Navigate to="/staff" replace />;
    return <Navigate to="/dashboard" replace />;
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Root redirect */}
                    <Route path="/" element={<RootRedirect />} />

                    {/* Authenticated routes (with sidebar layout) */}
                    <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                        {/* Citizen */}
                        <Route path="/dashboard" element={
                            <RoleRoute roles={['CITIZEN', 'STAFF', 'ADMIN']}>
                                <CitizenDashboard />
                            </RoleRoute>
                        } />
                        <Route path="/report" element={
                            <RoleRoute roles={['CITIZEN', 'STAFF', 'ADMIN']}>
                                <ReportIssue />
                            </RoleRoute>
                        } />

                        {/* Staff */}
                        <Route path="/staff" element={
                            <RoleRoute roles={['STAFF', 'ADMIN']}>
                                <StaffDashboard />
                            </RoleRoute>
                        } />

                        {/* Shared issue detail */}
                        <Route path="/issues/:id" element={<IssueDetail />} />

                        {/* Admin */}
                        <Route path="/admin" element={<RoleRoute roles={['ADMIN']}><AdminDashboard /></RoleRoute>} />
                        <Route path="/admin/issues" element={<RoleRoute roles={['ADMIN']}><AdminIssueList /></RoleRoute>} />
                        <Route path="/admin/users" element={<RoleRoute roles={['ADMIN']}><AdminUsers /></RoleRoute>} />
                        <Route path="/admin/departments" element={<RoleRoute roles={['ADMIN']}><AdminDepartments /></RoleRoute>} />
                        <Route path="/admin/overdue" element={<RoleRoute roles={['ADMIN']}><AdminOverdue /></RoleRoute>} />
                        <Route path="/admin/audit" element={<RoleRoute roles={['ADMIN']}><AdminAuditLogs /></RoleRoute>} />
                    </Route>

                    <Route path="*" element={<NotFound />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
