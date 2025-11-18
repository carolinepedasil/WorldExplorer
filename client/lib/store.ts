import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Event, Itinerary } from './api';

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  displayName?: string;
  provider: 'github' | 'local';
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
        }
        set({ user, token, isAuthenticated: true });
      },
      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        set({ user: null, token: null, isAuthenticated: false });
      },
      initializeAuth: () => {
        if (typeof window !== 'undefined') {
          const storedToken = localStorage.getItem('token');
          const state = get();
          if (storedToken && !state.token) {
            set({ token: storedToken });
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

interface ItineraryStore {
  currentItinerary: Itinerary | null;
  setCurrentItinerary: (itinerary: Itinerary | null) => void;
  addEventToStore: (event: Event) => void;
  removeEventFromStore: (eventId: string) => void;
  clearItinerary: () => void;
}

export const useItineraryStore = create<ItineraryStore>()(
  persist(
    (set) => ({
      currentItinerary: null,
      setCurrentItinerary: (itinerary) => set({ currentItinerary: itinerary }),
      addEventToStore: (event) =>
        set((state) => {
          if (!state.currentItinerary) return state;
          const eventExists = state.currentItinerary.events.some((e) => e.id === event.id);
          if (eventExists) return state;
          return {
            currentItinerary: {
              ...state.currentItinerary,
              events: [...state.currentItinerary.events, event],
            },
          };
        }),
      removeEventFromStore: (eventId) =>
        set((state) => {
          if (!state.currentItinerary) return state;
          return {
            currentItinerary: {
              ...state.currentItinerary,
              events: state.currentItinerary.events.filter((e) => e.id !== eventId),
            },
          };
        }),
      clearItinerary: () => set({ currentItinerary: null }),
    }),
    {
      name: 'itinerary-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
