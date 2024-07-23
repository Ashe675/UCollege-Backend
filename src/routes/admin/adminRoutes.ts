import { Router } from 'express';
import { createProcessController, activateProcessController, deactivateProcessController, updateFinalDateController } from '../../controllers/admin/createProcessController'
import { authenticate, authorizeRole } from '../../middleware/auth/auth';
import { createProcessValidator, processIdValidator, finalDateValidator } from '../../validators/admin/processValidator';
import { checkActiveProcess } from '../../middleware/admin/checkActiveProcess';
import { RoleEnum } from '@prisma/client';

const router = Router();

router.post('/process',authenticate, authorizeRole([RoleEnum.ADMIN]), createProcessValidator,checkActiveProcess, createProcessController);
router.put('/process/activate',authenticate, authorizeRole([RoleEnum.ADMIN]), processIdValidator,checkActiveProcess, activateProcessController);
router.put('/process/deactivate',authenticate, authorizeRole([RoleEnum.ADMIN]), processIdValidator,checkActiveProcess, deactivateProcessController);
router.put('/process/updateFinalDate',authenticate, authorizeRole([RoleEnum.ADMIN]), finalDateValidator, updateFinalDateController);

export default router;