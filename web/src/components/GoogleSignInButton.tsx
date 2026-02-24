'use client';

import { useEffect, useRef, useCallback } from 'react';

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: any) => void;
                    renderButton: (element: HTMLElement, config: any) => void;
                    prompt: () => void;
                };
            };
        };
    }
}

interface GoogleSignInButtonProps {
    onSuccess: (idToken: string) => void;
    onError?: (error: string) => void;
    text?: 'signin_with' | 'signup_with' | 'continue_with';
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function GoogleSignInButton({ onSuccess, onError, text = 'signin_with' }: GoogleSignInButtonProps) {
    const buttonRef = useRef<HTMLDivElement>(null);
    const scriptLoaded = useRef(false);

    const handleCredentialResponse = useCallback((response: any) => {
        if (response.credential) {
            onSuccess(response.credential);
        } else {
            onError?.('No credential received from Google');
        }
    }, [onSuccess, onError]);

    useEffect(() => {
        const initializeGoogle = () => {
            if (!window.google || !buttonRef.current || !GOOGLE_CLIENT_ID) return;

            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleCredentialResponse,
                auto_select: false,
                cancel_on_tap_outside: true,
            });

            window.google.accounts.id.renderButton(buttonRef.current, {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                text: text,
                width: '100%',
                shape: 'pill',
                logo_alignment: 'left',
            });
        };

        // If script already loaded
        if (window.google) {
            initializeGoogle();
            return;
        }

        // Load script if not already loading
        if (!scriptLoaded.current) {
            scriptLoaded.current = true;
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = initializeGoogle;
            script.onerror = () => onError?.('Failed to load Google Sign-In');
            document.head.appendChild(script);
        }
    }, [handleCredentialResponse, text, onError]);

    if (!GOOGLE_CLIENT_ID) {
        return null; // Don't render if no client ID configured
    }

    return (
        <div className="w-full flex justify-center">
            <div ref={buttonRef} className="w-full" style={{ minHeight: '44px' }} />
        </div>
    );
}
