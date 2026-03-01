export default function Pagination({ page, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    const pages = [];
    const radius = 2;
    for (let i = 1; i <= totalPages; i++) {
        if (
            i === 1 || i === totalPages ||
            (i >= page - radius && i <= page + radius)
        ) {
            pages.push(i);
        }
    }

    // Insert ellipsis markers
    const items = [];
    let prev = 0;
    for (const p of pages) {
        if (p - prev > 1) items.push('…');
        items.push(p);
        prev = p;
    }

    return (
        <div className="pagination">
            <button
                className="page-btn"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
            >
                ‹
            </button>

            {items.map((item, idx) =>
                item === '…' ? (
                    <span key={`e${idx}`} style={{ color: 'var(--text-muted)', padding: '0 0.25rem' }}>…</span>
                ) : (
                    <button
                        key={item}
                        className={`page-btn${item === page ? ' active' : ''}`}
                        onClick={() => onPageChange(item)}
                    >
                        {item}
                    </button>
                )
            )}

            <button
                className="page-btn"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
            >
                ›
            </button>
        </div>
    );
}
