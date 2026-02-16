'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function InternshipDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [intern, setIntern] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            api.getInternship(id as string)
                .then(setIntern)
                .catch(() => router.push('/internships'))
                .finally(() => setLoading(false));
        }
    }, [id, router]);

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 pb-12">
                <div className="max-w-4xl mx-auto px-4 animate-pulse">
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4" />
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-8" />
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
                    </div>
                </div>
            </main>
        );
    }

    if (!intern) return null;

    const requiredSkills = intern.skills?.filter((s: any) => s.importance === 'required') || [];
    const preferredSkills = intern.skills?.filter((s: any) => s.importance === 'preferred') || [];
    const bonusSkills = intern.skills?.filter((s: any) => s.importance === 'bonus') || [];

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 pb-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back link */}
                <Link href="/internships" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-6 transition-colors">
                    ← Back to all internships
                </Link>

                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-lg">
                    {/* Hero */}
                    <div className="bg-gradient-to-r from-primary-600 to-accent-600 px-8 py-10">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-white">{intern.title}</h1>
                                <p className="mt-2 text-primary-100 text-lg flex items-center gap-2">
                                    {intern.provider?.companyName}
                                    {intern.provider?.verified && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-white/20 text-white">✓ Verified</span>
                                    )}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-sm text-primary-200">Stipend</span>
                                <p className="text-2xl font-bold text-white">
                                    {intern.stipendMin && intern.stipendMax
                                        ? `₹${(intern.stipendMin / 1000).toFixed(0)}k – ₹${(intern.stipendMax / 1000).toFixed(0)}k`
                                        : intern.stipendMin
                                            ? `₹${(intern.stipendMin / 1000).toFixed(0)}k`
                                            : 'Unpaid'}
                                    <span className="text-sm font-normal text-primary-200">/mo</span>
                                </p>
                            </div>
                        </div>

                        {/* Quick meta */}
                        <div className="flex flex-wrap gap-3 mt-6">
                            {[
                                { icon: '📍', value: intern.workMode === 'remote' ? 'Remote' : `${intern.locationCity || ''}, ${intern.locationState || ''}` },
                                { icon: '⏳', value: `${intern.durationWeeks} weeks` },
                                { icon: '📅', value: intern.applicationDeadline ? `Apply by ${intern.applicationDeadline}` : 'Open' },
                                { icon: '👥', value: `${intern.applicantCount || 0}${intern.maxApplicants ? '/' + intern.maxApplicants : ''} applicants` },
                            ].map((m, i) => (
                                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-sm text-white">
                                    {m.icon} {m.value}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-8 space-y-8">
                        {/* Description */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">About This Internship</h2>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">{intern.description}</p>
                        </section>

                        {/* Skills */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Skills Required</h2>
                            <div className="space-y-3">
                                {requiredSkills.length > 0 && (
                                    <div>
                                        <span className="text-xs font-semibold uppercase text-red-500 tracking-wider">Required</span>
                                        <div className="flex flex-wrap gap-2 mt-1">
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
                                        <span className="text-xs font-semibold uppercase text-amber-500 tracking-wider">Preferred</span>
                                        <div className="flex flex-wrap gap-2 mt-1">
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
                                        <span className="text-xs font-semibold uppercase text-green-500 tracking-wider">Bonus</span>
                                        <div className="flex flex-wrap gap-2 mt-1">
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
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Eligibility</h2>
                                <p className="text-gray-600 dark:text-gray-400">{intern.eligibility}</p>
                            </section>
                        )}

                        {/* Apply CTA */}
                        <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                            <button className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                                Apply Now →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
