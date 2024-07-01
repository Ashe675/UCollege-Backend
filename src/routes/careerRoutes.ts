// routes/careerRoutes.ts

import express from 'express';
import { createCareer } from '../controllers/careerController';

const router = express.Router();

// Endpoint para crear carrera
router.post('/careers', createCareer);

export default router;
