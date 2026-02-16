'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function RegisterPage() {
    const { register } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState({ email: '', password: '', fullName: '', role: 'student' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(form.email, form.password, form.fullName, form.role);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-accent-50 dark:from-gray-950 dark:to-accent-950 pt-16 px-4">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Account</h1>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">Start finding your perfect internship</p>
                    </div>

                    {error && (
                        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                            <input
                                type="text"
                                value={form.fullName}
                                onChange={e => setForm({ ...form, fullName: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                                placeholder="Your full name"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                            <input
                                type="password"
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                                placeholder="Min 8 characters"
                                minLength={8}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">I am a</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['student', 'provider'].map(role => (
                                    <button
                                        key={role}
                                        type="button"
                                        onClick={() => setForm({ ...form, role })}
                                        className={`py-3 rounded-xl text-sm font-medium border-2 transition-all ${form.role === role
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                                : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'
                                            }`}
                                    >
                                        {role === 'student' ? '🎓 Student' : '🏢 Provider'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}
