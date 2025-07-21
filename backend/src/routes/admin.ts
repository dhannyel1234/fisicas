import { Router } from 'express';

const router = Router();

router.get('/dashboard', (req, res) => {
  res.json({ message: 'Admin dashboard - To be implemented' });
});

export default router;