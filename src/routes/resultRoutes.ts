import { Router } from 'express';
import { generateCsv } from '../controllers/resultController';

const router = Router();

router.post('/generate-csv', generateCsv);

export default router;
