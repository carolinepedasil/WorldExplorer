import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.post('/export', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const { events } = req.body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      res.status(400).json({ message: 'No events provided' });
      return;
    }

    const icsEvents = events.map((event: any) => {
      const start = event.start ? new Date(event.start) : new Date();
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
      
      const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      const escape = (str: string) => {
        return str.replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n');
      };

      return [
        'BEGIN:VEVENT',
        `UID:${event.id}@worldexplorer.app`,
        `DTSTAMP:${formatDate(new Date())}`,
        `DTSTART:${formatDate(start)}`,
        `DTEND:${formatDate(end)}`,
        `SUMMARY:${escape(event.name || 'Event')}`,
        event.description ? `DESCRIPTION:${escape(event.description)}` : '',
        event.url ? `URL:${event.url}` : '',
        'END:VEVENT'
      ].filter(Boolean).join('\r\n');
    });

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//WorldExplorer//EN',
      'CALSCALE:GREGORIAN',
      ...icsEvents,
      'END:VCALENDAR'
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', 'attachment; filename="itinerary.ics"');
    res.send(icsContent);
  } catch (err: any) {
    res.status(500).json({ message: 'Error exporting calendar', error: err.message });
  }
});

export default router;
