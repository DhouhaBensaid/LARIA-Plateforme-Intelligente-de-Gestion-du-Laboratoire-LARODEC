/**
 * Auth context — backed by the Express API + JWT stored in localStorage.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi } from "./api";

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
const TOKEN_KEY = "larodec_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from stored token
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setIsLoading(false); return; }
    authApi.me()
      .then((user) => setSession({ user }))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const { token, user } = await authApi.login(email, password);
      localStorage.setItem(TOKEN_KEY, token);
      setSession({ user });
      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
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
