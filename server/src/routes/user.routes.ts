import { Router, Response } from 'express';
import { authenticateJWT, AuthRequest } from '../middleware/auth.middleware';
import { User } from '../models/User';

const router = Router();

router.get('/profile', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error });
  }
});

router.put('/profile', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { displayName, avatar } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { displayName, avatar },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error });
  }
});

router.get('/', authenticateJWT, async (_req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().select('-password').limit(50);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
  }
});

export default router;
