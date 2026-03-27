'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import GoogleSignInButton from '@/components/GoogleSignInButton';

export default function LoginPage() {
    const { login, googleLogin } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (idToken: string) => {
        setError('');
        setLoading(true);
        try {
            await googleLogin(idToken);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Google sign-in failed');
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
                {/* Decorative elements */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 3px 3px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
                <div className="absolute top-20 -left-20 w-80 h-80 bg-cyan-400/20 rounded-full blur-[80px] animate-pulse" />
                <div className="absolute bottom-20 -right-20 w-96 h-96 bg-indigo-400/20 rounded-full blur-[100px]" />
                
                <div className="relative z-10 max-w-lg text-center">
                    <img src="/nextintern-logo-transparent.png" alt="NextIntern.ai" className="h-24 w-auto mx-auto mb-10 drop-shadow-2xl" />
                    
                    <h2 className="text-4xl font-black text-white mb-6 tracking-tight leading-tight">
                        Your Career Journey<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-200">
                            Starts Here
                        </span>
                    </h2>
                    
                    <p className="text-lg text-white/70 leading-relaxed mb-12">
                        AI-powered internship matching that understands your skills, interests, and aspirations to find opportunities that truly fit you.
                    </p>

                    {/* Feature pills */}
                    <div className="flex flex-wrap gap-3 justify-center">
                        {['🤖 AI Recommendations', '📊 Skill Matching', '💡 Explainable AI', '🚀 10k+ Students'].map(f => (
                            <span key={f} className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm font-medium backdrop-blur-sm">
                                {f}
                            </span>
                        ))}
                    </div>

                    {/* Testimonial */}
                    <div className="mt-16 p-6 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md text-left">
                        <p className="text-white/90 text-base italic leading-relaxed mb-4">
                            "NextIntern.ai matched me with an internship that perfectly aligned with my ML skills. The AI explanations helped me understand exactly why each role was recommended."
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                                RS
                            </div>
                            <div>
                                <p className="text-white font-semibold text-sm">Rahul S.</p>
                                <p className="text-white/50 text-xs">ML Intern at Google DeepMind</p>
                            </div>
                        </div>
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
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Welcome back</h1>
                            <p className="mt-2 text-gray-500 dark:text-gray-400">Sign in to your NextIntern account</p>
                        </div>

                        {error && (
                            <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        {/* Google Sign-In */}
                        <div className="mb-6">
                            <GoogleSignInButton
                                onSuccess={handleGoogleSuccess}
                                onError={(err) => setError(err)}
                                text="signin_with"
                            />
                        </div>

                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 font-medium">or sign in with email</span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-base"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-base"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold text-lg rounded-xl transition-all shadow-lg hover:shadow-xl hover:shadow-primary-500/20 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                        Signing in…
                                    </span>
                                ) : 'Sign In'}
                            </button>
                        </form>

                        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                            Don't have an account?{' '}
                            <Link href="/register" className="text-primary-600 hover:text-primary-700 font-bold">
                                Sign up
                            </Link>
                        </p>

                        {/* Demo credentials hint */}
                        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-indigo-950/30 dark:to-cyan-950/30 border border-indigo-100 dark:border-indigo-900/30">
                            <p className="font-bold text-xs text-indigo-700 dark:text-indigo-300 mb-1.5 flex items-center gap-1">
                                <span>🔑</span> Demo Credentials
                            </p>
                            <div className="space-y-1 text-xs text-indigo-600 dark:text-indigo-400">
                                <p><span className="font-semibold">Student:</span> student@demo.com / Demo@1234</p>
                                <p><span className="font-semibold">Provider:</span> provider@techcorp.com / Demo@1234</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
