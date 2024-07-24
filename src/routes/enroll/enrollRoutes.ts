import { Router } from "express";
import { authenticate, authenticateVerifiedLess, authorizeRole } from "../../middleware/auth/auth";
import { RoleEnum } from "@prisma/client";
import { EnrollValidator } from "../../validators/enroll/enrollValidators";
import { EnrollController } from "../../controllers/enroll/enrollController";
import multer from "multer";

const upload = multer()

const router = Router()

router.post('/student/select-career', 
    authenticateVerifiedLess, 
    authorizeRole([RoleEnum.STUDENT]), 
    ...EnrollValidator.selectCareerValidator(),
    EnrollController.selectCareer
)

router.post('/student/upload-admitteds',
    authenticate, 
    authorizeRole([RoleEnum.ADMIN]),
    upload.array('estudiantes_admitidos'),
    EnrollController.readCSVStudentsAdmitteds )

export default router