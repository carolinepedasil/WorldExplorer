'use client';

import { useEffect, useState } from 'react';
import { shareApi } from '@/lib/api';

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

export default function ManageLinksPage() {
  const [links, setLinks] = useState<SharedLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const data = await shareApi.getUserLinks();
      setLinks(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load shared links');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLinks();
  }, []);

  const handleRevoke = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this shared link?')) {
      return;
    }

    try {
      await shareApi.revokeLink(id);
      await fetchLinks();
    } catch (err) {
      alert('Failed to revoke link');
    }
  };

  const copyToClipboard = async (token: string) => {
    const shareUrl = `${window.location.origin}/share/${token}`;
    await navigator.clipboard.writeText(shareUrl);
    alert('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
          Manage Shared Links
        </h1>

        {links.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              You haven't created any shared links yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {links.map((link) => (
              <div
                key={link._id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow p-6 ${
                  link.isRevoked ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                        {link.type}
                      </span>
                      {link.isRevoked && (
                        <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-sm font-medium">
                          Revoked
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                      {link.type === 'event'
                        ? link.eventName
                        : `Itinerary (${link.itineraryData?.events?.length || 0} events)`}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Created: {new Date(link.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Views: {link.accessCount}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!link.isRevoked && (
                      <>
                        <button
                          onClick={() => copyToClipboard(link.token)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Copy Link
                        </button>
                        <button
                          onClick={() => handleRevoke(link._id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Revoke
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
