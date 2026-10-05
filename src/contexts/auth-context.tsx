import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  getSession,
  requestPasswordReset as sendPasswordResetEmail,
  signIn,
  signOut,
} from '@/services/auth-service';
import type { PublicUser } from '@/types/auth';

type AuthContextValue = {
  user: PublicUser | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, senha: string) => Promise<PublicUser>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSession()
      .then(setUser)
      .catch((sessionError: unknown) => {
        setError(sessionError instanceof Error ? sessionError.message : 'Não foi possível carregar a sessão.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      error,
      login: async (email, senha) => {
        setError(null);
        try {
          const authenticatedUser = await signIn(email, senha);
          setUser(authenticatedUser);
          return authenticatedUser;
        } catch (loginError: unknown) {
          const message = loginError instanceof Error ? loginError.message : 'Não foi possível entrar.';
          setError(message);
          throw new Error(message);
        }
      },
      logout: async () => {
        try {
          await signOut();
          setError(null);
        } catch (logoutError: unknown) {
          setError(logoutError instanceof Error ? logoutError.message : 'Não foi possível sair.');
        } finally {
          setUser(null);
        }
      },
      requestPasswordReset: async (email) => {
        setError(null);
        try {
          await sendPasswordResetEmail(email);
        } catch (resetError: unknown) {
          const message =
            resetError instanceof Error ? resetError.message : 'Não foi possível enviar o e-mail de redefinição.';
          setError(message);
          throw new Error(message);
        }
      },
      clearError: () => setError(null),
    }),
    [error, isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }
  return context;
}
