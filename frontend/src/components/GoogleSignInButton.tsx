// ═══════════════════════════════════════════════════════════
// reBorn_i — Google Sign-In Button
// ═══════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Google Identity Services types
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

// Google Client ID from environment or hardcoded for dev
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

interface GoogleSignInButtonProps {
  onError?: (message: string) => void;
  className?: string;
}

export default function GoogleSignInButton({ onError, className }: GoogleSignInButtonProps) {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [gsiReady, setGsiReady] = useState(false);
  const [gsiError, setGsiError] = useState(false);

  useEffect(() => {
    // Wait for Google Identity Services to load
    let attempts = 0;
    const checkGSI = () => {
      if (window.google?.accounts?.id) {
        setGsiReady(true);
        return;
      }
      attempts++;
      if (attempts > 50) {
        // GSI script didn't load after ~5 seconds — skip silently
        setGsiError(true);
        return;
      }
      setTimeout(checkGSI, 100);
    };
    checkGSI();
  }, []);

  useEffect(() => {
    if (!gsiReady || !buttonRef.current || !GOOGLE_CLIENT_ID) return;

    try {
      window.google!.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: { credential: string }) => {
          setLoading(true);
          try {
            await googleLogin(response.credential);
            navigate('/dashboard');
          } catch (err: any) {
            const msg = err.message || 'Google sign-in failed';
            onError?.(msg);
          } finally {
            setLoading(false);
          }
        },
        auto_select: false,
        ux_mode: 'popup',
        // Add context and origin for better debugging
        context: 'signin',
        // Cancel callback for popup close
        cancel_on_tap_outside: false,
      });

      window.google!.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        width: 400,
        logo_alignment: 'left',
      });
    } catch (err) {
      // GSI initialization failed (e.g. origin not allowed) — log and hide button
      console.error('Google Sign-In initialization failed:', err);
      setGsiError(true);
    }
  }, [gsiReady, googleLogin, navigate, onError]);

  if (!GOOGLE_CLIENT_ID || gsiError) {
    return null; // Don't render if no client ID configured or GSI failed to load
  }

  return (
    <div className={className}>
      {loading && (
        <div className="flex items-center justify-center py-3">
          <div className="w-5 h-5 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
          <span className="ml-2 text-sm text-gray-400">Signing in with Google...</span>
        </div>
      )}
      <div
        ref={buttonRef}
        className={`flex justify-center ${loading ? 'hidden' : ''}`}
        style={{ colorScheme: 'auto' }}
      />
    </div>
  );
}
