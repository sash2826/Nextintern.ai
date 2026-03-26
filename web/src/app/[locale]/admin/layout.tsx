'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

const NAV_ITEMS = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/users', label: 'User Management', icon: '👤' },
    { href: '/admin/internships', label: 'Internships', icon: '💼' },
    { href: '/admin/fairness', label: 'Fairness', icon: '⚖️' },
    { href: '/admin/audit', label: 'Audit Logs', icon: '📋' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && (!user || !user.roles.includes('ROLE_ADMIN'))) {
            router.replace('/');
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-500">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 pt-16">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 hidden md:block">
                <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-sm text-white">⚙️</span>
                        Admin Panel
                    </h2>
                </div>
                <nav className="px-4 space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname?.includes(item.href);
                        return (
                            <Link key={item.href} href={item.href}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                    }`}>
                                <span>{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Admin info */}
                <div className="absolute bottom-0 left-0 w-64 p-4 border-t border-gray-200 dark:border-gray-800 hidden md:block">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300">
                            {user.fullName?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.fullName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Content */}
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
