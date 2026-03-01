import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';

export default function NotFound() {
    return (
        <div style={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg)',
            color: 'var(--text)',
            textAlign: 'center',
            padding: '2rem',
        }}>
            <MapPin size={48} color="var(--accent)" style={{ marginBottom: '1rem' }} />
            <h1 style={{ fontFamily: 'var(--font-h)', fontSize: '4rem', color: 'var(--accent)' }}>404</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                This page doesn't exist on the city map.
            </p>
            <Link to="/" className="btn btn-primary">Back to Home</Link>
        </div>
    );
}
