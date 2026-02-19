'use client';

import { useParams } from 'next/navigation';
import ApplicationList from '@/components/provider/ApplicationList';
import Link from 'next/link';

export default function ApplicationsPage() {
    const { id } = useParams();

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <Link href="/provider/dashboard" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4 inline-block">
                    ← Back to Dashboard
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Internship Applications</h1>
            </div>
            <ApplicationList internshipId={id as string} />
        </div>
    );
}
