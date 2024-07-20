import {Router} from 'express'
import { GradeController } from '../../controllers/admission/gradeController';
import { checkActiveResultsProcess } from '../../middleware/admission/checkActiveResultProcess';
const router = Router()

router.post('/admission/send-emails', checkActiveResultsProcess,GradeController.sendEmailsGrades)

export default router;