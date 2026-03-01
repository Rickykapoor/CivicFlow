import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, PlusCircle, List, Users, Building2,
    AlertTriangle, ScrollText, LogOut, Boxes, MapPin
} from 'lucide-react';

function SLink({ to, icon: Icon, label }) {
    return (
        <NavLink
            to={to}
            end
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
            <Icon size={17} />
            {label}
        </NavLink>
    );
}

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="sidebar">
            {/* Citizen links (all roles) */}
            <div className="sidebar-section">My Portal</div>
            <SLink to="/dashboard" icon={LayoutDashboard} label="My Issues" />
            <SLink to="/report" icon={PlusCircle} label="Report Issue" />

            {/* Staff links */}
            {(user?.role === 'STAFF' || user?.role === 'ADMIN') && (
                <>
                    <div className="sidebar-section">Staff</div>
                    <SLink to="/staff" icon={List} label="All Issues" />
                </>
            )}

            {/* Admin links */}
            {user?.role === 'ADMIN' && (
                <>
                    <div className="sidebar-section">Admin</div>
                    <SLink to="/admin" icon={LayoutDashboard} label="Dashboard" />
                    <SLink to="/admin/issues" icon={List} label="Issue Manager" />
                    <SLink to="/admin/users" icon={Users} label="Users" />
                    <SLink to="/admin/departments" icon={Building2} label="Departments" />
                    <SLink to="/admin/overdue" icon={AlertTriangle} label="Overdue SLAs" />
                    <SLink to="/admin/audit" icon={ScrollText} label="Audit Logs" />
                </>
            )}

            <div className="sidebar-bottom">
                <button className="sidebar-link btn-ghost" onClick={handleLogout}
                    style={{ width: '100%', border: 'none', cursor: 'pointer', background: 'none' }}>
                    <LogOut size={17} />
                    Log Out
                </button>
            </div>
        </aside>
    );
}
