'use client';

import { useAuth } from '@/lib/auth';
import StudentDashboard from '@/components/dashboard/StudentDashboard';
import ProviderDashboard from '@/components/dashboard/ProviderDashboard';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!user) return null; // Will redirect

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20">
            {user.role === 'PROVIDER' ? <ProviderDashboard /> : <StudentDashboard />}
        </main>
    );
}
