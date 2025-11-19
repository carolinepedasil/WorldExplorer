'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toSearchParams } from '@/lib/url';
import { eventsApi, shareApi, itineraryApi, type Event } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import EventModal from '@/components/EventModal';

type EBEvent = {
  id: string;
  name?: { text?: string };
  description?: { text?: string };
  start?: { local?: string; utc?: string };
  url?: string;
  imageUrl?: string;
};

type SearchPayload = {
  events?: EBEvent[];
  pagination?: { has_more_items?: boolean };
};

export default function EventSearchPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const [q, setQ] = useState(sp.get('q') || '');
  const [city, setCity] = useState(sp.get('city') || sp.get('location.address') || '');
  const [page, setPage] = useState(Number(sp.get('page') || 1));

  const [startDate, setStartDate] = useState(sp.get('startDate') || '');
  const [endDate, setEndDate] = useState(sp.get('endDate') || '');
  const [segment, setSegment] = useState(sp.get('segmentName') || '');

  const params = useMemo(
    () => ({
      q: q || undefined,
      city: city || undefined,
      page: String(page),
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      segmentName: segment || undefined,
    }),
    [q, city, page, startDate, endDate, segment]
  );

  const [data, setData] = useState<SearchPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EBEvent | null>(null);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

  // Fetch user's itineraries to check which events are already added
  const { data: itineraries = [] } = useQuery({
    queryKey: ['itineraries'],
    queryFn: itineraryApi.getAll,
    enabled: isAuthenticated,
  });

  const currentItinerary = itineraries[0] || null;
  const itineraryEventIds = currentItinerary?.events.map(e => e.id) || [];

  // Mutation to add event to itinerary
  const addEventMutation = useMutation({
    mutationFn: async ({ itineraryId, event }: { itineraryId: string; event: Event }) => {
      return await itineraryApi.addEvent(itineraryId, event);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itineraries'] });
    },
  });

  // Mutation to create itinerary if none exists
  const createItineraryMutation = useMutation({
    mutationFn: itineraryApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itineraries'] });
    },
  });

  const doSearch = async () => {
    setLoading(true);
    setErr(null);
    try {
      const json = await eventsApi.search(params);
      setData(json);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (q || city || startDate || endDate || segment) {
      void doSearch();
    } else {
      setData(null);
    }
    const qs = toSearchParams({
      q: q || undefined,
      city: city || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      segmentName: segment || undefined,
      page: page > 1 ? String(page) : undefined,
    });
    const url = qs.toString() ? `/events/search?${qs.toString()}` : '/events/search';
    if (decodeURIComponent(window.location.search.slice(1)) !== qs.toString()) {
      router.replace(url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, city, page, startDate, endDate, segment]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void doSearch();
  };

  const handleShare = async (event: EBEvent) => {
    try {
      const { shareUrl } = await shareApi.createEventShare(
        event.id,
        event.name?.text || 'Event',
        event.url || ''
      );
      await navigator.clipboard.writeText(shareUrl);
      setShareSuccess(shareUrl);
      setTimeout(() => setShareSuccess(null), 3000);
    } catch (error: unknown) {
      console.error('Error sharing event:', error);
      const apiError = error as { response?: { data?: { message?: string } } };
      const errorMsg =
        apiError.response?.data?.message || 'Failed to create share link. Please log in.';
      alert(errorMsg);
    }
  };

  const handleViewDetails = (event: EBEvent) => {
    if (event.url) {
      setSelectedEvent(event);
    } else {
      alert('No event details URL available');
    }
  };

  const handleAddToItinerary = async (event: EBEvent) => {
    if (!isAuthenticated) {
      alert('Please log in to add events to your itinerary');
      router.push('/login');
      return;
    }

    const newEvent: Event = {
      id: event.id,
      name: event.name?.text || 'Event',
      date: event.start?.local || event.start?.utc || new Date().toISOString(),
      url: event.url || '',
      imageUrl: event.imageUrl,
      description: event.description?.text,
    };

    try {
      // If no itinerary exists, create one first
      if (!currentItinerary) {
        await createItineraryMutation.mutateAsync({
          name: 'My Itinerary',
          events: [newEvent],
        });
        alert('Itinerary created and event added!');
      } else {
        // Add event to existing itinerary
        await addEventMutation.mutateAsync({
          itineraryId: currentItinerary._id,
          event: newEvent,
        });
        alert('Event added to itinerary!');
      }
    } catch (error: unknown) {
      console.error('Error adding event to itinerary:', error);
      const apiError = error as { response?: { data?: { message?: string } } };
      const errorMsg = apiError.response?.data?.message || 'Failed to add event';
      alert(errorMsg);
    }
  };

  const events: EBEvent[] = data?.events || [];
  const hasNext = Boolean(data?.pagination?.has_more_items);
  const hasPrev = page > 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Search Destinations & Events
        </h1>

        {shareSuccess && (
          <div className="mb-4 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 px-4 py-3 rounded">
            Link copied to clipboard! {shareSuccess}
          </div>
        )}

        <form
          onSubmit={onSubmit}
          className="bg-white dark:bg-gray-900 rounded-xl shadow p-4 space-y-3 mb-6"
        >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="border rounded-lg px-3 py-2 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            placeholder="Keyword (e.g., festival)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <input
            className="border rounded-lg px-3 py-2 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            placeholder="City (e.g., Cusco)"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="date"
            className="border rounded-lg px-3 py-2 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            type="date"
            className="border rounded-lg px-3 py-2 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select
            className="border rounded-lg px-3 py-2 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
          >
            <option value="">All categories</option>
            <option value="Music">Music</option>
            <option value="Sports">Sports</option>
            <option value="Arts & Theatre">Arts & Theatre</option>
          </select>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            type="submit"
          >
            Search
          </button>
        </div>
      </form>

        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center">
            <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {err && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-red-600">
            {err}
          </div>
        )}

        {!loading && !err && events.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((ev) => (
              <div key={ev.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
                {ev.imageUrl && (
                  <img
                    src={ev.imageUrl}
                    alt={ev.name?.text || 'Event image'}
                    className="w-full h-48 object-cover rounded-lg mb-3"
                    loading="lazy"
                  />
                )}
                <div className="text-lg font-semibold text-gray-800 dark:text-white">
                  {ev.name?.text || 'Untitled event'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {ev.start?.local
                    ? new Date(ev.start.local).toLocaleString()
                    : ev.start?.utc
                    ? new Date(ev.start.utc).toLocaleString()
                    : 'Date TBD'}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {ev.url && (
                    <button
                      onClick={() => handleViewDetails(ev)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      View Details
                    </button>
                  )}
                  <button
                    onClick={() => handleShare(ev)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Share
                  </button>
                  <button
                    onClick={() => handleAddToItinerary(ev)}
                    disabled={itineraryEventIds.includes(ev.id) || addEventMutation.isPending || createItineraryMutation.isPending}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {addEventMutation.isPending || createItineraryMutation.isPending
                      ? 'Adding...'
                      : itineraryEventIds.includes(ev.id)
                      ? 'In Itinerary'
                      : 'Add to Itinerary'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !err && (q || city) && events.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 text-gray-600 dark:text-gray-300">
            No results. Try adjusting your search.
          </div>
        )}

        {!loading && !err && (q || city) && (
          <div className="flex items-center gap-2 mt-6">
            <button
              className="px-3 py-1 border rounded disabled:opacity-50 dark:border-gray-700 dark:text-white"
              disabled={!hasPrev}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ◀ Prev
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">Page {page}</span>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50 dark:border-gray-700 dark:text-white"
              disabled={!hasNext}
              onClick={() => setPage((p) => p + 1)}
            >
              Next ▶
            </button>
          </div>
        )}
      </div>

      {selectedEvent && (
        <EventModal
          eventUrl={selectedEvent.url || ''}
          eventName={selectedEvent.name?.text || 'Event'}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
