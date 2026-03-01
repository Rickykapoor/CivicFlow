import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Loader2 } from 'lucide-react';
import { issues } from '../../api/api';

const CATEGORIES = [
    'ROAD', 'WATER', 'ELECTRICITY', 'GARBAGE', 'DRAINAGE',
    'STREETLIGHT', 'PARK', 'PUBLIC_TRANSPORT', 'SANITATION', 'NOISE', 'OTHER',
];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function ReportIssue() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        title: '', description: '', category: 'ROAD', priority: 'MEDIUM',
        address: '', ward: '', zone: '',
        latitude: '', longitude: '',
        tag_names_input: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [locating, setLocating] = useState(false);

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    function detectLocation() {
        if (!navigator.geolocation) return;
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                setForm(f => ({
                    ...f,
                    latitude: coords.latitude.toFixed(6),
                    longitude: coords.longitude.toFixed(6),
                }));
                setLocating(false);
            },
            () => setLocating(false)
        );
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const payload = {
                title: form.title,
                description: form.description,
                category: form.category,
                priority: form.priority,
                address: form.address || undefined,
                ward: form.ward || undefined,
                zone: form.zone || undefined,
                latitude: form.latitude ? parseFloat(form.latitude) : undefined,
                longitude: form.longitude ? parseFloat(form.longitude) : undefined,
                tag_names: form.tag_names_input
                    ? form.tag_names_input.split(',').map(t => t.trim()).filter(Boolean)
                    : [],
            };
            const res = await issues.create(payload);
            navigate(`/issues/${res.data.id}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fade-in" style={{ maxWidth: '720px' }}>
            <div className="page-header">
                <h2>Report an Issue</h2>
                <p>Fill in the details and we'll pass it on to the right department.</p>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="card" style={{ marginBottom: '1.25rem' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-muted)' }}>Basic Info</h3>
                    <div className="form-group mb-2">
                        <label className="form-label">Title *</label>
                        <input id="ri-title" type="text" className="form-control" placeholder="Short description of the problem"
                            value={form.title} onChange={set('title')} required maxLength={500} />
                    </div>
                    <div className="form-group mb-2">
                        <label className="form-label">Description *</label>
                        <textarea id="ri-desc" className="form-control" placeholder="Provide as much detail as possible..."
                            value={form.description} onChange={set('description')} required rows={4} />
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Category *</label>
                            <select id="ri-category" className="form-control" value={form.category} onChange={set('category')}>
                                {CATEGORIES.map(c => (
                                    <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Priority</label>
                            <select id="ri-priority" className="form-control" value={form.priority} onChange={set('priority')}>
                                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ marginBottom: '1.25rem' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-muted)' }}>Location</h3>
                    <div className="form-group mb-2">
                        <label className="form-label">Address</label>
                        <input id="ri-address" type="text" className="form-control" placeholder="Street / landmark"
                            value={form.address} onChange={set('address')} />
                    </div>
                    <div className="grid-2 mb-2">
                        <div className="form-group">
                            <label className="form-label">Ward</label>
                            <input id="ri-ward" type="text" className="form-control" placeholder="e.g. Ward 42"
                                value={form.ward} onChange={set('ward')} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Zone</label>
                            <input id="ri-zone" type="text" className="form-control" placeholder="e.g. North"
                                value={form.zone} onChange={set('zone')} />
                        </div>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Latitude</label>
                            <input id="ri-lat" type="number" step="any" className="form-control"
                                value={form.latitude} onChange={set('latitude')} placeholder="Auto-detected" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Longitude</label>
                            <input id="ri-lng" type="number" step="any" className="form-control"
                                value={form.longitude} onChange={set('longitude')} placeholder="Auto-detected" />
                        </div>
                    </div>
                    <button type="button" className="btn btn-outline btn-sm mt-1" onClick={detectLocation} disabled={locating}>
                        {locating ? <Loader2 size={14} className="spin" /> : <MapPin size={14} />}
                        {locating ? 'Locating…' : 'Use My Location'}
                    </button>
                </div>

                <div className="card mb-2">
                    <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-muted)' }}>Tags</h3>
                    <div className="form-group">
                        <label className="form-label">Tags (comma-separated)</label>
                        <input id="ri-tags" type="text" className="form-control"
                            placeholder="e.g. pothole, urgent, monsoon"
                            value={form.tag_names_input} onChange={set('tag_names_input')} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                    <button id="ri-submit" type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? <Loader2 size={16} className="spin" /> : null}
                        {loading ? 'Submitting…' : 'Submit Report'}
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
                        Cancel
                    </button>
                </div>
            </form>
            <style>{`.spin { animation: spin 0.7s linear infinite; }`}</style>
        </div>
    );
}
