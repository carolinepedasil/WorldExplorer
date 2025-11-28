'use client';

import { FormEvent, MouseEvent, useState } from 'react';
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

  const handleViewEvents = (e: MouseEvent, country: Country) => {
    e.stopPropagation();
    const q = country.name.toLowerCase();
    router.push(`/events/search?q=${encodeURIComponent(q)}`);
  };

  const handleViewDetails = (country: Country) => {
    router.push(`/countries/${country.code}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Explore Countries
          </h1>
          <p className="text-gray-700 dark:text-gray-300 mt-2">
            Search for countries around the world and discover events for your
            next trip.
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
            placeholder="Search by country name, code, region, or capital"
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 shadow-sm 
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
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {isError && (
          <div className="bg-red-100 text-red-800 px-4 py-3 rounded-lg">
            Failed to load countries. Please try again.
          </div>
        )}

        {!isLoading && !isError && countries && countries.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <p className="text-gray-700 dark:text-gray-300">
              No countries found. Try a different search term.
            </p>
          </div>
        )}

        {!isLoading && !isError && countries && countries.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {countries.map((country) => (
              <article
                key={country.code}
                onClick={() => handleViewDetails(country)}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 flex flex-col justify-between cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {country.name}
                    </h2>
                    {country.flagUrl && (
                      <img
                        src={country.flagUrl}
                        alt={`${country.name} flag`}
                        className="w-10 h-6 object-cover rounded-sm border border-gray-200 dark:border-gray-700"
                      />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Code: <span className="font-mono">{country.code}</span>
                  </p>
                  {country.region && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Region: {country.region}
                    </p>
                  )}
                  {country.capital && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Capital: {country.capital}
                    </p>
                  )}
                  {country.population && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Population:{' '}
                      {country.population.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleViewDetails(country)}
                    className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-800 text-sm 
                               hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    View Details
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleViewEvents(e, country)}
                    className="flex-1 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm 
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
