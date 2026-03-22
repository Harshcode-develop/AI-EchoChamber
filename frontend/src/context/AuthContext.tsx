import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../services/supabase';
import type { User, AuthState } from '../types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isGuest: true,
  remainingGenerations: 1,
  isLoading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  loginWithGoogle: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isGuest: true,
    remainingGenerations: 1,
    isLoading: true,
  });

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u: User = {
          id: session.user.id,
          email: session.user.email || '',
          remaining_generations: 2,
        };
        localStorage.setItem('sb-access-token', session.access_token);
        setState({ user: u, isGuest: false, remainingGenerations: 2, isLoading: false });
      } else {
        setState((s) => ({ ...s, isLoading: false }));
      }
    }).catch(() => {
      // Supabase not configured, continue as guest
      setState((s) => ({ ...s, isLoading: false }));
    });

    // Listen for auth changes
    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const u: User = {
            id: session.user.id,
            email: session.user.email || '',
            remaining_generations: 2,
          };
          localStorage.setItem('sb-access-token', session.access_token);
          setState({ user: u, isGuest: false, remainingGenerations: 2, isLoading: false });
        } else {
          localStorage.removeItem('sb-access-token');
          setState({ user: null, isGuest: true, remainingGenerations: 1, isLoading: false });
        }
      });
      subscription = data.subscription;
    } catch {
      // Supabase not available
    }

    return () => subscription?.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signup = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: window.location.origin
      }
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
