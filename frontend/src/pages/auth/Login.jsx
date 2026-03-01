import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Loader2 } from 'lucide-react';
import { auth } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await auth.login({ email, password });
            const { access_token, refresh_token } = res.data;
            const user = await login(access_token, refresh_token);
            if (user.role === 'ADMIN') navigate('/admin');
            else if (user.role === 'STAFF') navigate('/staff');
            else navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-box">
                <div className="auth-logo">
                    <MapPin size={24} color="var(--accent)" />
                    City<span style={{ color: 'var(--accent)' }}>Fix</span>
                </div>
                <p className="auth-subtitle">Sign in to your account</p>

                {error && <div className="alert alert-error">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email address</label>
                        <input
                            id="login-email"
                            type="email"
                            className="form-control"
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            id="login-password"
                            type="password"
                            className="form-control"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        id="login-submit"
                        type="submit"
                        className="btn btn-primary"
                        style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center', padding: '0.65rem' }}
                        disabled={loading}
                    >
                        {loading ? <Loader2 size={18} className="spin" /> : 'Sign In'}
                    </button>
                </form>

                <p className="auth-footer">
                    Don't have an account?{' '}
                    <Link to="/register">Create one</Link>
                </p>
            </div>
            <style>{`.spin { animation: spin 0.7s linear infinite; }`}</style>
        </div>
    );
}
