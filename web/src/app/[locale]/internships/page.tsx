'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';

const CATEGORIES = ['All', 'Web Development', 'Backend', 'AI/ML', 'Data Science', 'Frontend', 'Mobile', 'DevOps', 'Security'];
const WORK_MODES = [
    { value: '', label: 'All Modes' },
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'onsite', label: 'Onsite' }
];

function InternshipsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // State
    const [internships, setInternships] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(0);

    // Filters
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
    const [selectedState, setSelectedState] = useState(searchParams.get('state') || '');
    const [selectedWorkMode, setSelectedWorkMode] = useState(searchParams.get('workMode') || '');
    const [page, setPage] = useState(Number(searchParams.get('page')) || 0);

    const debouncedQuery = useDebounce(searchQuery, 500);

    // Sync URL with filters
    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedQuery) params.set('q', debouncedQuery);
        if (selectedCategory && selectedCategory !== 'All') params.set('category', selectedCategory);
        if (selectedState) params.set('state', selectedState);
        if (selectedWorkMode) params.set('workMode', selectedWorkMode);
        if (page > 0) params.set('page', page.toString());

        router.replace(`/internships?${params.toString()}`);
    }, [debouncedQuery, selectedCategory, selectedState, selectedWorkMode, page, router]);

    // Reset pagination on filter change
    useEffect(() => {
        setPage(0);
    }, [debouncedQuery, selectedCategory, selectedState, selectedWorkMode]);

    // Fetch Data
    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const data = await api.searchInternships({
                    q: debouncedQuery,
                    category: selectedCategory === 'All' ? undefined : selectedCategory,
                    state: selectedState || undefined,
                    workMode: selectedWorkMode || undefined,
                    page,
                    size: 10,
                });
                setInternships(data.content || []);
                setTotalPages(data.totalPages || 0);
            } catch (error) {
                console.error('Failed to fetch internships:', error);
                setInternships([]);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [debouncedQuery, selectedCategory, selectedState, selectedWorkMode, page]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Browse Internships</h1>
                <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">
                    Discover opportunities tailored to your skills and interests
                </p>
            </div>

            {/* Search & Filters */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 mb-8">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            🔍
                        </span>
                        <input
                            type="text"
                            placeholder="Search by title, skills, or company..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="">All States</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Telangana">Telangana</option>
                        <option value="Delhi">Delhi</option>
                    </select>

                    <select
                        value={selectedWorkMode}
                        onChange={(e) => setSelectedWorkMode(e.target.value)}
                        className="px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    >
                        {WORK_MODES.map(mode => (
                            <option key={mode.value} value={mode.value}>{mode.label}</option>
                        ))}
                    </select>
                </div>

                {/* Category Tags */}
                <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat === selectedCategory ? '' : cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${(selectedCategory === cat || (cat === 'All' && !selectedCategory))
                                ? 'bg-primary-600 text-white shadow-md'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            {cat}
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
                <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No internships found</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        Try adjusting your search or filters to find what you're looking for.
                    </p>
                    <button
                        onClick={() => {
                            setSearchQuery('');
                            setSelectedCategory('');
                            setSelectedState('');
                            setSelectedWorkMode('');
                        }}
                        className="mt-6 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        Clear all filters
                    </button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
                                    <div className="mb-4">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                                            {intern.description}
                                        </p>
                                    </div>

                                    {/* Meta */}
                                    <div className="flex flex-wrap gap-2 mb-4 mt-auto">
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
                                                ? `₹${(intern.stipendMin / 1000).toFixed(0)}k – ₹${(intern.stipendMax / 1000).toFixed(0)}k`
                                                : intern.stipendMin
                                                    ? `₹${(intern.stipendMin / 1000).toFixed(0)}k`
                                                    : 'Unpaid'}
                                            <span className="font-normal text-gray-500 text-xs ml-1">/mo</span>
                                        </div>
                                        <span className="text-xs text-gray-400">{intern.durationWeeks} weeks</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
                                Page {page + 1} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default function InternshipsPage() {
    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-12">
            <Suspense fallback={
                <div className="max-w-7xl mx-auto px-4 text-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading internships...</p>
                </div>
            }>
                <InternshipsContent />
            </Suspense>
        </main>
    );
}
