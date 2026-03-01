import { Link } from 'react-router-dom';
import { MapPin, Clock, User } from 'lucide-react';
import { StatusBadge, PriorityBadge, CategoryBadge } from './Badges';

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export default function IssueCard({ issue }) {
    return (
        <Link to={`/issues/${issue.id}`} className="issue-card">
            <div className="issue-card-top">
                <h4 className="issue-card-title">{issue.title}</h4>
                <StatusBadge status={issue.status} />
            </div>

            <div className="issue-card-badges">
                <PriorityBadge priority={issue.priority} />
                <CategoryBadge category={issue.category} />
            </div>

            <div className="issue-card-meta">
                {issue.address && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <MapPin size={12} /> {issue.address}
                    </span>
                )}
                {issue.ward && <span>Ward: {issue.ward}</span>}
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginLeft: 'auto' }}>
                    <Clock size={12} /> {timeAgo(issue.created_at)}
                </span>
                {issue.reporter && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <User size={12} /> {issue.reporter.full_name}
                    </span>
                )}
            </div>
        </Link>
    );
}
