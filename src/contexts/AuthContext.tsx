'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface AuthUser {
  uid: string;
  displayName: string;
  name?: string;
  email: string;
  emailVerified: boolean;
  photoURL?: string;
  image?: string;
  role?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  role: string | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const applyUserData = useCallback((data: { user: { uid: string; name?: string; email: string; emailVerified?: boolean; image?: string } | null; role: string | null }) => {
    if (data.user) {
      const authUser: AuthUser = {
        uid: data.user.uid,
        displayName: data.user.name || data.user.email?.split('@')[0] || 'User',
        name: data.user.name,
        email: data.user.email,
        emailVerified: Boolean(data.user.emailVerified),
        photoURL: data.user.image,
        image: data.user.image,
        role: data.role || 'participant',
      };
      setUser(authUser);
      setRole(data.role || 'participant');
    } else {
      setUser(null);
      setRole(null);
    }
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = res.ok ? await res.json() : { user: null, role: null };
      applyUserData(data);
    } catch (err) {
      console.error('Error checking user session:', err);
      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, [applyUserData]);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { user: null, role: null }))
      .then((data) => {
        if (!isMounted) return;
        applyUserData(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error checking user session:', err);
        setUser(null);
        setRole(null);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [applyUserData]);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setRole(null);
    }
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
