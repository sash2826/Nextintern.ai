'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/ToastProvider';
import { MOCK_INTERNSHIPS } from '@/lib/mockInternships';

export default function InternshipDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, token } = useAuth();
    const toast = useToast();
    const [intern, setIntern] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [application, setApplication] = useState<any>(null);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [coverNote, setCoverNote] = useState('');
    const [cvFile, setCvFile] = useState<File | null>(null);
    const [applicantName, setApplicantName] = useState(user?.fullName || '');
    const [applicantEmail, setApplicantEmail] = useState(user?.email || '');
    const [linkedIn, setLinkedIn] = useState('');
    const [portfolio, setPortfolio] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (!id) return;

        setLoading(true);
        api.getInternship(id as string)
            .then(data => {
                setIntern(data);
                if (token && user?.roles.includes('ROLE_STUDENT')) {
                    api.getMyApplications(token!, 0, 100).then(res => {
                        const existing = res.content?.find((a: any) => a.internship.id === id);
                        setApplication(existing);
                    }).catch(() => { });
                }
            })
            .catch(() => {
                const mockIntern = MOCK_INTERNSHIPS.find(m => m.id === id);
                if (mockIntern) {
                    setIntern({
                        ...mockIntern,
                        score: 0.95,
                        explanation: {
                            reason: `Strong alignment with your profile based on ${mockIntern.category} skills. ${mockIntern.workMode === 'remote' ? 'Remote work available.' : 'Located in your preferred area.'}`,
                        }
                    });
                } else {
                    router.push('/internships');
                }
            })
            .finally(() => setLoading(false));
    }, [id, router, token, user]);

    const handleApply = async () => {
        if (!token) {
            router.push('/login');
            return;
        }
        setApplying(true);
        try {
            const res = await api.apply(token!, intern.id, coverNote);
            setApplication(res);
            setSubmitted(true);
            toast.success('Application submitted successfully! 🎉');
        } catch (err: any) {
            toast.error(err.message || 'Failed to submit application');
        } finally {
            setApplying(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 pb-12">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg mb-6 animate-shimmer" />
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-lg">
                        <div className="h-48 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 animate-shimmer" />
                        <div className="p-8 space-y-4">
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-shimmer" />
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-shimmer" />
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-shimmer" />
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    if (!intern) return null;

    const isProvider = user?.roles.includes('ROLE_PROVIDER');
    const isOwner = isProvider && user?.id === intern.provider?.id;
    const isStudent = user?.roles.includes('ROLE_STUDENT');
    const requiredSkills = intern.skills?.filter((s: any) => s.importance === 'required') || [];
    const preferredSkills = intern.skills?.filter((s: any) => s.importance === 'preferred') || [];
    const bonusSkills = intern.skills?.filter((s: any) => s.importance === 'bonus') || [];

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
            {/* ── Header / Hero ────────────────────────────────────────── */}
            <header className="relative pt-32 pb-24 bg-gradient-to-br from-indigo-950 via-primary-900 to-cyan-900 overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 3px 3px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex justify-between items-center mb-10">
                        <button onClick={() => router.back()} className="text-sm font-semibold text-primary-200 hover:text-white transition-colors flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            Back to Search
                        </button>
                        {isOwner && (
                            <Link href={`/provider/internships/${id}/applications`} className="text-sm font-bold px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-md border border-white/10">
                                Manage Applications →
                            </Link>
                        )}
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="flex-1">
                            <div className="flex items-center gap-5 mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center text-3xl font-black text-indigo-950">
                                    {intern.provider?.companyName?.charAt(0) || 'C'}
                                </div>
                                <div>
                                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2 leading-tight">
                                        {intern.title}
                                    </h1>
                                    <div className="flex items-center gap-3 text-primary-100 text-lg">
                                        <span className="font-bold text-white/90">{intern.provider?.companyName}</span>
                                        {intern.provider?.verified && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                ✓ Verified
                                            </span>
                                        )}
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20">
                                            {intern.category}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-3 mt-8">
                                {[
                                    { icon: '📍', value: intern.workMode === 'remote' ? 'Remote' : intern.locationCity && intern.locationState ? `${intern.locationCity}, ${intern.locationState}` : intern.locationCity || intern.locationState || 'Location TBA' },
                                    { icon: '⏳', value: `${intern.durationWeeks} weeks` },
                                    { icon: '📅', value: intern.applicationDeadline ? `Apply by ${new Date(intern.applicationDeadline).toLocaleDateString()}` : 'Open' },
                                    { icon: '👥', value: `${intern.applicantCount || 0} applicants` },
                                ].map((m, i) => (
                                    <span key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black/20 backdrop-blur-md border border-white/10 text-sm text-white font-medium shadow-inner">
                                        <span className="opacity-70">{m.icon}</span> {m.value}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 md:p-8 text-center shadow-2xl w-full md:w-auto md:min-w-[260px]">
                            <span className="text-sm text-cyan-200 uppercase tracking-widest font-bold mb-2 block">Stipend</span>
                            <div className="text-5xl font-black text-white mb-2 tracking-tight">
                                {intern.stipendMin && intern.stipendMax
                                    ? `₹${(intern.stipendMin / 1000).toFixed(0)}k–${(intern.stipendMax / 1000).toFixed(0)}k`
                                    : intern.stipendMin
                                        ? `₹${(intern.stipendMin / 1000).toFixed(0)}k`
                                        : 'Unpaid'}
                            </div>
                            <span className="text-base font-semibold text-cyan-100 block opacity-80">/ month</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Main Content Grid ──────────────────────────────────── */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
                <div className="grid md:grid-cols-[1fr_340px] gap-8">
                    
                    {/* Left Column: Details */}
                    <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-200 dark:border-gray-800 shadow-xl p-8 md:p-10 space-y-10">
                        
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400">📄</span>
                                About the Role
                            </h2>
                            <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed text-lg">
                                {intern.description}
                            </div>
                        </section>

                        <hr className="border-gray-100 dark:border-gray-800" />

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-900/50 flex items-center justify-center text-accent-600 dark:text-accent-400">⚡</span>
                                Required Skills
                            </h2>
                            <div className="space-y-6">
                                {requiredSkills.length > 0 && (
                                    <div>
                                        <span className="text-sm font-bold uppercase text-gray-400 tracking-wider mb-3 block">Must Have</span>
                                        <div className="flex flex-wrap gap-2">
                                            {requiredSkills.map((s: any) => (
                                                <span key={s.name} className="px-4 py-2 rounded-xl text-sm font-bold bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 shadow-sm">
                                                    {s.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {preferredSkills.length > 0 && (
                                    <div>
                                        <span className="text-sm font-bold uppercase text-gray-400 tracking-wider mb-3 block">Nice to Have</span>
                                        <div className="flex flex-wrap gap-2">
                                            {preferredSkills.map((s: any) => (
                                                <span key={s.name} className="px-4 py-2 rounded-xl text-sm font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-sm">
                                                    {s.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {bonusSkills.length > 0 && (
                                    <div>
                                        <span className="text-sm font-bold uppercase text-gray-400 tracking-wider mb-3 block">Bonus</span>
                                        <div className="flex flex-wrap gap-2">
                                            {bonusSkills.map((s: any) => (
                                                <span key={s.name} className="px-4 py-2 rounded-xl text-sm font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-sm">
                                                    {s.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {requiredSkills.length === 0 && preferredSkills.length === 0 && bonusSkills.length === 0 && (
                                    <p className="text-gray-500 italic text-lg">No specific skills listed.</p>
                                )}
                            </div>
                        </section>

                        {intern.eligibility && (
                            <>
                                <hr className="border-gray-100 dark:border-gray-800" />
                                <section>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400">🎓</span>
                                        Eligibility
                                    </h2>
                                    <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 text-lg leading-relaxed shadow-inner">
                                        {intern.eligibility}
                                    </p>
                                </section>
                            </>
                        )}
                    </div>

                    {/* Right Column: AI Analysis & CTA */}
                    <div className="space-y-6">
                        {/* AI Match Reason */}
                        {intern.score && intern.explanation && (
                            <div className="bg-gradient-to-br from-indigo-50 to-cyan-50 dark:from-indigo-950/40 dark:to-cyan-950/40 rounded-[2rem] border border-blue-100 dark:border-blue-900/50 p-6 shadow-xl relative overflow-hidden">
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-400/20 blur-2xl rounded-full pointer-events-none" />
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-900 shadow-sm flex items-center justify-center text-xl">
                                        ✨
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight">AI Match</h3>
                                        <span className="text-sm font-bold text-primary-600 dark:text-primary-400">Analysis complete</span>
                                    </div>
                                </div>
                                
                                <div className="mb-4">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Match Alignment</span>
                                        <span className="text-2xl font-black text-primary-700 dark:text-primary-400">{Math.round(intern.score * 100)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full" style={{ width: `${Math.round(intern.score * 100)}%` }} />
                                    </div>
                                </div>

                                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed font-medium bg-white/50 dark:bg-gray-900/50 p-4 rounded-xl shadow-inner border border-white/50 dark:border-gray-800/50">
                                    {intern.explanation.reason}
                                </p>
                            </div>
                        )}

                        {/* Apply Card */}
                        <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-200 dark:border-gray-800 p-8 shadow-xl text-center sticky top-28">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Interested in this role?</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                                Join {intern.applicantCount || 0} others who are already exploring this opportunity.
                            </p>
                            
                            {isStudent ? (
                                application ? (
                                    <div>
                                        <div className={`inline-flex items-center px-6 py-3 rounded-xl text-sm font-black mb-4 w-full justify-center ${
                                            application.status === 'accepted' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                            application.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                            'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                        }`}>
                                            STATUS: {application.status.toUpperCase()}
                                        </div>
                                        <p className="text-sm text-gray-500 font-medium">Applied on {new Date(application.appliedAt).toLocaleDateString()}</p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowApplyModal(true)}
                                        className="w-full py-4 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-black text-lg rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:-translate-y-1"
                                    >
                                        Apply Now 🚀
                                    </button>
                                )
                            ) : isOwner ? (
                                <Link href={`/provider/internships/${id}/applications`} className="block w-full text-center py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-lg rounded-xl hover:opacity-90 transition-opacity">
                                    Manage Applications
                                </Link>
                            ) : (
                                !user && (
                                    <Link href="/login" className="block w-full py-4 border-2 border-primary-600 text-primary-600 dark:border-primary-500 dark:text-primary-500 font-black text-lg rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                                        Log in to Apply
                                    </Link>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Professional Application Modal ──────────────── */}
            {showApplyModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50" onClick={() => { setShowApplyModal(false); setSubmitted(false); }}>
                    <div
                        className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="relative px-8 pt-8 pb-6 bg-gradient-to-br from-indigo-950 via-primary-900 to-cyan-900 text-white">
                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 3px 3px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-white/90 backdrop-blur-sm">
                                        {submitted ? '✅ Submitted' : '📝 Job Application'}
                                    </span>
                                    <button onClick={() => { setShowApplyModal(false); setSubmitted(false); }} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors">
                                        ✕
                                    </button>
                                </div>
                                <h2 className="text-2xl font-black tracking-tight mb-1">{intern.title}</h2>
                                <p className="text-white/70 text-sm font-medium">{intern.provider?.companyName} · {intern.locationCity || 'Remote'} · {intern.workMode}</p>
                            </div>
                        </div>

                        {/* ── Success Confirmation ─────────────────── */}
                        {submitted ? (
                            <div className="p-10 text-center">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                    <svg className="w-10 h-10 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Application Submitted!</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed max-w-md mx-auto mb-2">
                                    Your application for <span className="font-bold text-gray-700 dark:text-gray-200">{intern.title}</span> at <span className="font-bold text-gray-700 dark:text-gray-200">{intern.provider?.companyName}</span> has been successfully submitted.
                                </p>
                                <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 text-left">
                                    <p className="text-sm font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-1">
                                        <span>📧</span> Check your email for further details
                                    </p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400">
                                        We've sent a confirmation to <span className="font-bold">{applicantEmail || user?.email}</span>. The hiring team will review your application and get back to you soon.
                                    </p>
                                </div>
                                <div className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Status</span>
                                        <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full text-xs">⏳ Under Review</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm mt-3">
                                        <span className="text-gray-500 dark:text-gray-400">Applied on</span>
                                        <span className="font-bold text-gray-700 dark:text-gray-300">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                    </div>
                                    {cvFile && (
                                        <div className="flex items-center justify-between text-sm mt-3">
                                            <span className="text-gray-500 dark:text-gray-400">Resume</span>
                                            <span className="font-bold text-gray-700 dark:text-gray-300">📄 {cvFile.name}</span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => { setShowApplyModal(false); setSubmitted(false); }}
                                    className="mt-8 w-full py-4 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-black text-base rounded-xl hover:from-primary-700 hover:to-accent-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                                >
                                    Done ✓
                                </button>
                            </div>
                        ) : (
                        <>
                        <div className="p-8 space-y-6">
                            {/* Section 1: Applicant Information */}
                            <div>
                                <h3 className="text-base font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-md bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs font-black">1</span>
                                    Applicant Information
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Full Name *</label>
                                        <input
                                            type="text"
                                            value={applicantName}
                                            onChange={e => setApplicantName(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm font-medium"
                                            placeholder="Your full name"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Email *</label>
                                        <input
                                            type="email"
                                            value={applicantEmail}
                                            onChange={e => setApplicantEmail(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm font-medium"
                                            placeholder="you@example.com"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">LinkedIn Profile</label>
                                        <input
                                            type="url"
                                            value={linkedIn}
                                            onChange={e => setLinkedIn(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm"
                                            placeholder="linkedin.com/in/yourname"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Portfolio / GitHub</label>
                                        <input
                                            type="url"
                                            value={portfolio}
                                            onChange={e => setPortfolio(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm"
                                            placeholder="github.com/yourname"
                                        />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-100 dark:border-gray-800" />

                            {/* Section 2: Resume / CV Upload */}
                            <div>
                                <h3 className="text-base font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-md bg-accent-100 dark:bg-accent-900/40 text-accent-600 dark:text-accent-400 flex items-center justify-center text-xs font-black">2</span>
                                    Resume / CV
                                </h3>

                                {cvFile ? (
                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-2xl flex-shrink-0">
                                            📄
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300 truncate">{cvFile.name}</p>
                                            <p className="text-xs text-emerald-600 dark:text-emerald-500">{(cvFile.size / 1024).toFixed(1)} KB · Uploaded successfully</p>
                                        </div>
                                        <button
                                            onClick={() => setCvFile(null)}
                                            className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-800 hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 hover:text-red-600 dark:hover:text-red-400 transition-colors text-sm font-bold"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <label
                                        className={`flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 ${
                                            dragOver
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-[1.02]'
                                                : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10'
                                        }`}
                                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                        onDragLeave={() => setDragOver(false)}
                                        onDrop={e => {
                                            e.preventDefault();
                                            setDragOver(false);
                                            const file = e.dataTransfer.files[0];
                                            if (file) setCvFile(file);
                                        }}
                                    >
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            className="hidden"
                                            onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (file) setCvFile(file);
                                            }}
                                        />
                                        <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-2xl mb-4">
                                            📎
                                        </div>
                                        <p className="text-base font-bold text-gray-700 dark:text-gray-300 mb-1">
                                            {dragOver ? 'Drop your file here' : 'Upload your Resume / CV'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Drag & drop or <span className="text-primary-600 dark:text-primary-400 font-bold">click to browse</span>
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">PDF, DOC, DOCX · Max 5MB</p>
                                    </label>
                                )}
                            </div>

                            <hr className="border-gray-100 dark:border-gray-800" />

                            {/* Section 3: Cover Letter */}
                            <div>
                                <h3 className="text-base font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-black">3</span>
                                    Cover Letter
                                </h3>
                                <textarea
                                    value={coverNote}
                                    onChange={(e) => setCoverNote(e.target.value)}
                                    placeholder={`Dear Hiring Manager at ${intern.provider?.companyName},\n\nI am writing to express my interest in the ${intern.title} position. I believe my skills in...`}
                                    className="w-full h-40 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none text-gray-900 dark:text-white text-sm leading-relaxed"
                                    maxLength={1000}
                                />
                                <div className="flex justify-between items-center mt-2">
                                    <p className="text-xs text-gray-400">
                                        Tip: Mention specific skills from the job description that you possess.
                                    </p>
                                    <span className={`text-xs font-bold ${coverNote.length > 800 ? 'text-amber-500' : 'text-gray-400'}`}>
                                        {coverNote.length}/1000
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-8 py-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => setShowApplyModal(false)}
                                className="sm:flex-1 px-6 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApply}
                                disabled={applying || !applicantName.trim() || !applicantEmail.trim()}
                                className="sm:flex-[2] px-6 py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 text-white font-black text-base hover:from-primary-700 hover:to-accent-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:shadow-primary-500/20 hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:hover:shadow-lg flex items-center justify-center gap-2"
                            >
                                {applying ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                        Submitting Application…
                                    </>
                                ) : (
                                    <>
                                        Submit Application <span>🚀</span>
                                    </>
                                )}
                            </button>
                        </div>
                        </>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}
