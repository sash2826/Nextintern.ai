'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import ProviderStats from '@/components/provider/ProviderStats';
import InternshipList from '@/components/provider/InternshipList';
import Link from 'next/link';

export default function ProviderDashboardPage() {
    const [internships, setInternships] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const data = await api.getProviderInternships();
                setInternships(data.content || []);
            } catch (error) {
                console.error('Failed to load internships', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="h-10 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg animate-shimmer" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-shimmer" />)}
                </div>
                <div className="space-y-4">
                    {[1, 2].map((i) => <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-shimmer" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Provider Dashboard</h1>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">Manage your internships and track applications.</p>
                </div>
                <Link href="/provider/internships/new"
                    className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-primary-500/25 hover:-translate-y-0.5">
                    + Post Internship
                </Link>
            </div>

            <ProviderStats internships={internships} />
            <InternshipList internships={internships} />
        </div>
    );
}
