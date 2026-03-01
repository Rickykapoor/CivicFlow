import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, MapPin } from 'lucide-react';

function initials(name = '') {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function Navbar() {
    const { user, logout } = useAuth();

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-brand">
                <MapPin size={20} color="var(--accent)" />
                City<span style={{ color: 'var(--accent)' }}>Fix</span>
                <span className="brand-dot" />
            </Link>

            <div className="navbar-right">
                {user && (
                    <>
                        <div className="user-pill">
                            <div className="avatar">{initials(user.full_name)}</div>
                            <span>{user.full_name}</span>
                            <span style={{
                                fontSize: '0.7rem',
                                background: 'var(--surface3)',
                                padding: '0.1rem 0.4rem',
                                borderRadius: '999px',
                                marginLeft: '0.25rem',
                                color: 'var(--accent)',
                                fontWeight: 600,
                            }}>
                                {user.role}
                            </span>
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={logout} title="Log out">
                            <LogOut size={16} />
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
}
