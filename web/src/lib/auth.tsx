'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
    id: string;
    email: string;
    fullName: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName: string, role: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Try to refresh on mount
    useEffect(() => {
        api.refresh()
            .then(res => {
                setToken(res.accessToken);
                // Map backend response if needed, assuming backend sends `role` string
                // If backend sends `role` and User interface expects `role`, it matches.
                setUser(res.user);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const login = async (email: string, password: string) => {
        const res = await api.login({ email, password });
        setToken(res.accessToken);
        setUser(res.user);
    };

    const register = async (email: string, password: string, fullName: string, role: string) => {
        const res = await api.register({ email, password, fullName, role });
        setToken(res.accessToken);
        setUser(res.user);
    };

    const logout = async () => {
        if (token) {
            await api.logout(token).catch(() => { });
        }
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
