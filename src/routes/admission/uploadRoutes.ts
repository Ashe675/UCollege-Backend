import { Router } from "express";
import { GradeController } from '../../controllers/admission/gradeController'
import multer from "multer";
import { checkActiveResultsProcess } from "../../middleware/admission/checkActiveResultProcess";

const upload = multer()

const router = Router()

router.post('/grades',upload.single('grades'),checkActiveResultsProcess,GradeController.readGrades)

export default router