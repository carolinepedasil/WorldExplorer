'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

type CountryDetails = {
  name: {
    common: string;
    official?: string;
  };
  cca2?: string;
  cca3?: string;
  region?: string;
  subregion?: string;
  capital?: string[];
  population?: number;
  flags?: {
    svg?: string;
    png?: string;
    alt?: string;
  };
  languages?: Record<string, string>;
  currencies?: Record<string, { name?: string; symbol?: string }>;
  maps?: {
    googleMaps?: string;
    openStreetMaps?: string;
  };
  demonyms?: {
    eng?: {
      m?: string;
      f?: string;
    };
  };
};

async function fetchCountryDetails(code: string): Promise<CountryDetails> {
  if (!code) {
    throw new Error('Missing country code');
  }

  const res = await fetch(`https://restcountries.com/v3.1/alpha/${code}`);
  if (!res.ok) {
    throw new Error('Failed to fetch country details');
  }

  const data = (await res.json()) as CountryDetails[];
  if (!data || data.length === 0) {
    throw new Error('Country not found');
  }

  return data[0];
}

export default function CountryDetailsPage() {
  const router = useRouter();
  const params = useParams<{ code?: string }>();

  const code = (params?.code ?? '').toString();

  const {
    data: country,
    isLoading,
    isError,
    error,
  } = useQuery<CountryDetails>({
    queryKey: ['country-details', code],
    queryFn: () => fetchCountryDetails(code),
    enabled: !!code,
  });

  const handleBack = () => {
    router.push('/countries');
  };

  const handleViewEvents = () => {
    if (!country) return;
    const q = country.name.common.toLowerCase();
    router.push(`/events/search?q=${encodeURIComponent(q)}`);
  };

  if (!code) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={handleBack}
            className="mb-4 inline-flex items-center text-sm text-blue-700 dark:text-blue-300 hover:underline"
          >
            ← Back to countries
          </button>
          <div className="bg-red-100 text-red-800 px-4 py-3 rounded-lg">
            Invalid country code in URL.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={handleBack}
          className="mb-4 inline-flex items-center text-sm text-blue-700 dark:text-blue-300 hover:underline"
        >
          ← Back to countries
        </button>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {isError && (
          <div className="bg-red-100 text-red-800 px-4 py-3 rounded-lg">
            Failed to load details for this country.{' '}
            {error instanceof Error ? error.message : null}
          </div>
        )}

        {!isLoading && !isError && country && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-6 mb-6">
              {country.flags?.svg && (
                <img
                  src={country.flags.svg}
                  alt={country.flags.alt || `${country.name.common} flag`}
                  className="w-full sm:w-56 h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {country.name.common}
                </h1>
                {country.name.official && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Official name: {country.name.official}
                  </p>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Code: {country.cca3 || country.cca2 || code.toUpperCase()}
                </p>
                {country.region && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Region: {country.region}
                    {country.subregion ? ` · ${country.subregion}` : ''}
                  </p>
                )}
                {country.capital && country.capital.length > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Capital: {country.capital.join(', ')}
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
                {country.demonyms?.eng?.m && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Demonym: {country.demonyms.eng.m}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Languages
                </h2>
                {country.languages ? (
                  <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                    {Object.entries(country.languages).map(
                      ([langCode, name]) => (
                        <li key={langCode}>{name}</li>
                      ),
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No language data available.
                  </p>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Currencies
                </h2>
                {country.currencies ? (
                  <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                    {Object.entries(country.currencies).map(
                      ([currencyCode, { name, symbol }]) => (
                        <li key={currencyCode}>
                          {currencyCode}: {name || 'Unknown'}
                          {symbol ? ` (${symbol})` : ''}
                        </li>
                      ),
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No currency data available.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Maps
                </h2>
                {country.maps?.googleMaps ? (
                  <a
                    href={country.maps.googleMaps}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-700 dark:text-blue-300 hover:underline text-sm block"
                  >
                    Open in Google Maps
                  </a>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No map link available.
                  </p>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Events
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    See real events happening in {country.name.common} and add
                    them to your itineraries.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleViewEvents}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  View events in {country.name.common}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
