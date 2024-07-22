import { Router } from 'express';
import { createProcessHandler } from '../../controllers/admin/createProcessControllet'
import { authenticate, authorizeRole } from '../../middleware/auth/auth';
import { RoleEnum } from '@prisma/client';

const router = Router();

router.post('/processes',authenticate, authorizeRole([RoleEnum.ADMIN]), createProcessHandler);

export default router;