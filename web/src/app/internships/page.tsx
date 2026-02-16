'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

const CATEGORIES = ['All', 'Web Development', 'Backend', 'AI/ML', 'Data Science', 'Frontend', 'Mobile', 'DevOps', 'Security'];
const WORK_MODES = ['All', 'remote', 'hybrid', 'onsite'];

export default function InternshipsPage() {
    const [internships, setInternships] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('All');
    const [workMode, setWorkMode] = useState('All');

    useEffect(() => {
        setLoading(true);
        api.searchInternships({
            category: category === 'All' ? undefined : category,
            workMode: workMode === 'All' ? undefined : workMode,
        })
            .then(data => setInternships(data.content || []))
            .catch(() => setInternships([]))
            .finally(() => setLoading(false));
    }, [category, workMode]);

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Browse Internships</h1>
                    <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">
                        Discover opportunities tailored to your skills and interests
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-8">
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${category === cat
                                        ? 'bg-primary-600 text-white shadow-md'
                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary-300'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2 ml-auto">
                        {WORK_MODES.map(mode => (
                            <button
                                key={mode}
                                onClick={() => setWorkMode(mode)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${workMode === mode
                                        ? 'bg-accent-600 text-white'
                                        : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                                    }`}
                            >
                                {mode === 'All' ? '🌐 All' : mode === 'remote' ? '🏠 Remote' : mode === 'hybrid' ? '🔄 Hybrid' : '🏢 Onsite'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 animate-pulse">
                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4" />
                                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                                <div className="flex gap-2">
                                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
                                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : internships.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-2xl text-gray-400">No internships found</p>
                        <p className="text-gray-500 mt-2">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {internships.map(intern => (
                            <Link key={intern.id} href={`/internships/${intern.id}`}>
                                <div className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full flex flex-col">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-2">
                                                {intern.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{intern.provider?.companyName}</p>
                                        </div>
                                        {intern.provider?.verified && (
                                            <span className="ml-2 flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                                ✓ Verified
                                            </span>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4 flex-1">
                                        {intern.description}
                                    </p>

                                    {/* Meta */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300">
                                            {intern.category}
                                        </span>
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                            {intern.workMode === 'remote' ? '🏠' : intern.workMode === 'hybrid' ? '🔄' : '🏢'} {intern.workMode}
                                        </span>
                                        {intern.locationCity && (
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                                📍 {intern.locationCity}
                                            </span>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {intern.stipendMin && intern.stipendMax
                                                ? `₹${(intern.stipendMin / 1000).toFixed(0)}k – ₹${(intern.stipendMax / 1000).toFixed(0)}k/mo`
                                                : intern.stipendMin
                                                    ? `₹${(intern.stipendMin / 1000).toFixed(0)}k/mo`
                                                    : 'Unpaid'}
                                        </div>
                                        <span className="text-xs text-gray-400">{intern.durationWeeks}w</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
