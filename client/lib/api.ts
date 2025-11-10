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