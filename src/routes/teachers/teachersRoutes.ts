import { Router } from 'express';
import { getTeachers } from '../../controllers/teachers/getTeachers';
import { authenticate, authorizeRole } from '../../middleware/auth/auth';
const router = Router();

router.get('/', authenticate, authorizeRole(['DEPARTMENT_HEAD']) ,getTeachers);

export default router;