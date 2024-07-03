import { Router } from 'express';
import { generateCsv } from '../controllers/resultController';

const router = Router();

router.get('/generate-csv', generateCsv);

export default router;
