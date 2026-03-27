'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import GoogleSignInButton from '@/components/GoogleSignInButton';

export default function RegisterPage() {
    const { register, googleLogin } = useAuth();
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

    const handleGoogleSuccess = async (idToken: string) => {
        setError('');
        setLoading(true);
        try {
            await googleLogin(idToken, form.role);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Google sign-up failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex">
            {/* ── Left Panel: Branding ─────────────────────────── */}
            <div
                className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-16 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4338ca 60%, #0891b2 100%)' }}
            >
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 3px 3px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
                <div className="absolute top-20 -left-20 w-80 h-80 bg-emerald-400/20 rounded-full blur-[80px] animate-pulse" />
                <div className="absolute bottom-20 -right-20 w-96 h-96 bg-violet-400/20 rounded-full blur-[100px]" />

                <div className="relative z-10 max-w-lg text-center">
                    <img src="/nextintern-logo-transparent.png" alt="NextIntern.ai" className="h-24 w-auto mx-auto mb-10 drop-shadow-2xl" />

                    <h2 className="text-4xl font-black text-white mb-6 tracking-tight leading-tight">
                        Launch Your<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-200">
                            Dream Career
                        </span>
                    </h2>

                    <p className="text-lg text-white/70 leading-relaxed mb-12">
                        Join thousands of ambitious students who found their perfect internship through AI-powered matching. It only takes 2 minutes.
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-6 mb-12">
                        {[
                            { value: '10k+', label: 'Students' },
                            { value: '5k+', label: 'Internships' },
                            { value: '94%', label: 'Match Rate' },
                        ].map(s => (
                            <div key={s.label} className="p-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm">
                                <div className="text-2xl font-black text-white">{s.value}</div>
                                <div className="text-xs text-white/60 font-medium mt-1">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Benefits list */}
                    <div className="text-left space-y-4">
                        {[
                            '✨ AI-powered skill matching',
                            '📊 Transparent recommendation explanations',
                            '🚀 Access to 500+ top companies',
                        ].map(b => (
                            <div key={b} className="flex items-center gap-3 text-white/80 text-base">
                                <span>{b}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Right Panel: Form ───────────────────────────── */}
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-6 py-12">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-8">
                        <img src="/nextintern-logo-transparent.png" alt="NextIntern.ai" className="h-16 w-auto mx-auto mb-4" />
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl shadow-primary-500/5 border border-gray-200 dark:border-gray-800 p-8 md:p-10">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Create Account</h1>
                            <p className="mt-2 text-gray-500 dark:text-gray-400">Start finding your perfect internship</p>
                        </div>

                        {error && (
                            <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        {/* Role selector */}
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">I am a</label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { value: 'student', icon: '🎓', label: 'Student' },
                                    { value: 'provider', icon: '🏢', label: 'Provider' },
                                ].map(role => (
                                    <button
                                        key={role.value}
                                        type="button"
                                        onClick={() => setForm({ ...form, role: role.value })}
                                        className={`py-3.5 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${form.role === role.value
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shadow-md shadow-primary-500/10'
                                            : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }`}
                                    >
                                        <span className="text-lg">{role.icon}</span> {role.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Google Sign-Up */}
                        <div className="mb-6">
                            <GoogleSignInButton
                                onSuccess={handleGoogleSuccess}
                                onError={(err) => setError(err)}
                                text="signup_with"
                            />
                        </div>

                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 font-medium">or sign up with email</span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={form.fullName}
                                    onChange={e => setForm({ ...form, fullName: e.target.value })}
                                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-base"
                                    placeholder="Your full name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-base"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Password</label>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-base"
                                    placeholder="Min 8 characters"
                                    minLength={8}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold text-lg rounded-xl transition-all shadow-lg hover:shadow-xl hover:shadow-primary-500/20 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                        Creating account…
                                    </span>
                                ) : 'Create Account 🚀'}
                            </button>
                        </form>

                        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                            Already have an account?{' '}
                            <Link href="/login" className="text-primary-600 hover:text-primary-700 font-bold">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
