// routes/inscriptionRoutes.ts

import express from 'express';
import { createInscription } from '../controllers/inscriptionController';

const router = express.Router();

// Ruta para crear una nueva inscripción
router.post('/inscriptions', createInscription);

export default router;


