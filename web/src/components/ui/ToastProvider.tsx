'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
    leaving: boolean;
}

interface ToastContextType {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast(): ToastContextType {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}

const ICONS: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
};

const COLORS: Record<ToastType, { bg: string; border: string; icon: string; text: string }> = {
    success: {
        bg: 'bg-white dark:bg-gray-900',
        border: 'border-green-200 dark:border-green-800',
        icon: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400',
        text: 'text-gray-900 dark:text-white',
    },
    error: {
        bg: 'bg-white dark:bg-gray-900',
        border: 'border-red-200 dark:border-red-800',
        icon: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
        text: 'text-gray-900 dark:text-white',
    },
    info: {
        bg: 'bg-white dark:bg-gray-900',
        border: 'border-blue-200 dark:border-blue-800',
        icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
        text: 'text-gray-900 dark:text-white',
    },
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 300);
    }, []);

    const addToast = useCallback(
        (message: string, type: ToastType) => {
            const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            setToasts((prev) => [...prev, { id, message, type, leaving: false }]);
            setTimeout(() => removeToast(id), 4000);
        },
        [removeToast]
    );

    const toast: ToastContextType = {
        success: useCallback((msg: string) => addToast(msg, 'success'), [addToast]),
        error: useCallback((msg: string) => addToast(msg, 'error'), [addToast]),
        info: useCallback((msg: string) => addToast(msg, 'info'), [addToast]),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}

            {/* Toast container — fixed top-right */}
            <div
                className="fixed top-20 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"
                aria-live="polite"
                aria-atomic="true"
            >
                {toasts.map((t) => {
                    const c = COLORS[t.type];
                    return (
                        <div
                            key={t.id}
                            role="alert"
                            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${c.bg} ${c.border} min-w-[280px] max-w-[400px] ${t.leaving ? 'animate-toast-out' : 'animate-toast-in'}`}
                        >
                            <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${c.icon}`}>
                                {ICONS[t.type]}
                            </span>
                            <p className={`text-sm font-medium flex-1 ${c.text}`}>{t.message}</p>
                            <button
                                onClick={() => removeToast(t.id)}
                                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                aria-label="Dismiss"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}
