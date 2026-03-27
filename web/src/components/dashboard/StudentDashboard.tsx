'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import EditProfileModal from './EditProfileModal';
import ExplainabilityModal from './ExplainabilityModal';

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

/* ── Status Badge ────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        applied: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        pending: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        shortlisted: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        accepted: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        hired: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        rejected: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
    };
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border ${colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            {status?.charAt(0).toUpperCase() + status?.slice(1)}
        </span>
    );
}

/* ── Main Dashboard ──────────────────────────────────────── */
export default function StudentDashboard() {
    const { user, token } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedRec, setSelectedRec] = useState<any>(null);
    const [isExplainOpen, setExplainOpen] = useState(false);

    const fetchData = useCallback(() => {
        setLoading(true);
        Promise.all([
            api.getProfile(token!).catch(() => null),
            api.getRecommendations(token!, 6).catch(() => ({ items: [] })),
            api.getMyApplications(token!).catch(() => ({ content: [] })),
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
    const skills = profile?.skills || [];

    const handleExplanationClick = (e: React.MouseEvent, rec: any) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedRec({
            internship: { id: rec.internship_id, title: rec.title || 'Recommended Internship', provider: { companyName: rec.company || 'Company' } },
            explanation: rec.explanation || {},
            score: rec.score
        });
        setExplainOpen(true);
    };

    if (loading && !profile) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-10">
                <div className="h-44 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 rounded-3xl mb-8 animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-10">
                    {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
                </div>
                <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

            {/* ── Hero Welcome Section ────────────────────────────── */}
            <div className="relative pt-24 pb-20 overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4338ca 60%, #0891b2 100%)' }}>
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 3px 3px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/15 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl font-black text-white border border-white/20 shadow-2xl">
                                {user?.fullName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                                    Welcome back, {user?.fullName?.split(' ')[0]} 👋
                                </h1>
                                <p className="text-white/60 mt-1 text-lg">
                                    {completeness >= 80 ? 'Your profile is looking great! Keep exploring.' : 'Complete your profile to unlock AI-powered recommendations.'}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {skills.slice(0, 4).map((s: any) => (
                                        <span key={s.name} className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-white/80 backdrop-blur-sm">
                                            {s.name}
                                        </span>
                                    ))}
                                    {skills.length > 4 && (
                                        <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-white/80">
                                            +{skills.length - 4} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-5">
                            <div className="relative">
                                <ProgressRing percent={completeness} size={80} stroke={5} />
                                <span className="absolute inset-0 flex items-center justify-center text-lg font-black text-white">
                                    {completeness}%
                                </span>
                            </div>
                            <button
                                onClick={() => setIsEditOpen(true)}
                                className="px-6 py-3 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-bold rounded-xl border border-white/20 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                            >
                                ✏️ Edit Profile
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Stats Cards (floating above hero) ───────────────── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20 mb-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { icon: '📋', label: 'Applications', value: applications.length, color: 'from-blue-500 to-indigo-600' },
                        { icon: '⭐', label: 'AI Recommendations', value: recommendations.length, color: 'from-amber-500 to-orange-600' },
                        { icon: '🏅', label: 'Profile Score', value: `${completeness}%`, color: 'from-emerald-500 to-teal-600' },
                        { icon: '💡', label: 'Skills', value: skills.length, color: 'from-purple-500 to-pink-600' },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="flex items-center gap-3">
                                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-lg shadow-md`}>
                                    {stat.icon}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</p>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Main Content ────────────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* Left: 3 cols — Applications + Recommendations */}
                    <div className="lg:col-span-3 space-y-8">

                        {/* My Applications */}
                        <section>
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-sm">📋</span>
                                    My Applications
                                </h2>
                                {applications.length > 0 && (
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{applications.length} total</span>
                                )}
                            </div>
                            {applications.length > 0 ? (
                                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-50 dark:bg-gray-800/50">
                                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Internship</th>
                                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Company</th>
                                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Applied</th>
                                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                {applications.map((app) => (
                                                    <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                                                            <Link href={`/internships/${app.internship.id}`} className="hover:text-primary-600 transition-colors">
                                                                {app.internship.title}
                                                            </Link>
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{app.internship.companyName}</td>
                                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{new Date(app.appliedAt).toLocaleDateString()}</td>
                                                        <td className="px-6 py-4"><StatusBadge status={app.status} /></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                                    <div className="text-5xl mb-4">📭</div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No applications yet</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">Start exploring internships and submit your first application!</p>
                                    <Link href="/internships" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
                                        Browse Internships
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </Link>
                                </div>
                            )}
                        </section>

                        {/* AI Recommendations */}
                        <section>
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-sm">✨</span>
                                    AI Recommendations
                                </h2>
                                {recommendations.length > 0 && (
                                    <span className="text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-3 py-1 rounded-full">
                                        AI-Powered
                                    </span>
                                )}
                            </div>
                            {recommendations.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {recommendations.map((rec) => (
                                        <Link key={rec.internship_id} href={`/internships/${rec.internship_id}`} className="block h-full group">
                                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-500 hover:-translate-y-1 h-full flex flex-col relative">
                                                {/* Gradient top accent */}
                                                <div className="h-1.5 bg-gradient-to-r from-primary-500 via-accent-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                                <div className="p-5 flex flex-col flex-1">
                                                    {/* Score badge */}
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                            🤖 {Math.round(rec.score * 100)}% match
                                                        </span>
                                                        <div className="relative w-10 h-10">
                                                            <ProgressRing percent={Math.round(rec.score * 100)} size={40} stroke={3} />
                                                        </div>
                                                    </div>

                                                    <h3 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 transition-colors line-clamp-2 leading-snug">
                                                        {rec.title || 'Recommended Internship'}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium">
                                                        {rec.company || 'Company'} · {rec.location || 'Remote'} · {rec.category}
                                                    </p>

                                                    {/* Stipend */}
                                                    {rec.stipendMin && (
                                                        <p className="text-sm font-black text-gray-900 dark:text-white mb-3">
                                                            ₹{(rec.stipendMin / 1000).toFixed(0)}k
                                                            {rec.stipendMax ? ` – ₹${(rec.stipendMax / 1000).toFixed(0)}k` : ''}
                                                            <span className="text-gray-400 font-normal text-xs"> /mo</span>
                                                        </p>
                                                    )}

                                                    {/* Skills pills */}
                                                    {rec.explanation?.matchedSkills && rec.explanation.matchedSkills.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                                            {rec.explanation.matchedSkills.slice(0, 3).map((skill: string, i: number) => (
                                                                <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300">
                                                                    ✓ {skill}
                                                                </span>
                                                            ))}
                                                            {rec.explanation.missingSkills?.slice(0, 1).map((skill: string, i: number) => (
                                                                <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300">
                                                                    ✗ {skill}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
                                                        <span className="text-xs font-bold text-primary-600 dark:text-primary-400 group-hover:underline">
                                                            View details →
                                                        </span>
                                                        <button
                                                            onClick={(e) => handleExplanationClick(e, rec)}
                                                            className="px-3 py-1.5 text-[10px] font-bold text-gray-600 bg-gray-100 hover:bg-primary-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-primary-900/20 rounded-lg transition-colors z-10 relative hover:text-primary-600 dark:hover:text-primary-400"
                                                        >
                                                            ✨ Why?
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                                    <div className="text-5xl mb-4">🤖</div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No recommendations yet</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                                        {skills.length < 3
                                            ? "Add at least 3 skills to unlock AI recommendations!"
                                            : "Complete your profile to get personalized matches."}
                                    </p>
                                    <button onClick={() => setIsEditOpen(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
                                        Update Profile →
                                    </button>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* ── Right Sidebar ──────────────────────────────── */}
                    <div className="lg:col-span-1 space-y-5">

                        {/* Quick Actions */}
                        <div>
                            <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Quick Actions</h3>
                            <div className="space-y-2">
                                <Link href="/internships" className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all group">
                                    <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm shadow-md">🔍</span>
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-primary-600 transition-colors">Browse Internships</span>
                                </Link>
                                <button onClick={() => setIsEditOpen(true)} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all group text-left">
                                    <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-sm shadow-md">✏️</span>
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-primary-600 transition-colors">Edit Profile</span>
                                </button>
                                <Link href="/internships" className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all group">
                                    <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm shadow-md">💾</span>
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-primary-600 transition-colors">Saved Internships</span>
                                </Link>
                            </div>
                        </div>

                        {/* Profile Health */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
                            <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Profile Health</h3>
                            <div className="relative mb-3">
                                <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-1000" style={{ width: `${completeness}%` }} />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                                {completeness < 50 ? 'Add skills and education to improve.' : completeness < 80 ? 'Almost there! Upload a resume.' : '🎉 Great profile!'}
                            </p>

                            {/* Checklist */}
                            <div className="space-y-2">
                                {[
                                    { label: 'Basic Info', done: !!profile?.fullName },
                                    { label: 'Skills (3+)', done: skills.length >= 3 },
                                    { label: 'Education', done: !!profile?.university && profile.university !== 'Not specified' },
                                    { label: 'Resume / CV', done: !!profile?.hasCv },
                                    { label: 'Interests', done: (profile?.interests || []).length > 0 },
                                ].map(item => (
                                    <div key={item.label} className="flex items-center gap-2">
                                        <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs ${item.done ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                                            {item.done ? '✓' : '○'}
                                        </div>
                                        <span className={`text-xs font-medium ${item.done ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                                            {item.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Your Skills */}
                        {skills.length > 0 && (
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
                                <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Your Skills</h3>
                                <div className="flex flex-wrap gap-1.5">
                                    {skills.map((s: any) => (
                                        <span key={s.name} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border border-primary-100 dark:border-primary-900/30">
                                            {s.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Interests */}
                        {profile?.interests?.length > 0 && (
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
                                <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Interests</h3>
                                <div className="flex flex-wrap gap-1.5">
                                    {profile.interests.map((interest: string) => (
                                        <span key={interest} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">
                                            {interest}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <EditProfileModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                profile={profile}
                onSuccess={() => { fetchData(); }}
            />

            <ExplainabilityModal
                isOpen={isExplainOpen}
                onClose={() => setExplainOpen(false)}
                recommendation={selectedRec}
            />
        </div>
    );
}
