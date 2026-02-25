'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface Internship {
    id: string;
    title: string;
    companyName?: string;
    provider?: {
        companyName: string;
    };
}

interface RecommendationExplanation {
    finalScore?: number;
    strategy?: 'hybrid' | 'content_only' | string;
    matchedSkills?: string[];
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
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !recommendation) return null;

    const { internship, explanation, score } = recommendation;
    const finalScore = explanation.finalScore ?? score;
    const percent = Math.round(finalScore * 100);
    const companyName = internship.companyName || internship.provider?.companyName || 'Company';

    const renderProgressRing = () => {
        const size = 100;
        const stroke = 8;
        const radius = (size - stroke) / 2;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percent / 100) * circumference;

        return (
            <div className="relative flex items-center justify-center">
                <svg width={size} height={size} className="transform -rotate-90">
                    <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke}
                        className="text-gray-200 dark:text-gray-800" />
                    <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} strokeLinecap="round"
                        stroke="url(#explain-ring-gradient)"
                        strokeDasharray={circumference} strokeDashoffset={offset}
                        style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                    <defs>
                        <linearGradient id="explain-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                    </defs>
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{percent}%</span>
                </div>
            </div>
        );
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Container */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1">{internship.title}</h2>
                        <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">{companyName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Close modal"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Score Section */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-800">
                        {renderProgressRing()}
                        <div className="text-center sm:text-left">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Match Score</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {explanation.reason || 'Calculated based on your profile alignment.'}
                            </p>

                            <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
                                <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                                    Strategy: {explanation.strategy || 'Content Match'}
                                </span>
                                {explanation.isColdStart && (
                                    <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                        Cold Start Fallback
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Breakdown Details */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Score Breakdown</h4>

                        {/* Skills */}
                        {explanation.matchedSkills && explanation.matchedSkills.length > 0 && (
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg">⭐</div>
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white text-sm">Skills Alignment</p>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {explanation.matchedSkills.map((skill, i) => (
                                            <span key={i} className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                    {explanation.skillOverlapScore !== undefined && (
                                        <p className="text-xs text-gray-500 mt-1">Weight distribution: {(explanation.skillOverlapScore * 100).toFixed(0)}% optimal.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Location */}
                        {explanation.locationMatch !== undefined && (
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${explanation.locationMatch ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>📍</div>
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white text-sm">Location</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {explanation.locationMatch ? 'Matches your location or offers remote work.' : 'Location criteria did not strongly match.'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Interests */}
                        {explanation.interestOverlap && explanation.interestOverlap.length > 0 && (
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">🎯</div>
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white text-sm">Interest Overlap</p>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {explanation.interestOverlap.map((interest, i) => (
                                            <span key={i} className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">
                                                {interest}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        Dismiss
                    </button>
                    <Link
                        href={`/internships/${internship.id}`}
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm"
                    >
                        View Internship
                    </Link>
                </div>
            </div>
        </div>
    );
}
