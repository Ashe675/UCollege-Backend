import { Router } from 'express';
import { getSolicitudesCancelacionController } from '../../controllers/solcitudes/solicitudesController';
import { authenticate, authorizeRole } from '../../middleware/auth/auth';
import { RoleEnum } from '@prisma/client';
const router = Router();

router.get('/cancelaciones' ,getSolicitudesCancelacionController);

export default router;