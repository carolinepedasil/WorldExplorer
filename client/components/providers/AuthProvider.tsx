'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { authApi } from '@/lib/api';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { token, setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem('token');
      
      if (storedToken && !token) {
        try {
          const user = await authApi.getCurrentUser();
          setAuth(user, storedToken);
        } catch (error) {
          clearAuth();
        }
      }
    };

    validateToken();
  }, [token, setAuth, clearAuth]);

  return <>{children}</>;
}
