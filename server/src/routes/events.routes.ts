import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

const TM_BASE = 'https://app.ticketmaster.com/discovery/v2';
const TM_KEY = process.env.TICKETMASTER_API_KEY;

if (!TM_KEY) {
  console.warn('[events.routes] TICKETMASTER_API_KEY not set. Please add it to your .env');
}

function toIsoOrUndefined(d?: string) {
  if (!d) return undefined;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return undefined;
  return dt.toISOString();
}

router.get('/search', async (req: Request, res: Response) => {
  try {
    const keyword = (req.query.q as string) || undefined;
    const city = (req.query.city as string) || (req.query['location.address'] as string) || undefined;
    const page = parseInt((req.query.page as string) || '1', 10);
    const size = 12;

    const params: Record<string, string> = {
      apikey: TM_KEY || '',
      sort: 'date,asc',
      size: String(size),
      page: String(Math.max(0, page - 1)),
    };
    if (keyword) params.keyword = keyword;
    if (city) params.city = city;

    const { data } = await axios.get(`${TM_BASE}/events.json`, { params });

    const events = (data?._embedded?.events || []).map((ev: any) => {
    const startLocal = ev.dates?.start?.dateTime || ev.dates?.start?.localDate;
    const url = ev.url;
    const summary = ev.name;
    const description =
      (ev.info as string) ||
      (ev.pleaseNote as string) ||
      (ev.promoter?.name as string) ||
      '';

    return {
      id: ev.id,
      name: { text: summary },
      description: { text: description },
      start: {
        local: toIsoOrUndefined(startLocal),
        utc: toIsoOrUndefined(startLocal),
      },
      url,
      imageUrl: pickImageUrl(ev),
    };
  });

    const pageInfo = data?.page || { number: 0, size, totalPages: 0, totalElements: 0 };
    const hasMore = pageInfo.number + 1 < pageInfo.totalPages;

    res.json({
      events,
      pagination: { has_more_items: hasMore },
    });
  } catch (err: any) {
    const status = err?.response?.status || 500;
    const mapped = (status === 401 || status === 403) ? 502 : status;
    res.status(mapped).json({
      message: 'Search provider error',
      error: err?.response?.data || err?.message || 'Unknown error',
    });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { data } = await axios.get(`${TM_BASE}/events/${req.params.id}.json`, {
      params: { apikey: TM_KEY || '' },
    });

    const startLocal = data?.dates?.start?.dateTime || data?.dates?.start?.localDate;
    const url = data?.url;
    const summary = data?.name;
    const description =
      (data?.info as string) ||
      (data?.pleaseNote as string) ||
      (data?.promoter?.name as string) ||
      '';

    res.json({
      id: data?.id,
      name: { text: summary },
      description: { text: description },
      start: {
        local: toIsoOrUndefined(startLocal),
        utc: toIsoOrUndefined(startLocal),
      },
      url,
      imageUrl: pickImageUrl(data),
    });
  } catch (err: any) {
    const status = err?.response?.status || 500;
    const mapped = (status === 401 || status === 403) ? 502 : status;
    res.status(mapped).json({
      message: 'Event details provider error',
      error: err?.response?.data || err?.message || 'Unknown error',
    });
  }
});

function pickImageUrl(ev: any): string | undefined {
  const images: any[] = Array.isArray(ev?.images) ? ev.images : [];

  const preferred = ['16_9', '3_2', '4_3'];
  const byPreference = images
    .filter(img => img?.url)
    .sort((a, b) => {
      const ar = preferred.indexOf(a.ratio as string);
      const br = preferred.indexOf(b.ratio as string);
      return (ar === -1 ? 999 : ar) - (br === -1 ? 999 : br) || (b.width || 0) - (a.width || 0);
    });

  const chosen = byPreference[0];

  const seatmap = ev?.seatmap?.staticUrl;
  const attractionImg =
    ev?._embedded?.attractions?.[0]?.images?.find((i: any) => i?.url)?.url;

  return chosen?.url || seatmap || attractionImg || undefined;
}

export default router;
