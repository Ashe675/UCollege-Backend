// routes/admissions/regionalCenterRoutes.ts
import { Router } from 'express';
import { getRegionalCentersHandler } from '../../controllers/admission/regionalCenterController';

const router = Router();

router.get('/admission/centers', getRegionalCentersHandler);

export default router;


