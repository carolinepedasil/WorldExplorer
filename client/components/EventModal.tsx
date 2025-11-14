'use client';

import { useState, useEffect } from 'react';

type EventModalProps = {
  eventUrl: string;
  eventName: string;
  onClose: () => void;
};

export default function EventModal({ eventUrl, eventName, onClose }: EventModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setError(true);
        setLoading(false);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [loading]);

  const handleOpenInNewTab = () => {
    window.open(eventUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white truncate">{eventName}</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenInNewTab}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Open in New Tab
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>
        </div>
        <div className="flex-1 relative min-h-0">
          {loading && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-600 dark:text-gray-400">Loading event details...</p>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
              <div className="text-6xl">🔒</div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white text-center">
                Cannot Display in Preview
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
                This event page cannot be displayed here due to security restrictions. Please click "Open in New Tab" to view the full event details.
              </p>
              <button
                onClick={handleOpenInNewTab}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Open Event Page
              </button>
            </div>
          )}
          {!error && (
            <iframe
              src={eventUrl}
              className="w-full h-full border-0"
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
              title={eventName}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          )}
        </div>
      </div>
    </div>
  );
}
