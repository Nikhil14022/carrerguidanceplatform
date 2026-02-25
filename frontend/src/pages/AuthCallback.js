import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AuthCallback() {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const sessionId = params.get('session_id');

    if (!sessionId) {
      toast.error("Authentication failed");
      navigate('/', { replace: true });
      return;
    }

    const exchangeSession = async () => {
      try {
        console.log('Exchanging session_id for session_token...');
        const response = await fetch(`${API}/auth/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ session_id: sessionId })
        });

        const data = await response.json();
        
        if (!response.ok) {
          console.error('Session exchange failed:', response.status, data);
          throw new Error(data.detail || `Session exchange failed: ${response.status}`);
        }

        console.log('Session exchange successful, user:', data.user);
        toast.success(`Welcome back, ${data.user.name}!`);
        navigate('/dashboard', { replace: true, state: { user: data.user } });
      } catch (error) {
        console.error('Auth error:', error);
        toast.error(`Authentication failed: ${error.message}`);
        navigate('/', { replace: true });
      }
    };

    exchangeSession();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
}
