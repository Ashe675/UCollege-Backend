import { Router } from 'express';
import { generateCsv } from '../../controllers/admission/resultController';

const router = Router();

router.get('/generate-csv', generateCsv);

export default router;
