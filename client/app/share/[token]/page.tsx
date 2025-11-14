'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { shareApi } from '@/lib/api';
import EventModal from '@/components/EventModal';

export default function SharedLinkPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  useEffect(() => {
    const fetchSharedLink = async () => {
      try {
        const result = await shareApi.getSharedLink(token);
        setData(result);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load shared content');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      void fetchSharedLink();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 dark:text-gray-300">{error || 'Content not found'}</p>
        </div>
      </div>
    );
  }

  if (data.type === 'event') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
              {data.eventName}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Shared with you via WorldExplorer
            </p>
            <button
              onClick={() => setSelectedEvent({ url: data.eventUrl, name: { text: data.eventName } })}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Event Details
            </button>
          </div>
        </div>
        {selectedEvent && (
          <EventModal
            eventUrl={selectedEvent.url}
            eventName={selectedEvent.name.text}
            onClose={() => setSelectedEvent(null)}
          />
        )}
      </div>
    );
  }

  if (data.type === 'itinerary') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
            Shared Itinerary
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.itineraryData?.events?.map((ev: any) => (
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
                  {ev.name || 'Untitled event'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {ev.start ? new Date(ev.start).toLocaleString() : 'Date TBD'}
                </div>
                {ev.description && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">
                    {ev.description}
                  </p>
                )}
                <div className="mt-3">
                  <button
                    onClick={() => setSelectedEvent(ev)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        {selectedEvent && (
          <EventModal
            eventUrl={selectedEvent.url}
            eventName={selectedEvent.name}
            onClose={() => setSelectedEvent(null)}
          />
        )}
      </div>
    );
  }

  return null;
}
