'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { shareApi, calendarApi, itineraryApi, type Event, type Itinerary } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function ItineraryPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [removingEventId, setRemovingEventId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch all itineraries for the user
  const { data: itineraries = [], isLoading } = useQuery<Itinerary[]>({
    queryKey: ['itineraries'],
    queryFn: itineraryApi.getAll,
    enabled: isAuthenticated,
  });

  // Get the first itinerary (or create one if none exists)
  const currentItinerary = itineraries[0] || null;

  // Create itinerary mutation
  const createItineraryMutation = useMutation({
    mutationFn: itineraryApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itineraries'] });
    },
  });

  // Remove event mutation
  const removeEventMutation = useMutation({
    mutationFn: ({ itineraryId, eventId }: { itineraryId: string; eventId: string }) =>
      itineraryApi.removeEvent(itineraryId, eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itineraries'] });
      setRemovingEventId(null);
    },
    onError: () => {
      setRemovingEventId(null);
    },
  });

  // Migrate data from localStorage to server on first load
  useEffect(() => {
    if (!isAuthenticated) return;

    const migrateFromLocalStorage = async () => {
      const saved = localStorage.getItem('itinerary');
      if (saved && itineraries.length === 0) {
        try {
          const localEvents = JSON.parse(saved) as any[];

          // Convert old format to new Event format
          const events: Event[] = localEvents.map((e) => ({
            id: e.id,
            name: e.name || 'Unnamed Event',
            date: e.start,
            url: e.url,
            imageUrl: e.imageUrl,
            description: e.description,
          }));

          // Create itinerary with migrated events
          await createItineraryMutation.mutateAsync({
            name: 'My Itinerary',
            events,
          });

          // Clear localStorage after successful migration
          localStorage.removeItem('itinerary');
        } catch (error) {
          console.error('Error migrating itinerary:', error);
        }
      }
    };

    migrateFromLocalStorage();
  }, [isAuthenticated, itineraries.length]);

  const handleShareItinerary = async () => {
    if (!currentItinerary) return;

    try {
      const { shareUrl: url } = await shareApi.createItineraryShare(currentItinerary.events);
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      alert('Itinerary link copied to clipboard!');
    } catch (error) {
      console.error('Error sharing itinerary:', error);
      alert('Failed to create shareable link. Please log in.');
    }
  };

  const handleExportICS = async () => {
    if (!currentItinerary) return;

    try {
      setExporting(true);
      const blob = await calendarApi.exportToICS(currentItinerary.events);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'itinerary.ics';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting calendar:', error);
      alert('Failed to export calendar. Please log in.');
    } finally {
      setExporting(false);
    }
  };

  const handleRemoveEvent = async (eventId: string) => {
    if (!currentItinerary) return;

    setRemovingEventId(eventId);
    try {
      await removeEventMutation.mutateAsync({
        itineraryId: currentItinerary._id,
        eventId,
      });
    } catch (error) {
      console.error('Error removing event:', error);
      alert('Failed to remove event');
      setRemovingEventId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Please Log In
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to be logged in to view your itinerary
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-gray-800 dark:text-white text-xl">Loading your itinerary...</div>
      </div>
    );
  }

  const events = currentItinerary?.events || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            {currentItinerary?.name || 'My Itinerary'}
          </h1>
          <div className="flex gap-3">
            <button
              onClick={handleShareItinerary}
              disabled={events.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Share Itinerary
            </button>
            <button
              onClick={handleExportICS}
              disabled={events.length === 0 || exporting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? 'Exporting...' : 'Export to Calendar'}
            </button>
          </div>
        </div>

        {shareUrl && (
          <div className="mb-4 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 px-4 py-3 rounded">
            Shareable link: <a href={shareUrl} className="underline">{shareUrl}</a>
          </div>
        )}

        {events.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">Your itinerary is empty</p>
            <button
              onClick={() => router.push('/events/search')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search Events
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((ev) => (
              <div key={ev.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
                {ev.imageUrl && (
                  <img
                    src={ev.imageUrl}
                    alt={ev.name || 'Event image'}
                    className="w-full h-48 object-cover rounded-lg mb-3"
                    loading="lazy"
                  />
                )}
                <div className="text-lg font-semibold text-gray-800 dark:text-white">
                  {ev.name}
                </div>
                {ev.date && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(ev.date).toLocaleString()}
                  </div>
                )}
                {ev.venue && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {ev.venue}
                    {ev.city && `, ${ev.city}`}
                    {ev.state && `, ${ev.state}`}
                  </div>
                )}
                {ev.description && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">
                    {ev.description}
                  </p>
                )}
                <div className="mt-3 flex gap-3">
                  {ev.url && (
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Event
                    </a>
                  )}
                  <button
                    onClick={() => handleRemoveEvent(ev.id)}
                    disabled={removingEventId === ev.id}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {removingEventId === ev.id ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
