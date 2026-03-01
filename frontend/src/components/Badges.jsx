export function StatusBadge({ status }) {
    const cls = `badge badge-${status?.toLowerCase()}`;
    const labels = {
        OPEN: 'Open', IN_PROGRESS: 'In Progress',
        RESOLVED: 'Resolved', CLOSED: 'Closed',
    };
    return <span className={cls}>{labels[status] ?? status}</span>;
}

export function PriorityBadge({ priority }) {
    const cls = `badge badge-${priority?.toLowerCase()}`;
    return <span className={cls}>{priority}</span>;
}

export function CategoryBadge({ category }) {
    const icons = {
        ROAD: '🛣️', WATER: '💧', ELECTRICITY: '⚡', GARBAGE: '🗑️',
        DRAINAGE: '🌊', STREETLIGHT: '💡', PARK: '🌳',
        PUBLIC_TRANSPORT: '🚌', SANITATION: '🧹', NOISE: '📢', OTHER: '📋',
    };
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
            fontSize: '0.78rem', color: 'var(--text-muted)',
        }}>
            {icons[category] ?? '📋'} {category?.replace(/_/g, ' ')}
        </span>
    );
}
