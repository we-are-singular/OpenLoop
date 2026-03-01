import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';

interface AuthContextType {
  user: any | null;
  session: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const supabaseUrl = typeof window !== 'undefined' ? (window as any).ENV?.PUBLIC_SUPABASE_URL : '';
const supabaseAnonKey = typeof window !== 'undefined' ? (window as any).ENV?.PUBLIC_SUPABASE_ANON_KEY : '';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      const stored = localStorage.getItem('sb_session');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.access_token) {
            // Create client with the stored token
            const supabase = createClient(
              import.meta.env.PUBLIC_SUPABASE_URL || '',
              import.meta.env.PUBLIC_SUPABASE_ANON_KEY || ''
            );

            const { data: { session: validSession }, error } = await supabase.auth.setSession({
              access_token: parsed.access_token,
              refresh_token: ''
            });

            if (!error && validSession) {
              setSession(validSession);
              setUser(validSession.user);
            } else {
              localStorage.removeItem('sb_session');
            }
          }
        } catch (e) {
          localStorage.removeItem('sb_session');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const signOut = async () => {
    const supabase = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL || '',
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY || ''
    );
    await supabase.auth.signOut();
    localStorage.removeItem('sb_session');
    setUser(null);
    setSession(null);
    window.location.href = '/admin/login';
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
