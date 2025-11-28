'use client';

import { useQuery } from '@tanstack/react-query';
import { healthApi } from '@/lib/api';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function Home() {
  const { data: health, isLoading } = useQuery({
    queryKey: ['health'],
    queryFn: healthApi.check,
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="flex flex-col items-center gap-8 px-8 py-16 text-center">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            WorldExplorer
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl">
            Search events, build custom itineraries, and share your adventures with friends.
            All in one simple dashboard.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 mt-8">
          {isLoading ? (
            <p className="text-gray-500">Checking server status...</p>
          ) : health ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900 rounded-full">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-700 dark:text-green-300 font-medium">
                {health.message}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900 rounded-full">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-red-700 dark:text-red-300 font-medium">
                Server offline
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link
            href="/login"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Get Started
          </Link>
          <Link
            href="/countries"
            className="px-8 py-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700"
          >
            Browse Countries
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <div className="text-3xl mb-3">🌍</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Explore</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Discover amazing places and hidden gems around the world
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <div className="text-3xl mb-3">🤝</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Connect</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Meet fellow explorers and share your experiences
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <div className="text-3xl mb-3">📝</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Plan</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Turn ideas into structured itineraries with events
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
