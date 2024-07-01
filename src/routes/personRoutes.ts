// routes/personRoutes.ts

import express from 'express';
import { createPerson } from '../controllers/personController';

const router = express.Router();

// Endpoint para crear persona
router.post('/persons', createPerson);

export default router;

