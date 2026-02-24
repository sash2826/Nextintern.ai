'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import EditProfileModal from './EditProfileModal';

/* ── Progress Ring SVG ───────────────────────────────────── */
function ProgressRing({ percent, size = 80, stroke = 6 }: { percent: number; size?: number; stroke?: number }) {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke}
                className="text-gray-200 dark:text-gray-700" />
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} strokeLinecap="round"
                stroke="url(#ring-gradient)"
                strokeDasharray={circumference} strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            <defs>
                <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
            </defs>
        </svg>
    );
}

/* ── Stat Card ───────────────────────────────────────────── */
function StatCard({ icon, label, value, gradient }: { icon: string; label: string; value: number | string; gradient: string }) {
    return (
        <div className="stat-card group">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center text-xl shadow-sm`}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white animate-count-up">{value}</p>
                </div>
            </div>
        </div>
    );
}

/* ── Status Badge ────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        applied: 'badge-info',
        pending: 'badge-info',
        shortlisted: 'badge-warning',
        accepted: 'badge-success',
        hired: 'badge-success',
        rejected: 'badge-error',
    };
    return <span className={`badge ${map[status?.toLowerCase()] || 'badge-neutral'}`}>{status}</span>;
}

/* ── Main Dashboard ──────────────────────────────────────── */
export default function StudentDashboard() {
    const { user, token } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const fetchData = useCallback(() => {
        setLoading(true);
        Promise.all([
            api.getProfile(token!).catch(() => null),
            api.getRecommendations(token!, 6).catch(() => ({ items: [] })),
            api.getMyApplications().catch(() => ({ content: [] })),
        ]).then(([profileData, recsData, appsData]) => {
            setProfile(profileData);
            setRecommendations(recsData?.items || []);
            setApplications(appsData?.content || []);
        }).finally(() => setLoading(false));
    }, [token]);

    useEffect(() => {
        if (!token) return;
        fetchData();
    }, [token, fetchData]);

    const completeness = profile?.profileCompleteness || 0;

    if (loading && !profile) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="h-36 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 rounded-2xl mb-8 animate-shimmer" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                    {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-shimmer" />)}
                </div>
                <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-shimmer" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

            {/* ── Welcome Banner ────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 via-primary-700 to-accent-600 p-8 mb-8 shadow-xl">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-bold text-white border border-white/20 shadow-lg">
                            {user?.fullName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white">
                                Welcome back, {user?.fullName?.split(' ')[0]} 👋
                            </h1>
                            <p className="text-primary-100 mt-1">
                                {completeness >= 80 ? 'Your profile is looking great!' : 'Complete your profile to get better matches'}
                            </p>
                        </div>
                    </div>

                    {/* Progress Ring */}
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <ProgressRing percent={completeness} size={72} stroke={5} />
                            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                                {completeness}%
                            </span>
                        </div>
                        <button
                            onClick={() => setIsEditOpen(true)}
                            className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-sm font-semibold rounded-xl border border-white/20 transition-all"
                        >
                            Edit Profile
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Content Grid ──────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* Main Content — 3 cols */}
                <div className="lg:col-span-3 space-y-8">

                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <StatCard icon="📋" label="Applications" value={applications.length} gradient="bg-blue-50 dark:bg-blue-900/30" />
                        <StatCard icon="⭐" label="Recommendations" value={recommendations.length} gradient="bg-amber-50 dark:bg-amber-900/30" />
                        <StatCard icon="🏅" label="Profile Score" value={`${completeness}%`} gradient="bg-green-50 dark:bg-green-900/30" />
                    </div>

                    {/* My Applications */}
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">My Applications</h2>
                        {applications.length > 0 ? (
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Internship</th>
                                                <th>Company</th>
                                                <th>Applied</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {applications.map((app) => (
                                                <tr key={app.id}>
                                                    <td className="font-medium text-gray-900 dark:text-white">
                                                        <Link href={`/internships/${app.internship.id}`} className="hover:text-primary-600 transition-colors">
                                                            {app.internship.title}
                                                        </Link>
                                                    </td>
                                                    <td className="text-gray-500 dark:text-gray-400">{app.internship.companyName}</td>
                                                    <td className="text-gray-500 dark:text-gray-400">{new Date(app.appliedAt).toLocaleDateString()}</td>
                                                    <td><StatusBadge status={app.status} /></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                                <div className="text-4xl mb-3">📭</div>
                                <p className="text-gray-500 dark:text-gray-400 mb-3">You haven't applied to any internships yet.</p>
                                <Link href="/internships" className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-semibold text-sm transition-colors">
                                    Browse Internships
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </Link>
                            </div>
                        )}
                    </section>

                    {/* AI Recommendations */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recommended For You</h2>
                            {recommendations.length > 0 && (
                                <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">AI-Powered</span>
                            )}
                        </div>
                        {recommendations.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {recommendations.map((rec) => (
                                    <Link key={rec.internship_id} href={`/internships/${rec.internship_id}`}>
                                        <div className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all h-full">
                                            {/* Match score */}
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="badge badge-success text-xs">
                                                    {Math.round(rec.score * 100)}% match
                                                </span>
                                                <div className="relative w-10 h-10">
                                                    <ProgressRing percent={Math.round(rec.score * 100)} size={40} stroke={3} />
                                                </div>
                                            </div>

                                            <h3 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 transition-colors line-clamp-2">
                                                {rec.explanation?.reason || 'Matched Internship'}
                                            </h3>

                                            {/* Skills pills */}
                                            {rec.explanation?.skills && (
                                                <div className="flex flex-wrap gap-1.5 mt-3">
                                                    {rec.explanation.skills.slice(0, 3).map((skill: string, i: number) => (
                                                        <span key={i} className="px-2 py-0.5 rounded-md text-xs font-medium bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="mt-4 text-sm text-primary-600 dark:text-primary-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                View details →
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                                <div className="text-4xl mb-3">🤖</div>
                                <p className="text-gray-500 dark:text-gray-400 mb-3">Complete your profile to unlock AI recommendations.</p>
                                <button onClick={() => setIsEditOpen(true)} className="text-primary-600 hover:text-primary-700 font-semibold text-sm">
                                    Update Profile →
                                </button>
                            </div>
                        )}
                    </section>
                </div>

                {/* ── Quick Actions Sidebar ─────────────────────── */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Quick Actions</h3>

                    <Link href="/internships" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm transition-all group">
                        <span className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-lg">🔍</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600 transition-colors">Browse Internships</span>
                    </Link>

                    <button onClick={() => setIsEditOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm transition-all group text-left">
                        <span className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-lg">✏️</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600 transition-colors">Edit Profile</span>
                    </button>

                    <Link href="/internships" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm transition-all group">
                        <span className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-lg">💾</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600 transition-colors">Saved Internships</span>
                    </Link>

                    {/* Profile completeness breakdown */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mt-6">
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Profile Health</p>
                        <div className="progress-bar">
                            <div className="progress-bar-fill" style={{ width: `${completeness}%` }} />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {completeness < 50 ? 'Add skills and education to improve.' : completeness < 80 ? 'Almost there! Add a resume.' : 'Great profile!'}
                        </p>
                    </div>
                </div>
            </div>

            <EditProfileModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                profile={profile}
                onSuccess={() => { fetchData(); }}
            />
        </div>
    );
}
