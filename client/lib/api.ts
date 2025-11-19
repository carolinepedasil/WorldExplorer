import apiClient from './api-client';
import { toSearchParams } from './url';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  displayName?: string;
  provider: 'github' | 'local';
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/login', credentials);
    return data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/register', credentials);
    return data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  getCurrentUser: async (): Promise<User> => {
    const { data } = await apiClient.get('/auth/me');
    return data;
  },

  githubLogin: () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/github`;
  },
};

export const userApi = {
  getProfile: async (): Promise<User> => {
    const { data } = await apiClient.get('/users/profile');
    return data;
  },

  updateProfile: async (profile: Partial<User>): Promise<User> => {
    const { data } = await apiClient.put('/users/profile', profile);
    return data;
  },

  getAllUsers: async (): Promise<User[]> => {
    const { data } = await apiClient.get('/users');
    return data;
  },
};

export const healthApi = {
  check: async (): Promise<{ status: string; message: string }> => {
    const { data } = await apiClient.get('/health');
    return data;
  },
};

export const eventsApi = {
  search: async (params: Record<string, string | undefined>) => {
    const normalized: Record<string, string | undefined> = {
      q: params.q,
      city: params.city || params['location.address'],
      page: params.page,
      startDate: params.startDate,
      endDate: params.endDate,
      segmentName: params.segmentName,
    };
    const query = toSearchParams(normalized);
    const { data } = await apiClient.get(`/events/search?${query.toString()}`);
    return data as {
      events: Array<{
        id: string;
        name?: { text?: string };
        description?: { text?: string };
        start?: { local?: string; utc?: string };
        url?: string;
        imageUrl?: string;
      }>;
      pagination?: { has_more_items?: boolean };
    };
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get(`/events/${id}`);
    return data as {
      id: string;
      name?: { text?: string };
      description?: { text?: string };
      start?: { local?: string; utc?: string };
      url?: string;
    };
  },
};

export const shareApi = {
  createEventShare: async (eventId: string, eventName: string, eventUrl: string) => {
    const { data } = await apiClient.post('/share/event', { eventId, eventName, eventUrl });
    return data as { token: string; shareUrl: string };
  },

  createItineraryShare: async (events: Event[]) => {
    const { data } = await apiClient.post('/share/itinerary', { events });
    return data as { token: string; shareUrl: string };
  },

  getSharedLink: async (token: string) => {
    const { data } = await apiClient.get(`/share/${token}`);
    return data;
  },

  getUserLinks: async () => {
    const { data } = await apiClient.get('/share/user/links');
    return data;
  },

  revokeLink: async (id: string) => {
    const { data } = await apiClient.delete(`/share/${id}`);
    return data;
  },
};

export const calendarApi = {
  exportToICS: async (events: Event[]) => {
    const response = await apiClient.post('/calendar/export', { events }, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export interface Event {
  id: string;
  name: string;
  date?: string;
  time?: string;
  venue?: string;
  city?: string;
  state?: string;
  country?: string;
  description?: string;
  imageUrl?: string;
  url?: string;
  priceRange?: {
    min?: number;
    max?: number;
    currency?: string;
  };
}

export interface Itinerary {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  events: Event[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItineraryRequest {
  name?: string;
  description?: string;
  events?: Event[];
  isPublic?: boolean;
}

export interface UpdateItineraryRequest {
  name?: string;
  description?: string;
  events?: Event[];
  isPublic?: boolean;
}

export const itineraryApi = {
  // Get all itineraries for the current user
  getAll: async (): Promise<Itinerary[]> => {
    const { data } = await apiClient.get('/itineraries');
    return data;
  },

  // Get a specific itinerary by ID
  getById: async (id: string): Promise<Itinerary> => {
    const { data } = await apiClient.get(`/itineraries/${id}`);
    return data;
  },

  // Create a new itinerary
  create: async (itinerary: CreateItineraryRequest): Promise<Itinerary> => {
    const { data } = await apiClient.post('/itineraries', itinerary);
    return data;
  },

  // Update an existing itinerary
  update: async (id: string, itinerary: UpdateItineraryRequest): Promise<Itinerary> => {
    const { data } = await apiClient.put(`/itineraries/${id}`, itinerary);
    return data;
  },

  // Delete an itinerary
  delete: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete(`/itineraries/${id}`);
    return data;
  },

  // Add an event to an itinerary
  addEvent: async (id: string, event: Event): Promise<Itinerary> => {
    const { data } = await apiClient.post(`/itineraries/${id}/events`, event);
    return data;
  },

  // Remove an event from an itinerary
  removeEvent: async (id: string, eventId: string): Promise<Itinerary> => {
    const { data } = await apiClient.delete(`/itineraries/${id}/events/${eventId}`);
    return data;
  },
};