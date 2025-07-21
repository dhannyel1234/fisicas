import { Router } from 'express';

const router = Router();

router.get('/profile', (req, res) => {
  res.json({ message: 'User profile - To be implemented' });
});

export default router;