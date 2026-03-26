'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

export default function ProviderDashboard() {
    const { user, token } = useAuth();
    const [internships, setInternships] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;

        api.getMyInternships(token!).then((res) => {
            setInternships(res.content || []);
        }).finally(() => setLoading(false));
    }, [token]);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="h-10 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg mb-8 animate-shimmer" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                    {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-shimmer" />)}
                </div>
                <div className="space-y-4">
                    {[1, 2].map((i) => <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-shimmer" />)}
                </div>
            </div>
        );
    }

    const totalApplicants = internships.reduce((sum, i) => sum + (i.applicantCount || 0), 0);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Provider Dashboard
                    </h1>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">
                        Manage your internships and applicants
                    </p>
                </div>
                <Link href="/internships/create"
                    className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-primary-500/25 hover:-translate-y-0.5">
                    + Post Internship
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                <div className="stat-card">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-xl">💼</div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Internships</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white animate-count-up">{internships.length}</p>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-xl">👥</div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Applicants</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white animate-count-up">{totalApplicants}</p>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-xl">📊</div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg per Internship</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white animate-count-up">{internships.length > 0 ? Math.round(totalApplicants / internships.length) : 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Internships List */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Internships</h2>
                {internships.length > 0 ? (
                    <div className="grid gap-4">
                        {internships.map((internship) => (
                            <div key={internship.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{internship.title}</h3>
                                            <span className={`badge ${internship.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                                                {internship.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Created: {new Date(internship.createdAt).toLocaleDateString()} • {internship.applicantCount || 0} Applicants
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link href={`/internships/${internship.id}`}
                                            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                            View
                                        </Link>
                                        <Link href={`/internships/${internship.id}/manage`}
                                            className="px-4 py-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors">
                                            Manage →
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                        <div className="text-4xl mb-4">📝</div>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">You haven't posted any internships yet.</p>
                        <Link href="/internships/create" className="text-primary-600 hover:text-primary-700 font-semibold">
                            Post your first internship →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
