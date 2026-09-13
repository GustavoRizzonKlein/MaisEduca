import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getSession, signIn, signOut, signUp } from '@/services/auth-service';
import type { PublicUser, UserRole } from '@/types/auth';

type AuthContextValue = {
  user: PublicUser | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, senha: string) => Promise<PublicUser>;
  register: (nome: string, email: string, senha: string, role: UserRole) => Promise<PublicUser>;
  logout: () => Promise<void>;
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
      register: async (nome, email, senha, role) => {
        setError(null);
        try {
          const registeredUser = await signUp(nome, email, senha, role);
          setUser(registeredUser);
          return registeredUser;
        } catch (registerError: unknown) {
          const message = registerError instanceof Error ? registerError.message : 'Não foi possível criar a conta.';
          setError(message);
          throw new Error(message);
        }
      },
      logout: async () => {
        await signOut();
        setUser(null);
        setError(null);
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
