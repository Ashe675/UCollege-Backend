// routes/admissionRoutes.ts

import express from 'express';
import { createAdmission } from '../controllers/admissionController';

const router = express.Router();

// Endpoint para crear admisión
router.post('/admissions', createAdmission);

export default router;
