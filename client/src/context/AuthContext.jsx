import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { authApi, isDemoMode, signOutApiSession, switchDemoRoleSession } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode) {
      authApi
        .me()
        .then((res) => setUser(res.data.data))
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
      return () => {};
    }

    if (!auth) {
      setUser(null);
      setLoading(false);
      return () => {};
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const res = await authApi.me();
        setUser(res.data.data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    const { user: u } = res.data.data;
    setUser(u);
    return u;
  };

  const setSession = (nextUser) => {
    if (nextUser) setUser(nextUser);
  };

  const logout = async () => {
    await signOutApiSession();
    setUser(null);
  };

  const refreshUser = async () => {
    const res = await authApi.me();
    const u = res.data.data;
    setUser(u);
    return u;
  };

  const switchDemoRole = async (role) => {
    if (!isDemoMode) return null;
    switchDemoRoleSession(role);
    return refreshUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, setSession, logout, refreshUser, isDemoMode, switchDemoRole }}>
      {children}
    </AuthContext.Provider>
  );
}

/* eslint-disable react-refresh/only-export-components */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
