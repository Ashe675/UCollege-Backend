import { Router } from 'express';
import { getTeachers } from '../../controllers/teachers/getTeachers';
import { authenticate, authorizeRole } from '../../middleware/auth/auth';
import { RoleEnum } from '@prisma/client';
import { validateCodeIdentificationData } from '../../middleware/codeIdentification/validateCodeIdentificationData';
import { validateGradeData } from '../../middleware/teacher/validateGrade';
import { existSection } from '../../middleware/enrollStudent/existEntity';
import { validateTeacher } from '../../validators/admin/teacherValidator';
import { setGradeTeacher } from '../../controllers/student/valueTeacherController';
import { checkActiveProcessByTypeIdMiddleware } from '../../middleware/checkActiveProcessGeneric';
import { checkIsAccessToSeccion } from '../../middleware/section/sectionMiddleware';
import { validateSectionId } from '../../validators/sections/sectionValidator';
import { getAllGradeStudent, getGradeStudent } from '../../controllers/student/studentController';

const route =  Router();

/**
 {
    grade: float,
    sectionId: number
 }
 */
route.post('value-teacher/',
    authenticate,
    authorizeRole([RoleEnum.STUDENT]),
    checkActiveProcessByTypeIdMiddleware(4),
    validateGradeData,
    existSection,
    checkIsAccessToSeccion,
    setGradeTeacher,
);


route.get('getGrade/:idSection',
    authenticate,
    authorizeRole([RoleEnum.STUDENT]),
    checkActiveProcessByTypeIdMiddleware(4),
    checkActiveProcessByTypeIdMiddleware(5),
    existSection,
    getGradeStudent,
);

route.get('getAllGrade',
    authenticate,
    authorizeRole([RoleEnum.STUDENT]),
    checkActiveProcessByTypeIdMiddleware(4),
    checkActiveProcessByTypeIdMiddleware(5),
    getAllGradeStudent,
);

export default route;