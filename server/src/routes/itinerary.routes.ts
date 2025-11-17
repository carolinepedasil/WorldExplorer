import { Router, Response } from 'express';
import { authenticateJWT, AuthRequest } from '../middleware/auth.middleware';
import { Itinerary } from '../models/Itinerary';

const router = Router();

// Get all itineraries for the authenticated user
router.get('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const itineraries = await Itinerary.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(itineraries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching itineraries', error });
  }
});

// Get a specific itinerary by ID
router.get('/:id', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const itinerary = await Itinerary.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    return res.json(itinerary);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching itinerary', error });
  }
});

// Create a new itinerary
router.post('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, events, isPublic } = req.body;

    const itinerary = new Itinerary({
      userId: req.user._id,
      name: name || 'My Itinerary',
      description,
      events: events || [],
      isPublic: isPublic || false
    });

    await itinerary.save();
    res.status(201).json(itinerary);
  } catch (error) {
    res.status(500).json({ message: 'Error creating itinerary', error });
  }
});

// Update an itinerary
router.put('/:id', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, events, isPublic } = req.body;

    const itinerary = await Itinerary.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { name, description, events, isPublic },
      { new: true, runValidators: true }
    );

    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    return res.json(itinerary);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating itinerary', error });
  }
});

// Delete an itinerary
router.delete('/:id', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const itinerary = await Itinerary.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    return res.json({ message: 'Itinerary deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting itinerary', error });
  }
});

// Add an event to an itinerary
router.post('/:id/events', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const event = req.body;

    const itinerary = await Itinerary.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    // Check if event already exists in itinerary
    const eventExists = itinerary.events.some(e => e.id === event.id);
    if (eventExists) {
      return res.status(400).json({ message: 'Event already in itinerary' });
    }

    itinerary.events.push(event);
    await itinerary.save();

    return res.json(itinerary);
  } catch (error) {
    return res.status(500).json({ message: 'Error adding event to itinerary', error });
  }
});

// Remove an event from an itinerary
router.delete('/:id/events/:eventId', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { id, eventId } = req.params;

    const itinerary = await Itinerary.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    itinerary.events = itinerary.events.filter(e => e.id !== eventId);
    await itinerary.save();

    return res.json(itinerary);
  } catch (error) {
    return res.status(500).json({ message: 'Error removing event from itinerary', error });
  }
});

export default router;
