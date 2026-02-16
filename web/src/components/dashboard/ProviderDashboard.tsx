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

        api.getMyInternships().then((res) => {
            setInternships(res.content || []);
        }).finally(() => setLoading(false));
    }, [token]);

    if (loading) return <div className="p-10 text-center">Loading dashboard...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                        Provider Dashboard
                    </h1>
                    <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">
                        Manage your internships and applicants
                    </p>
                </div>
                <Link href="/internships/create"
                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-primary-500/25">
                    + Post Internship
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                    <span className="text-sm font-medium text-gray-500">Active Internships</span>
                    <div className="mt-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{internships.length}</span>
                    </div>
                </div>
            </div>

            {/* Internships List */}
            <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Internships</h2>
                {internships.length > 0 ? (
                    <div className="grid gap-6">
                        {internships.map((internship) => (
                            <div key={internship.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{internship.title}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${internship.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {internship.status}
                                        </span>
                                    </div>
                                    <p className="text-gray-500 text-sm">
                                        Created: {new Date(internship.createdAt).toLocaleDateString()} • {internship.applicantCount} Applicants
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Link href={`/internships/${internship.id}`} className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white">
                                        View
                                    </Link>
                                    <Link href={`/internships/${internship.id}/manage`}
                                        className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                        Manage Applications
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                        <p className="text-gray-500 mb-4">You haven't posted any internships yet.</p>
                        <Link href="/internships/create" className="text-primary-600 font-medium hover:underline">
                            Post your first internship →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
