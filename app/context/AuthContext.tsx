'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { PlatformUser, AuthService } from '../services';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
    user: PlatformUser | null;
    login: (user: PlatformUser) => void;
    logout: () => void;
    updateUser: (updates: Partial<PlatformUser>) => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<PlatformUser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Check localStorage for persisted session (simple implementation for MVP)
        const storedUser = localStorage.getItem('logitrack_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (!loading) {
            if (!user && pathname !== '/login') {
                router.push('/login');
            } else if (user && pathname === '/login') {
                router.push('/');
            }
        }
    }, [user, loading, pathname, router]);

    const login = (userData: PlatformUser) => {
        setUser(userData);
        localStorage.setItem('logitrack_user', JSON.stringify(userData));
        router.push('/');
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('logitrack_user');
        router.push('/login');
    };

    const updateUser = (updates: Partial<PlatformUser>) => {
        if (!user) return;
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem('logitrack_user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
