import { Router } from 'express';
import { getTeachers } from '../../controllers/teachers/getTeachers';
import { authenticate, authorizeRole } from '../../middleware/auth/auth';
import { updateSectionController } from "../../controllers/teachers/teacherController";
import { authorizeTeacherMiddleware } from "../../middleware/teacher/teacherMiddleware";
import { RoleEnum } from '@prisma/client';
const router = Router();

router.get('/', authenticate, authorizeRole(['DEPARTMENT_HEAD']) ,getTeachers);
router.put('/section-info/:id',authenticate,authorizeRole([RoleEnum.DEPARTMENT_HEAD, RoleEnum.COORDINATOR, RoleEnum.TEACHER]),authorizeTeacherMiddleware, updateSectionController);

export default router;