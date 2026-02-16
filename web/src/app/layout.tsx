import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth';
import { Navbar } from '@/components/Navbar';
import './globals.css';

export const metadata: Metadata = {
    title: 'NextIntern.ai — Smart Internship Matching',
    description: 'AI-powered internship recommendations with explainability and fairness. Find your perfect internship match.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <AuthProvider>
                    <Navbar />
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
