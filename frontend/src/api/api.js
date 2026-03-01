const API_BASE = '/api/v1';

function getToken() {
    return localStorage.getItem('access_token');
}
function getRefreshToken() {
    return localStorage.getItem('refresh_token');
}
function saveTokens(access, refresh) {
    localStorage.setItem('access_token', access);
    if (refresh) localStorage.setItem('refresh_token', refresh);
}
function clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
}

async function tryRefresh() {
    const refresh = getRefreshToken();
    if (!refresh) return false;
    try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refresh }),
        });
        if (!res.ok) return false;
        const json = await res.json();
        saveTokens(json.data.access_token, json.data.refresh_token);
        return true;
    } catch {
        return false;
    }
}

async function request(method, path, body = null, options = {}) {
    const headers = {
        ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
    };

    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const fetchOptions = {
        method,
        headers,
        body: body
            ? body instanceof FormData
                ? body
                : JSON.stringify(body)
            : undefined,
    };

    let res = await fetch(`${API_BASE}${path}`, fetchOptions);

    // Auto-refresh on 401
    if (res.status === 401 && !options._retry) {
        const refreshed = await tryRefresh();
        if (refreshed) {
            const newToken = getToken();
            headers['Authorization'] = `Bearer ${newToken}`;
            res = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers, _retry: true });
        } else {
            clearTokens();
            window.location.href = '/login';
            return;
        }
    }

    // Safely parse JSON — some responses have an empty body (e.g. 204 No Content)
    let json = null;
    const contentType = res.headers.get('Content-Type') || '';
    if (contentType.includes('application/json')) {
        const text = await res.text();
        if (text) {
            try {
                json = JSON.parse(text);
            } catch {
                // Non-JSON body — leave json as null
            }
        }
    }

    if (!res.ok) {
        const msg = json?.message || json?.detail || json?.data?.message || `Error ${res.status}`;
        const errorMsg = typeof msg === 'string' ? msg : JSON.stringify(msg);
        throw new Error(errorMsg || 'Internal server error');
    }
    return json;
}

// ── Auth ──────────────────────────────────────────────────
export const auth = {
    register: (data) => request('POST', '/auth/register', data),
    login: (data) => request('POST', '/auth/login', data),
    refresh: (data) => request('POST', '/auth/refresh', data),
};

// ── Users ─────────────────────────────────────────────────
export const users = {
    me: () => request('GET', '/users/me'),
    updateMe: (data) => request('PUT', '/users/me', data),
    list: (params = {}) => request('GET', `/users/?${new URLSearchParams(params)}`),
    get: (id) => request('GET', `/users/${id}`),
    updateRole: (id, data) => request('PUT', `/users/${id}/role`, data),
    deactivate: (id) => request('DELETE', `/users/${id}/deactivate`),
};

// ── Issues ────────────────────────────────────────────────
export const issues = {
    list: (params = {}) => {
        const q = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
            if (v !== null && v !== undefined && v !== '') q.set(k, v);
        });
        return request('GET', `/issues/?${q}`);
    },
    create: (data) => request('POST', '/issues/', data),
    get: (id) => request('GET', `/issues/${id}`),
    update: (id, data) => request('PUT', `/issues/${id}`, data),
    delete: (id) => request('DELETE', `/issues/${id}`),
    nearby: (lat, lng, radius = 1.0) =>
        request('GET', `/issues/nearby?latitude=${lat}&longitude=${lng}&radius_km=${radius}`),
    changeStatus: (id, data) => request('POST', `/issues/${id}/status`, data),
    history: (id) => request('GET', `/issues/${id}/history`),
    addNote: (id, data) => request('POST', `/issues/${id}/notes`, data),
    notes: (id) => request('GET', `/issues/${id}/notes`),
    uploadAttachment: (id, file) => {
        const fd = new FormData();
        fd.append('file', file);
        return request('POST', `/issues/${id}/attachments`, fd);
    },
    attachments: (id) => request('GET', `/issues/${id}/attachments`),
};

// ── Departments ───────────────────────────────────────────
export const departments = {
    list: () => request('GET', '/departments/'),
    create: (data) => request('POST', '/departments/', data),
    update: (id, data) => request('PUT', `/departments/${id}`, data),
    delete: (id) => request('DELETE', `/departments/${id}`),
};

// ── Admin ─────────────────────────────────────────────────
export const admin = {
    stats: () => request('GET', '/admin/stats'),
    reports: (params = {}) => request('GET', `/admin/reports?${new URLSearchParams(params)}`),
    overdue: (params = {}) => request('GET', `/admin/overdue?${new URLSearchParams(params)}`),
    auditLogs: (params = {}) => request('GET', `/admin/audit-logs?${new URLSearchParams(params)}`),
};

export { saveTokens, clearTokens };
