'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useState } from 'react';

export function Navbar() {
    const { user, logout, loading } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">NI</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                            Next<span className="text-primary-600 dark:text-primary-400">Intern</span>
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link href="/internships" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors">
                            Browse
                        </Link>
                        {user?.role === 'student' && (
                            <Link href="/dashboard" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors">
                                Dashboard
                            </Link>
                        )}
                        {!loading && (
                            user ? (
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">{user.fullName}</span>
                                    <button
                                        onClick={logout}
                                        className="text-sm px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-colors"
                                    >
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Link href="/login" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors">
                                        Login
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="text-sm px-5 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition-all shadow-sm hover:shadow-md"
                                    >
                                        Get Started
                                    </Link>
                                </div>
                            )
                        )}
                    </div>

                    {/* Mobile toggle */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {menuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile Menu */}
                {menuOpen && (
                    <div className="md:hidden pb-4 space-y-2">
                        <Link href="/internships" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                            Browse Internships
                        </Link>
                        {user?.role === 'student' && (
                            <Link href="/dashboard" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                                Dashboard
                            </Link>
                        )}
                        {!user && (
                            <>
                                <Link href="/login" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                                    Login
                                </Link>
                                <Link href="/register" className="block px-3 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white text-center">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}
