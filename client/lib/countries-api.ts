import apiClient from './api-client';

export type Country = {
  name: string;
  code: string;
  region?: string;
  capital?: string;
  population?: number;
  flagUrl?: string;
};

export const countriesApi = {
  list: async (search?: string): Promise<Country[]> => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const { data } = await apiClient.get(`/countries${query}`);
    return data.countries as Country[];
  },
};
