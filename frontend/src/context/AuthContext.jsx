import { createContext, useContext, useState, useEffect } from 'react';
import { users as usersApi, saveTokens, clearTokens } from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
    });
    const [loading, setLoading] = useState(false);

    // Reload user profile from API on mount if token exists
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token && !user) {
            usersApi.me()
                .then((res) => {
                    const u = res.data;
                    setUser(u);
                    localStorage.setItem('user', JSON.stringify(u));
                })
                .catch(() => clearTokens());
        }
    }, []);

    async function login(accessToken, refreshToken) {
        saveTokens(accessToken, refreshToken);
        setLoading(true);
        try {
            const res = await usersApi.me();
            const u = res.data;
            setUser(u);
            localStorage.setItem('user', JSON.stringify(u));
            return u;
        } finally {
            setLoading(false);
        }
    }

    function logout() {
        clearTokens();
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
