"use client";

import { createContext, useCallback, useContext, useEffect, useReducer, useRef, type ReactNode } from "react";
import { AUTH_SESSION_KEY, AUTH_USERS_KEY, AuthError, authenticateAccount, registerAccount, restoreAuthSession, saveAuthSession, clearAuthSession, type AuthUser, type RegisterInput } from "@/lib/auth";

type AuthState = { user: AuthUser | null; hydrated: boolean };
type AuthContextValue = AuthState & {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth requires AuthProvider");
  return auth;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer((_: AuthState, next: AuthState) => next, { user: null, hydrated: false });
  const request = useRef(0);
  useEffect(() => {
    dispatch({ user: restoreAuthSession(), hydrated: true });
    function sync(event: StorageEvent) {
      if (event.key !== null && event.key !== AUTH_SESSION_KEY && event.key !== AUTH_USERS_KEY) return;
      request.current++;
      dispatch({ user: restoreAuthSession(), hydrated: true });
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const finishSignIn = useCallback((user: AuthUser, ticket: number) => {
    if (ticket !== request.current) throw new AuthError("Вход отменён. Попробуй ещё раз.");
    saveAuthSession(user);
    dispatch({ user, hydrated: true });
  }, []);
  const login = useCallback(async (email: string, password: string) => {
    const ticket = ++request.current;
    finishSignIn(await authenticateAccount(email, password), ticket);
  }, [finishSignIn]);
  const register = useCallback(async (input: RegisterInput) => {
    const ticket = ++request.current;
    finishSignIn(await registerAccount(input), ticket);
  }, [finishSignIn]);
  const logout = useCallback(() => {
    request.current++;
    clearAuthSession();
    dispatch({ user: null, hydrated: true });
  }, []);

  return <AuthContext.Provider value={{ ...state, isAuthenticated: state.user !== null, login, register, logout }}>{children}</AuthContext.Provider>;
}
