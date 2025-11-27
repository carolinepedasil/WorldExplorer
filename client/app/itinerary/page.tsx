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
  const [selectedItineraryId, setSelectedItineraryId] = useState<string | null>(null);
  const [showNewItineraryModal, setShowNewItineraryModal] = useState(false);
  const [newItineraryName, setNewItineraryName] = useState('');
  const [newItineraryDescription, setNewItineraryDescription] = useState('');
  const [editingItineraryId, setEditingItineraryId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const queryClient = useQueryClient();

  // Fetch all itineraries for the user
  const { data: itineraries = [], isLoading } = useQuery<Itinerary[]>({
    queryKey: ['itineraries'],
    queryFn: itineraryApi.getAll,
    enabled: isAuthenticated,
  });

  // Select first itinerary by default or the one from localStorage
  useEffect(() => {
    if (itineraries.length > 0 && !selectedItineraryId) {
      const savedId = localStorage.getItem('selectedItineraryId');
      const itineraryExists = itineraries.find(it => it._id === savedId);
      if (savedId && itineraryExists) {
        setSelectedItineraryId(savedId);
      } else {
        setSelectedItineraryId(itineraries[0]._id);
      }
    }
  }, [itineraries, selectedItineraryId]);

  // Save selected itinerary to localStorage
  useEffect(() => {
    if (selectedItineraryId) {
      localStorage.setItem('selectedItineraryId', selectedItineraryId);
    }
  }, [selectedItineraryId]);

  const currentItinerary = itineraries.find(it => it._id === selectedItineraryId) || null;

  // Create itinerary mutation
  const createItineraryMutation = useMutation({
    mutationFn: itineraryApi.create,
    onSuccess: (newItinerary) => {
      queryClient.invalidateQueries({ queryKey: ['itineraries'] });
      setSelectedItineraryId(newItinerary._id);
      setShowNewItineraryModal(false);
      setNewItineraryName('');
      setNewItineraryDescription('');
    },
  });

  // Update itinerary mutation
  const updateItineraryMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      itineraryApi.update(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itineraries'] });
      setEditingItineraryId(null);
      setEditName('');
    },
  });

  // Delete itinerary mutation
  const deleteItineraryMutation = useMutation({
    mutationFn: itineraryApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itineraries'] });
      setSelectedItineraryId(null);
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

  const handleCreateItinerary = async () => {
    if (!newItineraryName.trim()) {
      alert('Please enter a name for your itinerary');
      return;
    }

    try {
      await createItineraryMutation.mutateAsync({
        name: newItineraryName,
        description: newItineraryDescription,
        events: [],
      });
    } catch (error) {
      console.error('Error creating itinerary:', error);
      alert('Failed to create itinerary');
    }
  };

  const handleUpdateItineraryName = async (id: string) => {
    if (!editName.trim()) {
      alert('Please enter a name');
      return;
    }

    try {
      await updateItineraryMutation.mutateAsync({ id, name: editName });
    } catch (error) {
      console.error('Error updating itinerary:', error);
      alert('Failed to update itinerary name');
    }
  };

  const handleDeleteItinerary = async (id: string) => {
    if (!confirm('Are you sure you want to delete this itinerary? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteItineraryMutation.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting itinerary:', error);
      alert('Failed to delete itinerary');
    }
  };

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
      a.download = `${currentItinerary.name}.ics`;
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
            You need to be logged in to view your itineraries
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
        <div className="text-gray-800 dark:text-white text-xl">Loading your itineraries...</div>
      </div>
    );
  }

  const events = currentItinerary?.events || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Itinerary Selector */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">My Itineraries</h1>
            <button
              onClick={() => setShowNewItineraryModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              + New Itinerary
            </button>
          </div>

          {/* Itinerary Tabs */}
          {itineraries.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {itineraries.map((itinerary) => (
                <div key={itinerary._id} className="flex-shrink-0">
                  <button
                    onClick={() => setSelectedItineraryId(itinerary._id)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedItineraryId === itinerary._id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {itinerary.name} ({itinerary.events.length})
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current Itinerary Actions */}
        {currentItinerary && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {editingItineraryId === currentItinerary._id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="px-3 py-1 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                      placeholder="Itinerary name"
                    />
                    <button
                      onClick={() => handleUpdateItineraryName(currentItinerary._id)}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingItineraryId(null);
                        setEditName('');
                      }}
                      className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                      {currentItinerary.name}
                    </h2>
                    <button
                      onClick={() => {
                        setEditingItineraryId(currentItinerary._id);
                        setEditName(currentItinerary.name);
                      }}
                      className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Edit Name
                    </button>
                  </>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleShareItinerary}
                  disabled={events.length === 0}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Share
                </button>
                <button
                  onClick={handleExportICS}
                  disabled={events.length === 0 || exporting}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exporting ? 'Exporting...' : 'Export'}
                </button>
                <button
                  onClick={() => handleDeleteItinerary(currentItinerary._id)}
                  disabled={itineraries.length === 1}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={itineraries.length === 1 ? 'Cannot delete your only itinerary' : 'Delete this itinerary'}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {shareUrl && (
          <div className="mb-4 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 px-4 py-3 rounded">
            Shareable link: <a href={shareUrl} className="underline">{shareUrl}</a>
          </div>
        )}

        {/* Events Grid */}
        {!currentItinerary && itineraries.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">You don&apos;t have any itineraries yet</p>
            <button
              onClick={() => setShowNewItineraryModal(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Create Your First Itinerary
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">This itinerary is empty</p>
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

      {/* New Itinerary Modal */}
      {showNewItineraryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Create New Itinerary
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Itinerary Name *
                </label>
                <input
                  type="text"
                  value={newItineraryName}
                  onChange={(e) => setNewItineraryName(e.target.value)}
                  placeholder="e.g., France Trip, New York Weekend"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newItineraryDescription}
                  onChange={(e) => setNewItineraryDescription(e.target.value)}
                  placeholder="Add a description for your itinerary..."
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCreateItinerary}
                  disabled={createItineraryMutation.isPending}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {createItineraryMutation.isPending ? 'Creating...' : 'Create'}
                </button>
                <button
                  onClick={() => {
                    setShowNewItineraryModal(false);
                    setNewItineraryName('');
                    setNewItineraryDescription('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
