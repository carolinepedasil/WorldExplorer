'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { authApi } from '@/lib/api';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { token, setAuth, clearAuth, user } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const validateToken = async () => {
      const storedToken = localStorage.getItem('token');
      
      if (storedToken) {
        if (!user || !token) {
          try {
            const userData = await authApi.getCurrentUser();
            setAuth(userData, storedToken);
          } catch (error) {
            clearAuth();
          }
        }
      } else if (token) {
        clearAuth();
      }
    };

    validateToken();
  }, [isHydrated, user, token, setAuth, clearAuth]);

  return <>{children}</>;
}
