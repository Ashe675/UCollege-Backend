import { Router } from 'express';
import { getTeachers } from '../../controllers/teachers/getTeachers';
const router = Router();

router.get('/teachers', getTeachers);

export default router;