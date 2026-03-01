import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { admin } from '../../api/api';
import { AlertTriangle, CheckCircle2, Clock, FileText, AlertOctagon, Layers } from 'lucide-react';

const STATUS_COLORS = {
    OPEN: '#38bdf8', IN_PROGRESS: '#a78bfa', RESOLVED: '#22c55e', CLOSED: '#6b7280'
};
const CAT_COLORS = ['#4f8ef7', '#22c55e', '#f59e0b', '#ef4444', '#a78bfa', '#f97316', '#38bdf8', '#84cc16', '#ec4899', '#06b6d4', '#8b5cf6'];

function StatCard({ icon: Icon, label, value, color }) {
    return (
        <div className="stat-card">
            <div className="stat-icon" style={{ background: `${color}22` }}>
                <Icon size={22} color={color} />
            </div>
            <div>
                <div className="stat-value">{value ?? '—'}</div>
                <div className="stat-label">{label}</div>
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        admin.stats()
            .then(r => setStats(r.data))
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;
    if (error) return <div className="alert alert-error">{error}</div>;

    // Build chart data
    const statusData = stats?.by_status
        ? Object.entries(stats.by_status).map(([name, value]) => ({ name: name.replace('_', ' '), value }))
        : [];

    const categoryData = stats?.by_category
        ? Object.entries(stats.by_category).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))
        : [];

    return (
        <div className="fade-in">
            <div className="page-header">
                <h2>Admin Dashboard</h2>
                <p>Platform-wide statistics and health metrics</p>
            </div>

            {/* Stat cards */}
            <div className="grid-4 mb-3">
                <StatCard icon={Layers} label="Total Issues" value={stats?.total_issues} color="#4f8ef7" />
                <StatCard icon={AlertOctagon} label="Open Issues" value={stats?.open_issues} color="#38bdf8" />
                <StatCard icon={Clock} label="In Progress" value={stats?.in_progress} color="#a78bfa" />
                <StatCard icon={CheckCircle2} label="Resolved" value={stats?.resolved} color="#22c55e" />
                <StatCard icon={AlertTriangle} label="Overdue" value={stats?.overdue} color="#ef4444" />
                <StatCard icon={FileText} label="Total Users" value={stats?.total_users} color="#f59e0b" />
            </div>

            {/* Charts */}
            <div className="grid-2 mb-3">
                {/* Issues by status (pie) */}
                <div className="card">
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Issues by Status</h3>
                    {statusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                    {statusData.map((entry, i) => (
                                        <Cell key={i} fill={STATUS_COLORS[entry.name.replace(' ', '_').toUpperCase()] ?? '#8b949e'} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <p className="text-muted">No data</p>}
                </div>

                {/* Issues by category (bar) */}
                <div className="card">
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Issues by Category</h3>
                    {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={categoryData} margin={{ top: 0, right: 0, bottom: 40, left: 0 }}>
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} angle={-40} textAnchor="end" />
                                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                                <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {categoryData.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <p className="text-muted">No data</p>}
                </div>
            </div>

            {/* SLA info */}
            {stats?.sla_compliance_rate != null && (
                <div className="card">
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>SLA Compliance</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-h)',
                            color: stats.sla_compliance_rate > 80 ? 'var(--success)' : stats.sla_compliance_rate > 50 ? 'var(--warning)' : 'var(--danger)',
                        }}>
                            {stats.sla_compliance_rate?.toFixed(1)}%
                        </div>
                        <p className="text-muted text-sm">of issues resolved within SLA deadlines</p>
                    </div>
                </div>
            )}
        </div>
    );
}
