import { Router } from 'express';
import { clinics } from '../data/clinics.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({ clinics });
});

router.get('/:id', (req, res) => {
  const clinic = clinics.find(c => c.id === req.params.id);
  if (!clinic) return res.status(404).json({ error: 'clinic not found' });
  res.json({ clinic });
});

export default router;
