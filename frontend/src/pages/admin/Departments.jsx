import { useState, useEffect } from 'react';
import { PlusCircle, Loader2, Pencil, Trash2 } from 'lucide-react';
import { departments } from '../../api/api';
import Modal from '../../components/Modal';

export default function AdminDepartments() {
    const [depts, setDepts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Create / edit modal
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState(null); // null = create
    const [form, setForm] = useState({ name: '', description: '' });
    const [saving, setSaving] = useState(false);

    async function load() {
        setLoading(true);
        setError('');
        try {
            const res = await departments.list();
            setDepts(res.data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    function openCreate() { setEditing(null); setForm({ name: '', description: '' }); setModal(true); }
    function openEdit(d) { setEditing(d); setForm({ name: d.name, description: d.description ?? '' }); setModal(true); }

    async function handleSave() {
        setSaving(true);
        try {
            if (editing) {
                await departments.update(editing.id, form);
            } else {
                await departments.create(form);
            }
            setModal(false);
            await load();
        } catch (e) {
            alert(e.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(d) {
        if (!confirm(`Delete department "${d.name}"?`)) return;
        try {
            await departments.delete(d.id);
            await load();
        } catch (e) {
            alert(e.message);
        }
    }

    return (
        <div className="fade-in">
            <div className="flex-between mb-3">
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h2>Departments</h2>
                    <p>Manage city departments handling issues</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}>
                    <PlusCircle size={16} /> Add Department
                </button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : (
                <div className="card">
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Description</th>
                                    <th style={{ width: '120px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {depts.map(d => (
                                    <tr key={d.id}>
                                        <td style={{ fontWeight: 600 }}>{d.name}</td>
                                        <td className="text-muted">{d.description ?? '—'}</td>
                                        <td>
                                            <div className="flex gap-1">
                                                <button className="btn btn-outline btn-sm" onClick={() => openEdit(d)}>
                                                    <Pencil size={13} />
                                                </button>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d)}>
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {depts.length === 0 && (
                                    <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                                        No departments yet. Add one!
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {modal && (
                <Modal
                    title={editing ? `Edit: ${editing.name}` : 'New Department'}
                    onClose={() => setModal(false)}
                    footer={
                        <>
                            <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? <Loader2 size={14} className="spin" /> : editing ? 'Save Changes' : 'Create'}
                            </button>
                        </>
                    }
                >
                    <div className="form-group mb-2">
                        <label className="form-label">Name *</label>
                        <input type="text" className="form-control" value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Roads & Infrastructure" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea className="form-control" rows={3} value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description…" />
                    </div>
                </Modal>
            )}
            <style>{`.spin { animation: spin 0.7s linear infinite; }`}</style>
        </div>
    );
}
