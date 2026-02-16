'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function InternshipDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, token } = useAuth();
    const [intern, setIntern] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [application, setApplication] = useState<any>(null); // Existing application if any
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [coverNote, setCoverNote] = useState('');

    useEffect(() => {
        if (!id) return;

        setLoading(true);
        api.getInternship(id as string)
            .then(data => {
                setIntern(data);
                if (token && user?.role === 'STUDENT') {
                    // Check if already applied (fetch recent applications)
                    // Optimization: dedicated endpoint check would be better, using list for MVP
                    api.getMyApplications(0, 100).then(res => {
                        const existing = res.content?.find((a: any) => a.internship.id === id);
                        setApplication(existing);
                    }).catch(() => { });
                }
            })
            .catch(() => router.push('/internships'))
            .finally(() => setLoading(false));
    }, [id, router, token, user]);

    const handleApply = async () => {
        if (!token) {
            router.push('/login');
            return;
        }
        setApplying(true);
        try {
            const res = await api.apply(intern.id, coverNote);
            setApplication(res);
            setShowApplyModal(false);
            alert('Application submitted successfully!');
        } catch (err: any) {
            alert(err.message || 'Failed to apply');
        } finally {
            setApplying(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 pb-12">
                <div className="max-w-4xl mx-auto px-4 animate-pulse">
                    <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl mb-8"></div>
                </div>
            </main>
        );
    }

    if (!intern) return null;

    const isProvider = user?.role === 'PROVIDER';
    const isOwner = isProvider && user?.id === intern.provider?.id;
    const isStudent = user?.role === 'STUDENT';
    const requiredSkills = intern.skills?.filter((s: any) => s.importance === 'required') || [];
    const preferredSkills = intern.skills?.filter((s: any) => s.importance === 'preferred') || [];
    const bonusSkills = intern.skills?.filter((s: any) => s.importance === 'bonus') || [];

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 pb-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back link */}
                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-primary-600 transition-colors">
                        ← Back
                    </button>
                    {isOwner && (
                        <Link href={`/internships/${id}/manage`} className="text-sm font-semibold text-primary-600 hover:text-primary-700">
                            Manage Applications →
                        </Link>
                    )}
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-lg">
                    {/* Hero */}
                    <div className="bg-gradient-to-r from-primary-600 to-accent-600 px-8 py-10 relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/5 opacity-50 pattern-grid-lg"></div>
                        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">{intern.title}</h1>
                                <div className="flex items-center gap-3 text-primary-100 text-lg">
                                    <span className="font-medium">{intern.provider?.companyName}</span>
                                    {intern.provider?.verified && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-white/20 text-white backdrop-blur-sm border border-white/20">✓ Verified</span>
                                    )}
                                </div>
                            </div>
                            <div className="text-left md:text-right">
                                <span className="text-sm text-primary-200 uppercase tracking-wider font-medium">Stipend</span>
                                <p className="text-3xl font-bold text-white">
                                    {intern.stipendMin && intern.stipendMax
                                        ? `₹${(intern.stipendMin / 1000).toFixed(0)}k–${(intern.stipendMax / 1000).toFixed(0)}k`
                                        : intern.stipendMin
                                            ? `₹${(intern.stipendMin / 1000).toFixed(0)}k`
                                            : 'Unpaid'}
                                    <span className="text-lg font-normal text-primary-200 ml-1">/mo</span>
                                </p>
                            </div>
                        </div>

                        {/* Quick meta */}
                        <div className="flex flex-wrap gap-3 mt-8 relative z-10">
                            {[
                                { icon: '📍', value: intern.workMode === 'remote' ? 'Remote' : `${intern.locationCity || ''}, ${intern.locationState || ''}` },
                                { icon: '⏳', value: `${intern.durationWeeks} weeks` },
                                { icon: '📅', value: intern.applicationDeadline ? `Apply by ${intern.applicationDeadline}` : 'Open' },
                                { icon: '👥', value: `${intern.applicantCount || 0} applicants` },
                            ].map((m, i) => (
                                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 text-sm text-white font-medium">
                                    {m.icon} {m.value}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-8 space-y-8">
                        {/* Description */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">About the Role</h2>
                            <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed">
                                {intern.description}
                            </div>
                        </section>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Skills */}
                            <section>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Skills</h2>
                                <div className="space-y-4">
                                    {requiredSkills.length > 0 && (
                                        <div>
                                            <span className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2 block">Required</span>
                                            <div className="flex flex-wrap gap-2">
                                                {requiredSkills.map((s: any) => (
                                                    <span key={s.name} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                                                        {s.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {preferredSkills.length > 0 && (
                                        <div>
                                            <span className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2 block">Preferred</span>
                                            <div className="flex flex-wrap gap-2">
                                                {preferredSkills.map((s: any) => (
                                                    <span key={s.name} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                                        {s.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {bonusSkills.length > 0 && (
                                        <div>
                                            <span className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2 block">Bonus</span>
                                            <div className="flex flex-wrap gap-2">
                                                {bonusSkills.map((s: any) => (
                                                    <span key={s.name} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                                                        {s.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Eligibility */}
                            {intern.eligibility && (
                                <section>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Eligibility</h2>
                                    <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                        {intern.eligibility}
                                    </p>
                                </section>
                            )}
                        </div>

                        {/* CTA Section */}
                        <div className="pt-8 mt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col items-center">
                            {isStudent ? (
                                application ? (
                                    <div className="text-center">
                                        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold mb-3 ${application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                                application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                    'bg-blue-100 text-blue-800'
                                            }`}>
                                            Status: {application.status.toUpperCase()}
                                        </div>
                                        <p className="text-gray-500">You applied on {new Date(application.appliedAt).toLocaleDateString()}</p>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setShowApplyModal(true)}
                                            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-primary-500/25 hover:-translate-y-1"
                                        >
                                            Apply Now 🚀
                                        </button>
                                        <p className="mt-4 text-sm text-gray-500">
                                            {intern.applicantCount > 50 ? '🔥 High demand! Apply soon.' : 'Be among the first applicants!'}
                                        </p>
                                    </>
                                )
                            ) : isOwner ? (
                                <Link href={`/internships/${id}/manage`} className="w-full sm:w-auto text-center px-10 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:opacity-90 transition-all">
                                    Manage Applications
                                </Link>
                            ) : (
                                !user && (
                                    <Link href="/login" className="text-primary-600 hover:underline font-medium">
                                        Log in to apply
                                    </Link>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Apply Modal */}
            {showApplyModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg p-8 shadow-2xl border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Apply for {intern.title}</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Send a brief cover note to {intern.provider?.companyName}.
                        </p>

                        <textarea
                            value={coverNote}
                            onChange={(e) => setCoverNote(e.target.value)}
                            placeholder="I am interested in this role because..."
                            className="w-full h-32 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none mb-6 text-gray-900 dark:text-white"
                            maxLength={500}
                        />

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowApplyModal(false)}
                                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApply}
                                disabled={applying}
                                className="flex-1 px-4 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
                            >
                                {applying ? 'Sending...' : 'Send Application'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
