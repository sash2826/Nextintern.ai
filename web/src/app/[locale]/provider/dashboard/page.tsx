'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import ProviderStats from '@/components/provider/ProviderStats';
import InternshipList from '@/components/provider/InternshipList';

export default function ProviderDashboardPage() {
    const [internships, setInternships] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const data = await api.getProviderInternships();
                // API returns Page object with 'content' array
                setInternships(data.content || []);
            } catch (error) {
                console.error('Failed to load internships', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) return <div className="p-10 text-center">Loading dashboard...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Provider Dashboard</h1>
                <p className="mt-2 text-gray-500 dark:text-gray-400">Manage your internships and track applications.</p>
            </div>

            <ProviderStats internships={internships} />
            <InternshipList internships={internships} />
        </div>
    );
}
