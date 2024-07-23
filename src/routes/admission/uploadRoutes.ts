import { Router } from "express";
import { GradeController } from '../../controllers/admission/gradeController'
import multer from "multer";
import { checkActiveResultsProcess } from "../../middleware/admission/checkActiveResultProcess";
import { authenticate, authorizeRole } from "../../middleware/auth/auth";
import { RoleEnum } from "@prisma/client";

const upload = multer()

const router = Router()

router.post('/grades',
    authenticate,
    authorizeRole([RoleEnum.ADMIN]),
    upload.single('grades'), 
    checkActiveResultsProcess, 
    GradeController.readGrades)

export default router