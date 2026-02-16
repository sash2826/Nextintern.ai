'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

export default function StudentDashboard() {
    const { user, token } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;

        Promise.all([
            api.getProfile(token).catch(() => null),
            api.getRecommendations(token, 6).catch(() => ({ items: [] })),
            api.getMyApplications().catch(() => ({ content: [] })),
        ]).then(([profileData, recsData, appsData]) => {
            setProfile(profileData);
            setRecommendations(recsData?.items || []);
            setApplications(appsData?.content || []);
        }).finally(() => setLoading(false));
    }, [token]);

    const completeness = profile?.profileCompleteness || 0;

    if (loading) return <div className="p-10 text-center">Loading dashboard...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Welcome Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                    Welcome, {user?.fullName?.split(' ')[0]} 👋
                </h1>
                <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">
                    Student Dashboard
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                    <span className="text-sm font-medium text-gray-500">Profile Completion</span>
                    <div className="flex items-end gap-2 mt-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{completeness}%</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                    <span className="text-sm font-medium text-gray-500">Applications</span>
                    <div className="mt-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{applications.length}</span>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl p-6 text-white">
                    <span className="text-sm font-medium text-primary-100">AI Recommendations</span>
                    <div className="mt-2">
                        <span className="text-3xl font-bold">{recommendations.length}</span>
                    </div>
                </div>
            </div>

            {/* My Applications Section */}
            <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Applications</h2>
                {applications.length > 0 ? (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-3">Internship</th>
                                    <th className="px-6 py-3">Company</th>
                                    <th className="px-6 py-3">Applied On</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                {applications.map((app) => (
                                    <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            <Link href={`/internships/${app.internship.id}`} className="hover:underline">
                                                {app.internship.title}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{app.internship.companyName}</td>
                                        <td className="px-6 py-4 text-gray-500">{new Date(app.appliedAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize
                                                ${app.status === 'accepted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    app.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                        app.status === 'shortlisted' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                }`}>
                                                {app.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                        <p className="text-gray-500">You haven't applied to any internships yet.</p>
                        <Link href="/internships" className="text-primary-600 font-medium mt-2 inline-block">Browse Internships →</Link>
                    </div>
                )}
            </div>

            {/* Recommendations Section */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recommended For You</h2>
                </div>
                {/* ... (reusing recommendation cards logic or simplified) ... */}
                {recommendations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recommendations.map((rec, i) => (
                            <Link key={rec.internship_id} href={`/internships/${rec.internship_id}`}>
                                <div className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-xl transition-all h-full">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-sm font-semibold text-primary-600">
                                            {Math.round(rec.score * 100)}% fit
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-lg mb-1">{rec.explanation?.reason || 'Matched Internship'}</h3>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No recommendations yet.</p>
                )}
            </div>
        </div>
    );
}
