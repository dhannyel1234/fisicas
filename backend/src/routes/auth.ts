import { Router } from 'express';

const router = Router();

// Placeholder - implementação completa será feita depois
router.get('/discord', (req, res) => {
  res.json({ message: 'Discord OAuth - To be implemented' });
});

router.get('/discord/callback', (req, res) => {
  res.json({ message: 'Discord OAuth callback - To be implemented' });
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logout - To be implemented' });
});

export default router;