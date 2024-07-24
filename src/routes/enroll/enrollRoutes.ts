import { Router } from "express";
import { authenticateVerifiedLess, authorizeRole } from "../../middleware/auth/auth";
import { RoleEnum } from "@prisma/client";
import { EnrollValidator } from "../../validators/enroll/enrollValidators";
import { EnrollController } from "../../controllers/enroll/enrollController";

const router = Router()

router.post('/student/select-career', 
    authenticateVerifiedLess, 
    authorizeRole([RoleEnum.STUDENT]), 
    ...EnrollValidator.selectCareerValidator(),
    EnrollController.selectCareer
)

router.get('/student/upload-admitteds', EnrollController.readCSVStudentsAdmitteds )

export default router