'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
    return (
        <div className="stat-card">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-xl`}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white animate-count-up">{value}</p>
                </div>
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getAdminStats()
            .then(data => setStats(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="h-10 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-shimmer" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-shimmer" />)}
                </div>
            </div>
        );
    }

    if (!stats) return (
        <div className="text-center py-16">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-gray-500 dark:text-gray-400">Failed to load admin stats.</p>
        </div>
    );

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{today}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon="👥" label="Total Users" value={stats.totalUsers} color="bg-blue-50 dark:bg-blue-900/30" />
                <StatCard icon="🟢" label="Active Users" value={stats.activeUsers} color="bg-green-50 dark:bg-green-900/30" />
                <StatCard icon="💼" label="Total Internships" value={stats.totalInternships} color="bg-purple-50 dark:bg-purple-900/30" />
                <StatCard icon="📝" label="Total Applications" value={stats.totalApplications} color="bg-orange-50 dark:bg-orange-900/30" />
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Link href="/admin/users" className="flex items-center gap-3 px-5 py-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm transition-all group">
                        <span className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-lg">👤</span>
                        <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">Manage Users</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">View and manage user accounts</p>
                        </div>
                    </Link>
                    <Link href="/admin/fairness" className="flex items-center gap-3 px-5 py-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm transition-all group">
                        <span className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-lg">⚖️</span>
                        <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">Fairness Metrics</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Monitor provider dominance</p>
                        </div>
                    </Link>
                    <Link href="/admin/audit" className="flex items-center gap-3 px-5 py-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm transition-all group">
                        <span className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-lg">📋</span>
                        <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">View Audit Logs</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Review system activity and changes</p>
                        </div>
                    </Link>
                    <Link href="/internships" className="flex items-center gap-3 px-5 py-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm transition-all group">
                        <span className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-lg">💼</span>
                        <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">Browse Internships</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">View all posted internships</p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Platform Overview */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Platform Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Active Rate</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalInternships > 0 ? (stats.totalApplications / stats.totalInternships).toFixed(1) : 0}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg Apps / Internship</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers - stats.activeUsers}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Inactive Users</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">✓</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Platform Health</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
