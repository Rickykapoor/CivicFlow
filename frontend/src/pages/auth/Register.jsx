import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Loader2 } from 'lucide-react';
import { auth } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

function strength(pw) {
    if (pw.length < 8) return null;
    if (!/[A-Z]/.test(pw)) return null;
    if (!/\d/.test(pw)) return null;
    return true;
}

export default function Register() {
    const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const pwOk = strength(form.password);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!pwOk) return setError('Password must be ≥8 chars, include uppercase & a digit.');
        setError('');
        setLoading(true);
        try {
            await auth.register(form);
            const res = await auth.login({ email: form.email, password: form.password });
            const { access_token, refresh_token } = res.data;
            await login(access_token, refresh_token);
            navigate('/dashboard');
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
                <p className="auth-subtitle">Create your citizen account</p>

                {error && <div className="alert alert-error">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input id="reg-name" type="text" className="form-control"
                            placeholder="Jane Doe" value={form.full_name} onChange={set('full_name')} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input id="reg-email" type="email" className="form-control"
                            placeholder="you@example.com" value={form.email} onChange={set('email')} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Phone (optional)</label>
                        <input id="reg-phone" type="tel" className="form-control"
                            placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input id="reg-password" type="password" className="form-control"
                            placeholder="Min 8 chars, 1 uppercase, 1 digit"
                            value={form.password} onChange={set('password')} required />
                        {form.password && (
                            <div style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>
                                {pwOk
                                    ? <span className="text-success">✓ Strong password</span>
                                    : <span className="text-danger">Password needs uppercase + digit + 8 chars</span>}
                            </div>
                        )}
                    </div>
                    <button id="reg-submit" type="submit" className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center', padding: '0.65rem', marginTop: '0.5rem' }}
                        disabled={loading}>
                        {loading ? <Loader2 size={18} className="spin" /> : 'Create Account'}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>
            <style>{`.spin { animation: spin 0.7s linear infinite; }`}</style>
        </div>
    );
}
