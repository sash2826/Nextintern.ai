'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import { MOCK_INTERNSHIPS } from '@/lib/mockInternships';

const CATEGORIES = ['All', 'Web Development', 'Backend', 'AI/ML', 'Data Science', 'Frontend', 'Mobile', 'DevOps', 'Security'];
const WORK_MODES = [
    { value: '', label: 'All Modes' },
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'onsite', label: 'Onsite' }
];

// ── Fuzzy search helpers ──────────────────────────────────────
function levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
        Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
}

function fuzzyMatch(text: string, query: string): boolean {
    const t = text.toLowerCase();
    const q = query.toLowerCase();
    // Exact substring match
    if (t.includes(q)) return true;
    // Word-level fuzzy: check if any word in text is close to any query word
    const textWords = t.split(/[\s,/·\-_()]+/).filter(Boolean);
    const queryWords = q.split(/[\s,/·\-_()]+/).filter(Boolean);
    for (const qw of queryWords) {
        if (qw.length < 2) continue;
        for (const tw of textWords) {
            if (tw.includes(qw) || qw.includes(tw)) return true;
            // Allow typo tolerance: max distance scales with word length
            const maxDist = qw.length <= 3 ? 1 : qw.length <= 6 ? 2 : 3;
            if (levenshtein(tw, qw) <= maxDist) return true;
        }
    }
    return false;
}

function fuzzyScore(text: string, query: string): number {
    const t = text.toLowerCase();
    const q = query.toLowerCase();
    if (t === q) return 10;
    if (t.startsWith(q)) return 8;
    if (t.includes(q)) return 6;
    const textWords = t.split(/[\s,/·\-_()]+/).filter(Boolean);
    const queryWords = q.split(/[\s,/·\-_()]+/).filter(Boolean);
    let score = 0;
    for (const qw of queryWords) {
        for (const tw of textWords) {
            if (tw === qw) { score += 5; break; }
            if (tw.includes(qw) || qw.includes(tw)) { score += 3; break; }
            const maxDist = qw.length <= 3 ? 1 : qw.length <= 6 ? 2 : 3;
            const dist = levenshtein(tw, qw);
            if (dist <= maxDist) { score += Math.max(1, 3 - dist); break; }
        }
    }
    return score;
}

function getMockInternships(query: string, category: string, state: string, mode: string) {
    let mocks = MOCK_INTERNSHIPS;

    if (category && category !== 'All') {
        mocks = mocks.filter(m => fuzzyMatch(m.category, category));
    }
    if (state) {
        // Fuzzy match on state, city, or location
        mocks = mocks.filter(m =>
            fuzzyMatch(m.state || '', state) ||
            fuzzyMatch(m.locationCity || '', state)
        );
    }
    if (mode) {
        mocks = mocks.filter(m => m.workMode === mode);
    }

    if (query) {
        // Build a searchable string per internship including skills and location
        const scored = mocks.map(m => {
            const skillNames = (m.skills || []).map((s: any) => s.name).join(' ');
            const location = `${m.locationCity || ''} ${m.state || ''}`;
            const searchFields = [
                { text: m.title, weight: 3 },
                { text: m.provider.companyName, weight: 2 },
                { text: m.category, weight: 2 },
                { text: skillNames, weight: 2.5 },
                { text: location, weight: 1.5 },
                { text: m.description, weight: 0.5 },
            ];

            let totalScore = 0;
            let matched = false;
            for (const field of searchFields) {
                if (fuzzyMatch(field.text, query)) {
                    matched = true;
                    totalScore += fuzzyScore(field.text, query) * field.weight;
                }
            }
            return { intern: m, score: totalScore, matched };
        });

        mocks = scored
            .filter(s => s.matched)
            .sort((a, b) => b.score - a.score)
            .map(s => s.intern);
    }

    return mocks.map((m, idx) => {
        const fakeScore = Math.max(0.65, 0.98 - (idx * 0.05));
        return {
            ...m,
            score: fakeScore,
            explanation: {
                reason: `Strong alignment with your profile based on ${m.category} skills. ${m.workMode === 'remote' ? 'Remote work available.' : 'Located in your preferred area.'}`,
                strategy: 'content_fallback'
            }
        };
    });
}

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
                let fetched = data.content || [];
                if (fetched.length === 0) {
                    fetched = getMockInternships(debouncedQuery, selectedCategory, selectedState, selectedWorkMode);
                }
                setInternships(fetched);
                setTotalPages(data.totalPages || (fetched.length > 0 ? 1 : 0));
            } catch (error) {
                console.error('Failed to fetch internships:', error);
                const mockFallback = getMockInternships(debouncedQuery, selectedCategory, selectedState, selectedWorkMode);
                setInternships(mockFallback);
                setTotalPages(mockFallback.length > 0 ? 1 : 0);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [debouncedQuery, selectedCategory, selectedState, selectedWorkMode, page]);

    return (
        <>
            {/* ── Hero Banner ────────────────────────────────── */}
            <div className="relative pt-28 pb-16 overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 35%, #4338ca 65%, #0891b2 100%)' }}>
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 3px 3px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-[80px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/15 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm font-medium backdrop-blur-sm mb-6">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            {internships.length} opportunities available
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
                            Browse <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-200">Internships</span>
                        </h1>
                        <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
                            Discover AI-matched opportunities tailored to your skills and interests across 500+ companies
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Search & Filters ───────────────────────────── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 mb-8">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6">
                    <div className="flex flex-col md:flex-row gap-4 mb-5">
                        <div className="flex-1 relative">
                            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 text-lg">
                                🔍
                            </span>
                            <input
                                type="text"
                                placeholder="Search by title, skills, location, or company..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base"
                            />
                        </div>

                        <select
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value)}
                            className="px-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 font-medium"
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
                            className="px-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 font-medium"
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
                                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${(selectedCategory === cat || (cat === 'All' && !selectedCategory))
                                    ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg shadow-primary-500/20'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Grid ───────────────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 animate-pulse">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                                    <div className="flex-1">
                                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                                    </div>
                                </div>
                                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                                <div className="flex gap-2">
                                    <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
                                    <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : internships.length === 0 ? (
                    <div className="text-center py-24 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <div className="text-7xl mb-6">🔍</div>
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-3">No internships found</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-lg mb-8 max-w-md mx-auto">
                            Try adjusting your search or filters to find what you're looking for.
                        </p>
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setSelectedCategory('');
                                setSelectedState('');
                                setSelectedWorkMode('');
                            }}
                            className="px-8 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-bold rounded-xl hover:shadow-lg transition-all hover:-translate-y-0.5"
                        >
                            Clear all filters
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                            {internships.map(intern => (
                                <Link key={intern.id} href={`/internships/${intern.id}`}>
                                    <div className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-2xl hover:shadow-primary-500/10 hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-500 hover:-translate-y-2 cursor-pointer h-full flex flex-col relative">
                                        {/* Gradient accent top */}
                                        <div className="h-1.5 bg-gradient-to-r from-primary-500 via-accent-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        
                                        <div className="p-6 flex flex-col h-full">
                                            {/* Header with company initial */}
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 flex items-center justify-center text-xl font-black text-primary-700 dark:text-primary-400 flex-shrink-0 border border-primary-200/50 dark:border-primary-800/50">
                                                    {intern.provider?.companyName?.charAt(0) || 'C'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-2 leading-snug">
                                                        {intern.title}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{intern.provider?.companyName}</p>
                                                        {intern.provider?.verified && (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                                                                ✓
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                                                {intern.description}
                                            </p>

                                            {/* Meta tags */}
                                            <div className="flex flex-wrap gap-1.5 mb-4">
                                                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border border-primary-100 dark:border-primary-900/30">
                                                    {intern.category}
                                                </span>
                                                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                                    {intern.workMode === 'remote' ? '🏠' : intern.workMode === 'hybrid' ? '🔄' : '🏢'} {intern.workMode}
                                                </span>
                                                {intern.locationCity && (
                                                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                                        📍 {intern.locationCity}
                                                    </span>
                                                )}
                                            </div>

                                            {/* AI Match Reason */}
                                            {intern.score && intern.explanation && (
                                                <div className="mb-4 mt-auto p-3 bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-indigo-950/20 dark:to-cyan-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wide flex items-center gap-1">
                                                            ✨ AI Match
                                                        </span>
                                                        <span className="text-sm font-black text-indigo-700 dark:text-indigo-400">
                                                            {Math.round(intern.score * 100)}%
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-indigo-100 dark:bg-indigo-900/50 rounded-full overflow-hidden mb-2">
                                                        <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all" style={{ width: `${Math.round(intern.score * 100)}%` }} />
                                                    </div>
                                                    <p className="text-xs text-indigo-800 dark:text-indigo-300 line-clamp-2 leading-relaxed">
                                                        {intern.explanation.reason}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Footer */}
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800 mt-auto">
                                                <div className="text-base font-black text-gray-900 dark:text-white">
                                                    {intern.stipendMin && intern.stipendMax
                                                        ? `₹${(intern.stipendMin / 1000).toFixed(0)}k – ₹${(intern.stipendMax / 1000).toFixed(0)}k`
                                                        : intern.stipendMin
                                                            ? `₹${(intern.stipendMin / 1000).toFixed(0)}k`
                                                            : 'Unpaid'}
                                                    <span className="font-normal text-gray-400 text-xs ml-1">/mo</span>
                                                </div>
                                                <span className="text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 rounded-lg group-hover:bg-primary-600 group-hover:text-white transition-colors">
                                                    View Details →
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-3">
                                <button
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                    className="px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold transition-colors"
                                >
                                    ← Previous
                                </button>
                                <span className="px-6 py-3 text-gray-500 dark:text-gray-400 font-medium">
                                    Page {page + 1} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                    disabled={page >= totalPages - 1}
                                    className="px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold transition-colors"
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}

export default function InternshipsPage() {
    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Suspense fallback={
                <div className="max-w-7xl mx-auto px-4 text-center py-40">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500 font-medium">Loading internships...</p>
                </div>
            }>
                <InternshipsContent />
            </Suspense>
        </main>
    );
}
