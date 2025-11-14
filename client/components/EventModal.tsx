'use client';

import { useState } from 'react';

type EventModalProps = {
  eventUrl: string;
  eventName: string;
  onClose: () => void;
};

export default function EventModal({ eventUrl, eventName, onClose }: EventModalProps) {
  const [loading, setLoading] = useState(true);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white truncate">{eventName}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>
        <div className="flex-1 relative min-h-0">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <iframe
            src={eventUrl}
            className="w-full h-full border-0"
            onLoad={() => setLoading(false)}
            title={eventName}
          />
        </div>
      </div>
    </div>
  );
}
