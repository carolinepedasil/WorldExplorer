'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { countriesApi, type Country } from '@/lib/countries-api';

export const dynamic = 'force-dynamic';

export default function CountriesPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const {
    data: countries,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['countries', search],
    queryFn: () => countriesApi.list(search || undefined),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    void refetch();
  };

  const handleClear = () => {
    setSearchInput('');
    setSearch('');
    void refetch();
  };

  const handleViewEvents = (country: Country) => {
    const q = country.name.toLowerCase();
    router.push(`/events/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Browse Countries
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Explore countries around the world and jump straight to local events
            for your next destination.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="mb-6 flex flex-col md:flex-row gap-3 items-stretch md:items-center"
        >
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by country name, code, region, or capital (e.g. France, FR, Europe)..."
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 
                       bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 
                         dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              Clear
            </button>
          </div>
        </form>

        {isLoading && (
          <div className="text-center text-gray-700 dark:text-gray-300">
            Loading countries...
          </div>
        )}

        {isError && (
          <div className="text-center text-red-600 dark:text-red-400">
            Failed to load countries. Please try again later.
          </div>
        )}

        {!isLoading && !isError && countries && countries.length === 0 && (
          <div className="text-center text-gray-600 dark:text-gray-400">
            No countries found for this search.
          </div>
        )}

        {!isLoading && !isError && countries && countries.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {countries.map((country) => (
              <article
                key={country.code}
                className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-3">
                  {country.flagUrl && (
                    <img
                      src={country.flagUrl}
                      alt={`${country.name} flag`}
                      className="w-10 h-7 object-cover rounded border border-gray-200 dark:border-gray-700"
                      loading="lazy"
                    />
                  )}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                      {country.name}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {country.code}
                      {country.region ? ` • ${country.region}` : ''}
                    </p>
                  </div>
                </div>

                {country.capital && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">Capital:</span>{' '}
                    {country.capital}
                  </p>
                )}

                {typeof country.population === 'number' &&
                  country.population > 0 && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Population:</span>{' '}
                      {country.population.toLocaleString()}
                    </p>
                  )}

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleViewEvents(country)}
                    className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm 
                               hover:bg-purple-700 transition-colors"
                  >
                    View Events in {country.name}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
