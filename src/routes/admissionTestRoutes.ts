// routes/admissionTestRoutes.ts

import { Router } from 'express';
import { getAdmissionTestsByCareer } from '../controllers/admissionTestController';

const router = Router();

router.get('/admission-tests/:careerId', getAdmissionTestsByCareer);

export default router;
