import { Router } from 'express';
import { createProcessController, activateProcessController, deactivateProcessController, updateFinalDateController, getAllProcessesController,
    getAllActiveProcessesController, getAllProcessTypeController} from '../../controllers/admin/processController'
import { authenticate, authorizeRole } from '../../middleware/auth/auth';
import { createProcessValidator, processIdValidator, finalDateValidator } from '../../validators/admin/processValidator';
import { checkActiveProcess } from '../../middleware/admin/checkActiveProcess';
import { RoleEnum } from '@prisma/client';

const router = Router();

router.post('/process',authenticate, authorizeRole([RoleEnum.ADMIN]), createProcessValidator,checkActiveProcess, createProcessController);
router.put('/process/activate',authenticate, authorizeRole([RoleEnum.ADMIN]), processIdValidator,checkActiveProcess, activateProcessController);
router.put('/process/deactivate',authenticate, authorizeRole([RoleEnum.ADMIN]), processIdValidator,checkActiveProcess, deactivateProcessController);
router.put('/process/updateFinalDate',authenticate, authorizeRole([RoleEnum.ADMIN]), finalDateValidator, checkActiveProcess, updateFinalDateController);
router.get('/process/all',authenticate, authorizeRole([RoleEnum.ADMIN]), getAllProcessesController);
router.get('/process/active',authenticate,authorizeRole([RoleEnum.ADMIN]), getAllActiveProcessesController);
router.get('/processType/all',authenticate, authorizeRole([RoleEnum.ADMIN]), getAllProcessTypeController);

export default router;