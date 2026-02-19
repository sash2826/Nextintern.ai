'use client';

import CreateInternshipForm from '@/components/provider/CreateInternshipForm';

export default function NewInternshipPage() {
    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create New Internship</h1>
            <CreateInternshipForm />
        </div>
    );
}
