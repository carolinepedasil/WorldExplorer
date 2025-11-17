import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

const REST_COUNTRIES_BASE = 'https://restcountries.com/v3.1';

type CountryDto = {
  name: string;
  code: string;
  region?: string;
  capital?: string;
  population?: number;
  flagUrl?: string;
};

function mapCountry(raw: any): CountryDto | null {
  const name = raw?.name?.common;
  const code = raw?.cca2 || raw?.cca3;
  if (!name || !code) return null;

  const capital = Array.isArray(raw.capital) ? raw.capital[0] : raw.capital;
  const population =
    typeof raw.population === 'number' ? raw.population : undefined;
  const flagUrl = raw?.flags?.svg || raw?.flags?.png || undefined;
  const region = raw?.region || undefined;

  return { name, code, region, capital, population, flagUrl };
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const search = ((req.query.search as string) || '').trim().toLowerCase();

    const url =
      `${REST_COUNTRIES_BASE}/all?fields=` +
      ['name', 'cca2', 'cca3', 'region', 'capital', 'population', 'flags'].join(
        ','
      );

    const { data } = await axios.get(url);

    const mapped: CountryDto[] = (Array.isArray(data) ? data : [])
      .map(mapCountry)
      .filter((c): c is CountryDto => !!c);

    const filtered = search
      ? mapped.filter((c) => {
          const haystack = [
            c.name,
            c.code,
            c.region,
            c.capital,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return haystack.includes(search);
        })
      : mapped;

    filtered.sort((a, b) => a.name.localeCompare(b.name));

    res.json({ countries: filtered });
  } catch (error: any) {
    console.error('[countries.routes] error:', error?.message || error);
    res.status(500).json({
      message: 'Error fetching countries from external API',
      error: error?.message ?? 'unknown error',
    });
  }
});

export default router;
