import { Router } from 'express';

const router = Router();

router.get('/status', (req, res) => {
  res.json({ message: 'Queue status - To be implemented' });
});

export default router;