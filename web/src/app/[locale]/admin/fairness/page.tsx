'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

function MetricCard({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
            <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white drop-shadow-sm">{value}</div>
            {subtitle && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>}
        </div>
    );
}

function DominanceBadge({ risk }: { risk: string }) {
    const colors = {
        low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
        medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
        high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
    };
    const colorClass = colors[risk.toLowerCase() as keyof typeof colors] || colors.low;

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${colorClass} uppercase tracking-wider shadow-sm`}>
            Risk: {risk}
        </span>
    );
}

export default function FairnessDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.getAdminFairnessStats()
            .then((data: any) => setStats(data))
            .catch((err: any) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="h-10 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl" />)}
                </div>
                <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="text-4xl mb-3">⚠️</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Failed to load fairness stats</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2">{error || "Unknown error occurred."}</p>
            </div>
        );
    }

    const { catalog, exposure } = stats;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white drop-shadow-sm flex items-center gap-3">
                        <span className="text-4xl">⚖️</span> Fairness & Dominance
                    </h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
                        Monitor provider representation in the catalog and exposure rates through the recommendation engine. Higher Gini coefficients indicate growing monopoly risks.
                    </p>
                </div>
                <div>
                    <DominanceBadge risk={exposure.dominance_risk} />
                </div>
            </div>

            {/* Catalog Metrics Grid */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Catalog Representation</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        title="Total Providers"
                        value={catalog.total_active_providers}
                    />
                    <MetricCard
                        title="Avg Internships"
                        value={catalog.avg_internships_per_provider}
                        subtitle="per provider"
                    />
                    <MetricCard
                        title="Most Dominant"
                        value={catalog.max_internships_per_provider}
                        subtitle="max internships by one provider"
                    />
                    <MetricCard
                        title="Gini Coefficient"
                        value={catalog.gini_coefficient}
                        subtitle="0 = perfect equality, 1 = monopoly"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top 5 Providers Table */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Top 5 Dominant Providers</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Based on active internship counts</p>
                    </div>
                    <div className="p-0 overflow-x-auto flex-1">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
                                <tr>
                                    <th className="px-6 py-3 font-semibold">Rank</th>
                                    <th className="px-6 py-3 font-semibold">Provider ID</th>
                                    <th className="px-6 py-3 font-semibold text-right">Internships</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {catalog.top_5_providers.length > 0 ? catalog.top_5_providers.map((p: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">#{idx + 1}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono text-xs">{p.provider_id}</td>
                                        <td className="px-6 py-4 text-right font-bold text-primary-600 dark:text-primary-400">{p.count}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">No active providers found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Exposure Metrics */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Exposure & Recommendation Fairness</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Metrics based on logged AI recommendations</p>

                    <div className="flex-1 flex flex-col justify-center space-y-8">
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Top Provider Exposure Share</span>
                                <span className="text-2xl font-bold text-gray-900 dark:text-white drop-shadow-sm">{(exposure.top_provider_share * 100).toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                                <div
                                    className="bg-primary-600 h-3 rounded-full"
                                    style={{ width: `${exposure.top_provider_share * 100}%` }}
                                    title={`${(exposure.top_provider_share * 100).toFixed(1)}% share`}
                                ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Percentage of all recommendations given to the single largest provider.</p>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Herfindahl-Hirschman Index (HHI)</span>
                            <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{exposure.hhi_index.toFixed(3)}</div>
                            <p className="text-xs text-gray-500 mt-1">Measure of market concentration based on exposure. Higher indicates fewer providers receive most recommendations.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
