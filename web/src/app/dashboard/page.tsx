'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

export default function DashboardPage() {
    const { user, token, loading: authLoading } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!user || !token) {
            router.push('/login');
            return;
        }

        Promise.all([
            api.getProfile(token).catch(() => null),
            api.getRecommendations(token, 6).catch(() => ({ items: [] })),
        ]).then(([profileData, recsData]) => {
            setProfile(profileData);
            setRecommendations(recsData?.items || []);
        }).finally(() => setLoading(false));
    }, [user, token, authLoading, router]);

    if (authLoading || loading) {
        return (
            <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 pb-12">
                <div className="max-w-7xl mx-auto px-4 animate-pulse">
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-8" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
                        ))}
                    </div>
                </div>
            </main>
        );
    }

    const completeness = profile?.profileCompleteness || 0;

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Welcome Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                        Welcome, {user?.fullName?.split(' ')[0]} 👋
                    </h1>
                    <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">
                        Your personalized internship dashboard
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Profile Completion</span>
                            <span className="text-2xl">📊</span>
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-gray-900 dark:text-white">{completeness}%</span>
                        </div>
                        <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all duration-500 ${completeness >= 80 ? 'bg-green-500' : completeness >= 40 ? 'bg-amber-500' : 'bg-red-500'
                                    }`}
                                style={{ width: `${completeness}%` }}
                            />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Skills Added</span>
                            <span className="text-2xl">🎯</span>
                        </div>
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                            {profile?.skills?.length || 0}
                        </span>
                        <p className="mt-1 text-sm text-gray-400">
                            {(profile?.skills?.length || 0) < 3 ? 'Add more skills for better matches!' : 'Great skill set!'}
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl p-6 text-white">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-primary-100">AI Recommendations</span>
                            <span className="text-2xl">✨</span>
                        </div>
                        <span className="text-3xl font-bold">{recommendations.length}</span>
                        <p className="mt-1 text-sm text-primary-100">Internships matched for you</p>
                    </div>
                </div>

                {/* Recommendations Section */}
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recommended For You</h2>
                        <Link href="/internships" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                            View all →
                        </Link>
                    </div>

                    {recommendations.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recommendations.map((rec, i) => (
                                <Link key={rec.internship_id} href={`/internships/${rec.internship_id}`}>
                                    <div className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-primary-500 to-accent-500 text-white">
                                                #{i + 1} Match
                                            </span>
                                            <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                                                {Math.round(rec.score * 100)}% fit
                                            </span>
                                        </div>

                                        {/* Explanation */}
                                        {rec.explanation && (
                                            <div className="mt-3 p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800">
                                                <p className="text-xs font-medium text-primary-800 dark:text-primary-200 mb-1">Why this match?</p>
                                                <p className="text-xs text-primary-600 dark:text-primary-300">
                                                    {rec.explanation.reason || 'Based on your skill profile'}
                                                </p>
                                                {rec.explanation.matchedSkills?.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {rec.explanation.matchedSkills.map((skill: string) => (
                                                            <span key={skill} className="px-2 py-0.5 rounded text-xs bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300">
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="mt-4 text-xs text-gray-400 flex items-center gap-1">
                                            <span>View details →</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                            <span className="text-4xl mb-4 block">🔍</span>
                            <p className="text-lg text-gray-500 dark:text-gray-400">No recommendations yet</p>
                            <p className="text-sm text-gray-400 mt-1">Complete your profile to get personalized matches</p>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link href="/internships" className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-all flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                            🔍
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Browse Internships</h3>
                            <p className="text-sm text-gray-500">Explore all available opportunities</p>
                        </div>
                    </Link>
                    <div className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-all flex items-center gap-4 cursor-pointer">
                        <div className="w-12 h-12 rounded-xl bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                            ✏️
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Edit Profile</h3>
                            <p className="text-sm text-gray-500">Update skills & preferences</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
