import { Router, Request, Response } from 'express';
import { SharedLink } from '../models/SharedLink';
import crypto from 'crypto';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.post('/event', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?._id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { eventId, eventName, eventUrl } = req.body;

    if (!eventId || !eventName || !eventUrl) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const token = crypto.randomBytes(16).toString('hex');

    const sharedLink = await SharedLink.create({
      userId,
      type: 'event',
      token,
      eventId,
      eventName,
      eventUrl
    });

    const shareUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/share/${token}`;

    res.json({
      token,
      shareUrl,
      sharedLink
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Error creating shared link', error: err.message });
  }
});

router.post('/itinerary', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?._id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { events } = req.body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      res.status(400).json({ message: 'No events provided' });
      return;
    }

    const token = crypto.randomBytes(16).toString('hex');

    const sharedLink = await SharedLink.create({
      userId,
      type: 'itinerary',
      token,
      itineraryData: { events }
    });

    const shareUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/share/${token}`;

    res.json({
      token,
      shareUrl,
      sharedLink
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Error creating shared itinerary', error: err.message });
  }
});

router.get('/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    const sharedLink = await SharedLink.findOne({ token, isRevoked: false });

    if (!sharedLink) {
      res.status(404).json({ message: 'Shared link not found or has been revoked' });
      return;
    }

    if (sharedLink.expiresAt && sharedLink.expiresAt < new Date()) {
      res.status(410).json({ message: 'Shared link has expired' });
      return;
    }

    sharedLink.accessCount += 1;
    await sharedLink.save();

    res.json(sharedLink);
  } catch (err: any) {
    res.status(500).json({ message: 'Error retrieving shared link', error: err.message });
  }
});

router.get('/user/links', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?._id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const links = await SharedLink.find({ userId }).sort({ createdAt: -1 });

    res.json(links);
  } catch (err: any) {
    res.status(500).json({ message: 'Error retrieving shared links', error: err.message });
  }
});

router.delete('/:id', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?._id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const link = await SharedLink.findOne({ _id: id, userId });

    if (!link) {
      res.status(404).json({ message: 'Shared link not found' });
      return;
    }

    link.isRevoked = true;
    await link.save();

    res.json({ message: 'Shared link revoked successfully', link });
  } catch (err: any) {
    res.status(500).json({ message: 'Error revoking shared link', error: err.message });
  }
});

export default router;
