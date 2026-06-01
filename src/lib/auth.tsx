/**
 * Auth context — backed by the Express API + JWT stored in localStorage.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi, setTokens, clearTokens, getToken } from "./api";

export interface Session {
  user: {
    id: number;
    email: string;
    role: "admin" | "chercheur" | "admin+chercheur";
    nom: string;
    prenom: string;
    cin: string;
    etablissement: string;
    universite: string;
    grade: string;
    telephone?: string;
    google_scholar_url?: string;
    orcid?: string;
  };
}

interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
  updateProfile: (patch: Partial<Session["user"]>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from stored access token
  useEffect(() => {
    const token = getToken();
    if (!token) { setIsLoading(false); return; }
    authApi.me()
      .then((user) => setSession({ user }))
      .catch(() => clearTokens())
      .finally(() => setIsLoading(false));
  }, []);

  // Listen for forced logout (session expired after failed refresh)
  useEffect(() => {
    const handler = () => { setSession(null); };
    window.addEventListener("larodec_session_expired", handler);
    return () => window.removeEventListener("larodec_session_expired", handler);
  }, []);

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const data = await authApi.login(email, password);
      // Support both old { token } and new { access_token, refresh_token } shapes
      const access  = data.access_token  ?? data.token;
      const refresh = data.refresh_token ?? data.token;
      setTokens(access, refresh);
      setSession({ user: data.user });
      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const logout = () => {
    clearTokens();
    setSession(null);
  };

  const updateProfile = async (patch: Partial<Session["user"]>) => {
    const updated = await authApi.updateMe(patch as any);
    setSession({ user: updated });
  };

  return (
    <AuthContext.Provider value={{ session, isLoading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
