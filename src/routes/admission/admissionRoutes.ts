import {Router} from 'express'
import { GradeController } from '../../controllers/admission/gradeController';
const router = Router()

router.post('/admission/send-emails', GradeController.sendEmailsGrades)

export default router;