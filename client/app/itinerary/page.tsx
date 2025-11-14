'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { shareApi, calendarApi } from '@/lib/api';

type SavedEvent = {
  id: string;
  name: string;
  start: string;
  url: string;
  imageUrl?: string;
  description?: string;
};

export default function ItineraryPage() {
  const router = useRouter();
  const [itinerary, setItinerary] = useState<SavedEvent[]>([]);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('itinerary');
    if (saved) {
      setItinerary(JSON.parse(saved));
    }
  }, []);

  const handleShareItinerary = async () => {
    try {
      const { shareUrl: url } = await shareApi.createItineraryShare(itinerary);
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      alert('Itinerary link copied to clipboard!');
    } catch (error) {
      console.error('Error sharing itinerary:', error);
      alert('Failed to create shareable link. Please log in.');
    }
  };

  const handleExportICS = async () => {
    try {
      setExporting(true);
      const blob = await calendarApi.exportToICS(itinerary);
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

  const handleRemoveEvent = (id: string) => {
    const updated = itinerary.filter(e => e.id !== id);
    setItinerary(updated);
    localStorage.setItem('itinerary', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">My Itinerary</h1>
          <div className="flex gap-3">
            <button
              onClick={handleShareItinerary}
              disabled={itinerary.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Share Itinerary
            </button>
            <button
              onClick={handleExportICS}
              disabled={itinerary.length === 0 || exporting}
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

        {itinerary.length === 0 ? (
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
            {itinerary.map((ev) => (
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
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(ev.start).toLocaleString()}
                </div>
                {ev.description && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">
                    {ev.description}
                  </p>
                )}
                <div className="mt-3 flex gap-3">
                  <a
                    href={ev.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Event
                  </a>
                  <button
                    onClick={() => handleRemoveEvent(ev.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Remove
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
