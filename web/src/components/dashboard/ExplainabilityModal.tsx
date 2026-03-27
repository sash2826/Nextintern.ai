'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface Internship {
    id: string;
    title: string;
    companyName?: string;
    provider?: { companyName: string };
}

interface RecommendationExplanation {
    finalScore?: number;
    strategy?: string;
    matchedSkills?: string[];
    missingSkills?: string[];
    skillOverlapScore?: number;
    locationMatch?: boolean;
    interestOverlap?: string[];
    isColdStart?: boolean;
    reason?: string;
}

interface ExplainabilityModalProps {
    isOpen: boolean;
    onClose: () => void;
    recommendation: {
        internship: Internship;
        explanation: RecommendationExplanation;
        score: number;
    } | null;
}

export default function ExplainabilityModal({ isOpen, onClose, recommendation }: ExplainabilityModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => { document.body.style.overflow = 'unset'; window.removeEventListener('keydown', handleKeyDown); };
    }, [isOpen, onClose]);

    if (!isOpen || !recommendation) return null;

    const { internship, explanation, score } = recommendation;
    const finalScore = explanation.finalScore ?? score;
    const percent = Math.round(finalScore * 100);
    const companyName = internship.companyName || internship.provider?.companyName || 'Company';

    // Compute breakdown scores for visual bars
    const matchedCount = explanation.matchedSkills?.length || 0;
    const missingCount = explanation.missingSkills?.length || 0;
    const totalSkills = matchedCount + missingCount || 1;
    const skillPercent = Math.round((matchedCount / totalSkills) * 100);
    const locationPercent = explanation.locationMatch !== false ? 85 : 40;
    const interestPercent = (explanation.interestOverlap?.length || 0) > 0 ? 90 : 60;

    // Strategy label
    const strategyLabels: Record<string, string> = {
        'hybrid': '🔀 Hybrid (Skills + Collaborative)',
        'content_based': '📊 Content-Based Matching',
        'content_only': '📊 Content-Based',
        'collaborative': '👥 Collaborative Filtering',
        'content_fallback': '📊 Content-Based Matching',
    };
    const strategyLabel = strategyLabels[explanation.strategy || ''] || '🤖 AI-Powered Analysis';

    // Score color
    const scoreColor = percent >= 85 ? 'text-emerald-600 dark:text-emerald-400' :
        percent >= 70 ? 'text-blue-600 dark:text-blue-400' :
        percent >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';

    const ringGradient = percent >= 85 ? ['#10b981', '#059669'] :
        percent >= 70 ? ['#6366f1', '#06b6d4'] :
        percent >= 50 ? ['#f59e0b', '#ef4444'] : ['#ef4444', '#dc2626'];

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true">
            <div className="min-h-full flex items-start justify-center p-4 pt-20 pb-8">
            <div className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden" onClick={(e) => e.stopPropagation()}
                style={{ animation: 'fadeInUp 0.3s ease-out' }}>

                {/* ── Gradient Header ──────────────────────────── */}
                <div className="relative p-6 pb-8 overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 70%, #0891b2 100%)' }}>
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                    <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-400/20 rounded-full blur-[60px] pointer-events-none" />

                    {/* Close button */}
                    <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors text-sm">✕</button>

                    <div className="relative z-10 flex items-center gap-5">
                        {/* Score Ring */}
                        <div className="relative flex-shrink-0">
                            <svg width={90} height={90} className="transform -rotate-90">
                                <circle cx={45} cy={45} r={38} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={7} />
                                <circle cx={45} cy={45} r={38} fill="none" strokeWidth={7} strokeLinecap="round"
                                    stroke={`url(#modal-ring-grad)`}
                                    strokeDasharray={2 * Math.PI * 38}
                                    strokeDashoffset={2 * Math.PI * 38 * (1 - percent / 100)}
                                    style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                                <defs>
                                    <linearGradient id="modal-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor={ringGradient[0]} />
                                        <stop offset="100%" stopColor={ringGradient[1]} />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black text-white">{percent}%</span>
                                <span className="text-[10px] font-bold text-white/50 uppercase">Match</span>
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-white/50 uppercase tracking-widest">✨ AI Match Analysis</span>
                            </div>
                            <h2 className="text-xl font-black text-white leading-tight line-clamp-2">{internship.title}</h2>
                            <p className="text-sm text-white/60 font-medium mt-1">{companyName}</p>
                        </div>
                    </div>
                </div>

                {/* ── Body Content ─────────────────────────────── */}
                <div className="p-6 space-y-5"  >

                    {/* AI Reasoning */}
                    {explanation.reason && (
                        <div className="p-4 bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-indigo-950/30 dark:to-cyan-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                            <div className="flex items-start gap-3">
                                <span className="text-lg">🧠</span>
                                <div>
                                    <h4 className="text-sm font-black text-indigo-800 dark:text-indigo-300 mb-1">AI Reasoning</h4>
                                    <p className="text-sm text-indigo-700 dark:text-indigo-400 leading-relaxed">{explanation.reason}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Strategy Badge */}
                    <div className="flex items-center gap-3">
                        <span className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                            {strategyLabel}
                        </span>
                        {explanation.isColdStart && (
                            <span className="px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-xs font-bold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                🆕 Cold Start Mode
                            </span>
                        )}
                    </div>

                    {/* ── Score Breakdown ────────────────────────── */}
                    <div>
                        <h4 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Score Breakdown</h4>
                        <div className="space-y-4">

                            {/* Skills Match */}
                            <div className="p-4 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-sm">⚡</span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">Skills Alignment</span>
                                    </div>
                                    <span className={`text-sm font-black ${skillPercent >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                        {skillPercent}%
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000" style={{ width: `${skillPercent}%` }} />
                                </div>
                                {matchedCount > 0 && (
                                    <div className="mb-2">
                                        <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1.5">✓ Matched Skills ({matchedCount})</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {explanation.matchedSkills!.map((skill, i) => (
                                                <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                    ✓ {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {missingCount > 0 && (
                                    <div>
                                        <p className="text-[10px] font-bold text-red-500 dark:text-red-400 uppercase tracking-wider mb-1.5">✗ Skills to Develop ({missingCount})</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {explanation.missingSkills!.map((skill, i) => (
                                                <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                                                    ✗ {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {matchedCount === 0 && missingCount === 0 && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">AI analyzed your profile for skill relevance.</p>
                                )}
                            </div>

                            {/* Location Match */}
                            <div className="p-4 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-sm">📍</span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">Location Fit</span>
                                    </div>
                                    <span className={`text-sm font-black ${locationPercent >= 70 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}>
                                        {locationPercent}%
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${locationPercent}%` }} />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {explanation.locationMatch !== false
                                        ? '✓ Matches your preferred location or offers remote work.'
                                        : '△ Location preferences partially match. Remote options may be available.'}
                                </p>
                            </div>

                            {/* Interest Overlap */}
                            <div className="p-4 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-sm">🎯</span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">Interest Alignment</span>
                                    </div>
                                    <span className={`text-sm font-black ${interestPercent >= 70 ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500'}`}>
                                        {interestPercent}%
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000" style={{ width: `${interestPercent}%` }} />
                                </div>
                                {explanation.interestOverlap && explanation.interestOverlap.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {explanation.interestOverlap.map((interest, i) => (
                                            <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                                {interest}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Category and industry alignment analyzed.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── How it works ──────────────────────────── */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800">
                        <h4 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">How AI Matching Works</h4>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { icon: '📄', label: 'Profile Analysis', desc: 'Skills & experience' },
                                { icon: '🧮', label: 'Score Calculation', desc: 'Multi-factor scoring' },
                                { icon: '🎯', label: 'Smart Ranking', desc: 'Best-fit ordering' },
                            ].map(step => (
                                <div key={step.label} className="text-center">
                                    <div className="text-xl mb-1">{step.icon}</div>
                                    <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300">{step.label}</p>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500">{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Footer ──────────────────────────────────── */}
                <div className="p-5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-sm">
                        Dismiss
                    </button>
                    <Link href={`/internships/${internship.id}`} onClick={onClose}
                        className="px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 transition-all shadow-md hover:shadow-lg text-sm">
                        View Internship →
                    </Link>
                </div>
            </div>
            </div>
        </div>
    );
}
