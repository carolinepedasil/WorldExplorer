'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  userApi,
  itineraryApi,
  shareApi,
  type Itinerary,
  type Event,
} from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export const dynamic = 'force-dynamic';

type SharedLink = {
  _id: string;
  type: 'event' | 'itinerary';
  token: string;
  eventName?: string;
  itineraryData?: { events: any[] };
  createdAt: string;
  isRevoked: boolean;
  accessCount: number;
};

function getUpcomingEvents(itineraries: Itinerary[], limit = 3): Event[] {
  const now = new Date();

  const allEvents: Event[] = itineraries.flatMap((it) =>
    it.events.map((e) => ({ ...e, itineraryName: it.name as any })),
  );

  const withDate = allEvents
    .map((e) => {
      const d = e.date ? new Date(e.date) : null;
      return { event: e, date: d };
    })
    .filter((x) => x.date && !Number.isNaN(x.date!.getTime()) && x.date! >= now);

  withDate.sort((a, b) => a.date!.getTime() - b.date!.getTime());

  return withDate.slice(0, limit).map((x) => x.event);
}

export default function DashboardPage() {
  const router = useRouter();
  const { user: authUser, isAuthenticated, clearAuth } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [isHydrated, isAuthenticated, router]);

  const {
    data: profile,
    isLoading: isProfileLoading,
  } = useQuery({
    queryKey: ['profile'],
    queryFn: userApi.getProfile,
    enabled: isHydrated && isAuthenticated,
  });

  const {
    data: itineraries = [],
    isLoading: isItinerariesLoading,
  } = useQuery<Itinerary[]>({
    queryKey: ['dashboard-itineraries'],
    queryFn: itineraryApi.getAll,
    enabled: isHydrated && isAuthenticated,
  });

  const {
    data: sharedLinks = [],
    isLoading: isLinksLoading,
  } = useQuery<SharedLink[]>({
    queryKey: ['dashboard-shared-links'],
    queryFn: shareApi.getUserLinks,
    enabled: isHydrated && isAuthenticated,
  });

  const isLoading = isProfileLoading || isItinerariesLoading || isLinksLoading;

  const stats = useMemo(() => {
    const totalItineraries = itineraries.length;
    const totalEvents = itineraries.reduce(
      (sum, it) => sum + (it.events?.length || 0),
      0,
    );

    const upcomingEvents = getUpcomingEvents(itineraries, 999);
    const upcomingCount = upcomingEvents.length;

    const uniqueCountries = new Set(
      itineraries.flatMap((it) =>
        it.events
          .map((e) => e.country)
          .filter((c): c is string => Boolean(c)),
      ),
    ).size;

    const activeLinks = (sharedLinks as SharedLink[]).filter(
      (l) => !l.isRevoked,
    ).length;

    return {
      totalItineraries,
      totalEvents,
      upcomingCount,
      uniqueCountries,
      activeLinks,
      upcomingEvents: upcomingEvents.slice(0, 3),
    };
  }, [itineraries, sharedLinks]);

  const recentItineraries = useMemo(() => {
    return [...itineraries]
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .slice(0, 3);
  }, [itineraries]);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const goToCountries = () => router.push('/countries');
  const goToSearch = () => router.push('/events/search');
  const goToItinerary = () => router.push('/itinerary');
  const goToManageLinks = () => router.push('/manage-links');

  if (!isHydrated) return null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <p className="text-gray-700 dark:text-gray-200 text-lg">
          Redirecting to login...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome back,{' '}
              <span className="font-semibold">
                {profile?.displayName || profile?.username || authUser?.username}
              </span>
              . Here&apos;s an overview of your trips.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {profile?.avatar && (
                <img
                  src={profile.avatar}
                  alt={profile.username}
                  className="w-20 h-20 rounded-full object-cover"
                />
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {profile?.displayName || profile?.username}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {profile?.email}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Login provider:{' '}
                  <span className="font-medium">{profile?.provider}</span>
                </p>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Itineraries
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.totalItineraries}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  You can create multiple trips for different destinations.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Saved events
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.totalEvents}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  All activities added across your itineraries.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Upcoming events
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.upcomingCount}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Events with a date in the future.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Active share links
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.activeLinks}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Links you can send to friends.
                </p>
              </div>
            </section>

            <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick actions
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <button
                  onClick={goToCountries}
                  className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Explore Countries
                </button>
                <button
                  onClick={goToSearch}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Search Events
                </button>
                <button
                  onClick={goToItinerary}
                  className="px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  View Itineraries
                </button>
                <button
                  onClick={goToManageLinks}
                  className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Manage Shared Links
                </button>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Next upcoming events
                </h3>
                {stats.upcomingEvents.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You don&apos;t have any upcoming events yet. Try adding some
                    activities to your itineraries.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {stats.upcomingEvents.map((event) => (
                      <li
                        key={event.id}
                        className="flex items-start justify-between gap-3"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {event.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {event.city && event.country
                              ? `${event.city}, ${event.country}`
                              : event.country || 'Location TBA'}
                          </p>
                          {event.date && (
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {new Date(event.date).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Recent itineraries
                </h3>
                {recentItineraries.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You don&apos;t have any itineraries yet. Start by creating
                    your first one from the itineraries page.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {recentItineraries.map((itinerary) => (
                      <li
                        key={itinerary._id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {itinerary.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {itinerary.events.length} events ·{' '}
                            {new Date(
                              itinerary.updatedAt,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => router.push('/itinerary')}
                          className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        >
                          Open
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
