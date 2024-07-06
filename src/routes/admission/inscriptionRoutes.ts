import express from 'express';
import { getInscriptionDetails } from '../../controllers/admission/inscriptionController';

const router = express.Router();

router.get('/inscription/:dni', getInscriptionDetails);

export default router;
