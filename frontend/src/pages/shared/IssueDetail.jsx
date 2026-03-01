import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    MapPin, Clock, User, Paperclip, MessageSquare,
    ChevronLeft, Upload, Loader2, AlertTriangle
} from 'lucide-react';
import { issues } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../components/Badges';
import Modal from '../../components/Modal';

const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

function fmt(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function SlaCountdown({ deadline }) {
    if (!deadline) return null;
    const diff = new Date(deadline) - Date.now();
    const days = Math.floor(diff / 864e5);
    const hours = Math.floor((diff % 864e5) / 36e5);
    const cls = diff < 0 ? 'sla-overdue' : diff < 86400000 ? 'sla-warning' : 'sla-ok';
    return (
        <span className={cls} style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            {diff < 0 ? '⚠ Overdue' : `⏱ ${days}d ${hours}h left`}
        </span>
    );
}

export default function IssueDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [issue, setIssue] = useState(null);
    const [history, setHistory] = useState([]);
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Status modal
    const [statusModal, setStatusModal] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [statusComment, setStatusComment] = useState('');
    const [statusLoading, setStatusLoading] = useState(false);

    // Note modal
    const [noteModal, setNoteModal] = useState(false);
    const [noteContent, setNoteContent] = useState('');
    const [noteInternal, setNoteInternal] = useState(true);
    const [noteLoading, setNoteLoading] = useState(false);

    // Upload
    const [uploading, setUploading] = useState(false);

    const isStaffOrAdmin = user?.role === 'STAFF' || user?.role === 'ADMIN';

    async function loadAll() {
        setLoading(true);
        setError('');
        try {
            const [iRes, hRes, nRes] = await Promise.all([
                issues.get(id),
                issues.history(id),
                issues.notes(id),
            ]);
            setIssue(iRes.data);
            setHistory(hRes.data);
            setNotes(nRes.data);
            setNewStatus(iRes.data.status);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadAll(); }, [id]);

    async function handleStatusChange() {
        setStatusLoading(true);
        try {
            await issues.changeStatus(id, { status: newStatus, comment: statusComment });
            setStatusModal(false);
            setStatusComment('');
            await loadAll();
        } catch (e) {
            alert(e.message);
        } finally {
            setStatusLoading(false);
        }
    }

    async function handleAddNote() {
        if (!noteContent.trim()) return;
        setNoteLoading(true);
        try {
            await issues.addNote(id, { content: noteContent, is_internal: noteInternal });
            setNoteModal(false);
            setNoteContent('');
            const nRes = await issues.notes(id);
            setNotes(nRes.data);
        } catch (e) {
            alert(e.message);
        } finally {
            setNoteLoading(false);
        }
    }

    async function handleUpload(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            await issues.uploadAttachment(id, file);
            await loadAll();
        } catch (e) {
            alert(e.message);
        } finally {
            setUploading(false);
        }
    }

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;
    if (error) return <div className="alert alert-error">{error}</div>;
    if (!issue) return null;

    return (
        <div className="fade-in" style={{ maxWidth: '860px' }}>
            {/* Back + actions */}
            <div className="flex-between mb-2">
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
                    <ChevronLeft size={16} /> Back
                </button>
                {isStaffOrAdmin && (
                    <div className="flex gap-1">
                        <button className="btn btn-outline btn-sm" onClick={() => setStatusModal(true)}>
                            Change Status
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => setNoteModal(true)}>
                            <MessageSquare size={14} /> Add Note
                        </button>
                    </div>
                )}
            </div>

            {/* Header card */}
            <div className="card mb-2">
                <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h2 style={{ fontSize: '1.3rem' }}>{issue.title}</h2>
                    <div className="flex gap-1">
                        <StatusBadge status={issue.status} />
                        <PriorityBadge priority={issue.priority} />
                    </div>
                </div>

                <p style={{ color: 'var(--text-muted)', marginTop: '0.625rem', lineHeight: '1.7' }}>
                    {issue.description}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span>
                        <CategoryBadge category={issue.category} />
                    </span>
                    {issue.address && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <MapPin size={13} /> {issue.address}
                        </span>
                    )}
                    {issue.ward && <span>Ward: <b>{issue.ward}</b></span>}
                    {issue.zone && <span>Zone: <b>{issue.zone}</b></span>}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={13} /> {fmt(issue.created_at)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <User size={13} /> {issue.reporter?.full_name}
                    </span>
                    {issue.assignee && (
                        <span>Assigned: <b>{issue.assignee.full_name}</b></span>
                    )}
                    {issue.sla_deadline && (
                        <SlaCountdown deadline={issue.sla_deadline} />
                    )}
                </div>

                {/* Tags */}
                {issue.tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                        {issue.tags.map(t => <span key={t.id} className="tag-chip">#{t.name}</span>)}
                    </div>
                )}
            </div>

            {/* Two-column: notes + history */}
            <div className="grid-2">
                {/* Notes */}
                <div className="card">
                    <div className="card-header">
                        <h3 style={{ fontSize: '1rem' }}>💬 Notes ({notes.length})</h3>
                        {isStaffOrAdmin && (
                            <button className="btn btn-outline btn-sm" onClick={() => setNoteModal(true)}>+ Add</button>
                        )}
                    </div>
                    {notes.length === 0 ? (
                        <p className="text-muted text-sm">No notes yet.</p>
                    ) : (
                        notes.map(n => (
                            <div key={n.id} className="note-card">
                                <div className="flex-between mb-1">
                                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{n.author.full_name}</span>
                                    {n.is_internal && <span className="note-internal-badge">Internal</span>}
                                </div>
                                <p style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>{n.content}</p>
                                <p className="text-xs text-muted mt-1">{fmt(n.created_at)}</p>
                            </div>
                        ))
                    )}
                </div>

                {/* History */}
                <div className="card">
                    <div className="card-header">
                        <h3 style={{ fontSize: '1rem' }}>📋 Status History</h3>
                    </div>
                    {history.length === 0 ? (
                        <p className="text-muted text-sm">No history yet.</p>
                    ) : (
                        <div className="timeline">
                            {history.map(h => (
                                <div key={h.id} className="timeline-item">
                                    <div className="timeline-dot" />
                                    <div className="timeline-content">
                                        <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                                            {h.old_status && (
                                                <>
                                                    <StatusBadge status={h.old_status} />
                                                    <span className="text-muted">→</span>
                                                </>
                                            )}
                                            <StatusBadge status={h.new_status} />
                                        </div>
                                        {h.comment && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{h.comment}</p>}
                                        <p className="timeline-time">by {h.changed_by?.full_name} · {fmt(h.changed_at)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Attachments */}
            <div className="card mt-2">
                <div className="card-header">
                    <h3 style={{ fontSize: '1rem' }}>📎 Attachments ({issue.attachments?.length ?? 0})</h3>
                    <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                        {uploading ? <Loader2 size={14} className="spin" /> : <Upload size={14} />}
                        Upload
                        <input type="file" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />
                    </label>
                </div>
                {issue.attachments?.length === 0 ? (
                    <p className="text-muted text-sm">No attachments.</p>
                ) : (
                    issue.attachments?.map(a => (
                        <div key={a.id} className="attachment-item">
                            <Paperclip size={14} />
                            <a href={`/${a.file_path}`} target="_blank" rel="noreferrer">{a.file_name}</a>
                            <span className="text-muted text-xs" style={{ marginLeft: 'auto' }}>{fmt(a.uploaded_at)}</span>
                        </div>
                    ))
                )}
            </div>

            {/* Change Status Modal */}
            {statusModal && (
                <Modal title="Change Status" onClose={() => setStatusModal(false)}
                    footer={
                        <>
                            <button className="btn btn-outline" onClick={() => setStatusModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleStatusChange} disabled={statusLoading}>
                                {statusLoading ? <Loader2 size={14} className="spin" /> : 'Save'}
                            </button>
                        </>
                    }
                >
                    <div className="form-group mb-2">
                        <label className="form-label">New Status</label>
                        <select className="form-control" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Comment (optional)</label>
                        <textarea className="form-control" rows={3} value={statusComment}
                            onChange={e => setStatusComment(e.target.value)} placeholder="Reason for status change…" />
                    </div>
                </Modal>
            )}

            {/* Add Note Modal */}
            {noteModal && (
                <Modal title="Add Note" onClose={() => setNoteModal(false)}
                    footer={
                        <>
                            <button className="btn btn-outline" onClick={() => setNoteModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleAddNote} disabled={noteLoading}>
                                {noteLoading ? <Loader2 size={14} className="spin" /> : 'Add Note'}
                            </button>
                        </>
                    }
                >
                    <div className="form-group mb-2">
                        <label className="form-label">Note Content</label>
                        <textarea className="form-control" rows={4} value={noteContent}
                            onChange={e => setNoteContent(e.target.value)} placeholder="Type your note…" />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                        <input type="checkbox" checked={noteInternal} onChange={e => setNoteInternal(e.target.checked)} />
                        Internal note (not visible to citizens)
                    </label>
                </Modal>
            )}

            <style>{`.spin { animation: spin 0.7s linear infinite; }`}</style>
        </div>
    );
}
