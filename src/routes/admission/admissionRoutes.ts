import {Router} from 'express'
import { GradeController } from '../../controllers/admission/gradeController';
import { checkActiveResultsProcess } from '../../middleware/admission/checkActiveResultProcess';
import { authenticate, authorizeRole } from '../../middleware/auth/auth';
import { RoleEnum } from '@prisma/client';
const router = Router()

router.post('/admission/send-emails',authenticate, authorizeRole([RoleEnum.ADMIN]), checkActiveResultsProcess,GradeController.sendEmailsGrades)

export default router;