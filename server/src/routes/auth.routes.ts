import { Router, Request, Response } from 'express';
import passport from 'passport';
import { generateToken } from '../middleware/auth.middleware';
import { User } from '../models/User';
import bcrypt from 'bcrypt';

const router = Router();

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req: Request, res: Response) => {
    const user = req.user as any;
    const token = generateToken(user._id.toString());
    
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  }
);

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({ $or: [{ email: normalizedEmail }, { username }] });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email: normalizedEmail,
      password: hashedPassword,
      provider: 'local'
    });

    const token = generateToken(String(user._id));

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        displayName: user.displayName
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !user.password) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = generateToken(String(user._id));

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        displayName: user.displayName
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
});

router.post('/logout', (req: Request, res: Response): void => {
  req.logout((err) => {
    if (err) {
      res.status(500).json({ message: 'Error logging out' });
      return;
    }
    res.json({ message: 'Logout successful' });
  });
});

router.get('/me', passport.authenticate('jwt', { session: false }), (req: Request, res: Response) => {
  const user = req.user as any;
  res.json({
    id: user._id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    displayName: user.displayName,
    provider: user.provider
  });
});

export default router;
