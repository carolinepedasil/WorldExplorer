'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import { userApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const router = useRouter();
  const { user: authUser, isAuthenticated, clearAuth } = useAuthStore();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: userApi.getProfile,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  const goToSearch = () => {
    router.push('/events/search');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <nav className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">WorldExplorer</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Dashboard</h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                {profile?.avatar && (
                  <img
                    src={profile.avatar}
                    alt={profile.username}
                    className="w-20 h-20 rounded-full"
                  />
                )}
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {profile?.displayName || profile?.username}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">{profile?.email}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Login provider: {profile?.provider}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                  Welcome to WorldExplorer!
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  You're now logged in and can start exploring. This is your dashboard where you can manage your profile and activities.
                </p>

                <div className="mt-6">
                  <button
                    onClick={goToSearch}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Search destinations & events
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
