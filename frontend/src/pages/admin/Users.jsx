import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { users } from '../../api/api';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';

const ROLES = ['CITIZEN', 'STAFF', 'ADMIN'];

function fmt(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { dateStyle: 'medium' });
}

export default function AdminUsers() {
    const [data, setData] = useState({ items: [], total: 0, pages: 1 });
    const [page, setPage] = useState(1);
    const [roleFilter, setRoleFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Role edit modal
    const [editUser, setEditUser] = useState(null);
    const [newRole, setNewRole] = useState('');
    const [saving, setSaving] = useState(false);

    async function load(pg = page, role = roleFilter) {
        setLoading(true);
        setError('');
        try {
            const params = { page: pg, page_size: 20 };
            if (role) params.role = role;
            const res = await users.list(params);
            setData(res.data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(1, roleFilter); setPage(1); }, [roleFilter]);
    useEffect(() => { load(page, roleFilter); }, [page]);

    async function handleRoleUpdate() {
        setSaving(true);
        try {
            await users.updateRole(editUser.id, { role: newRole });
            setEditUser(null);
            await load(page, roleFilter);
        } catch (e) {
            alert(e.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleDeactivate(u) {
        if (!confirm(`Deactivate ${u.full_name}?`)) return;
        try {
            await users.deactivate(u.id);
            await load(page, roleFilter);
        } catch (e) {
            alert(e.message);
        }
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h2>User Management</h2>
                <p>Manage roles and user accounts</p>
            </div>

            <div className="filters-bar">
                <select className="form-control" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                    <option value="">All Roles</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <span className="text-muted text-sm">{data.total} users</span>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : (
                <>
                    <div className="card">
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Active</th>
                                        <th>Joined</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.items.map(u => (
                                        <tr key={u.id}>
                                            <td style={{ fontWeight: 500 }}>{u.full_name}</td>
                                            <td className="text-muted">{u.email}</td>
                                            <td>
                                                <span className={`badge badge-${u.role === 'ADMIN' ? 'critical' : u.role === 'STAFF' ? 'in_progress' : 'open'}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ color: u.is_active ? 'var(--success)' : 'var(--danger)', fontWeight: 600, fontSize: '0.82rem' }}>
                                                    {u.is_active ? '✓ Active' : '✗ Inactive'}
                                                </span>
                                            </td>
                                            <td className="text-muted">{fmt(u.created_at)}</td>
                                            <td>
                                                <div className="flex gap-1">
                                                    <button className="btn btn-outline btn-sm"
                                                        onClick={() => { setEditUser(u); setNewRole(u.role); }}>
                                                        Role
                                                    </button>
                                                    {u.is_active && (
                                                        <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(u)}>
                                                            Deactivate
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {data.items.length === 0 && (
                                        <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No users found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <Pagination page={page} totalPages={data.pages} onPageChange={setPage} />
                </>
            )}

            {editUser && (
                <Modal title={`Change Role — ${editUser.full_name}`} onClose={() => setEditUser(null)}
                    footer={
                        <>
                            <button className="btn btn-outline" onClick={() => setEditUser(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleRoleUpdate} disabled={saving}>
                                {saving ? <Loader2 size={14} /> : 'Save'}
                            </button>
                        </>
                    }
                >
                    <div className="form-group">
                        <label className="form-label">New Role</label>
                        <select className="form-control" value={newRole} onChange={e => setNewRole(e.target.value)}>
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                </Modal>
            )}
        </div>
    );
}
