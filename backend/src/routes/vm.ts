import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'VM list - To be implemented' });
});

export default router;