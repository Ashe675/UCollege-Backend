import { Router } from 'express';
import { getTeachers } from '../../controllers/teachers/getTeachers';
import { authenticate, authorizeRole } from '../../middleware/auth/auth';
import { updateSectionInfoController } from "../../controllers/teachers/teacherController";
import { authorizeTeacherMiddleware } from "../../middleware/teacher/teacherMiddleware";
import { RoleEnum } from '@prisma/client';
import { checkActiveProcessByTypeIdMiddleware, checkActiveProcessesByTypeIdMiddlewareOR } from '../../middleware/checkActiveProcessGeneric';
import { submitGradesController } from '../../controllers/teachers/submitGradeController';
import { checkEnrollStudent } from '../../middleware/enrollStudent/checkEnrollStudent';
import { isStudentCode } from '../../validators/departmentHead/isStudentCode';
import { validateCodeIdentificationData } from '../../middleware/codeIdentification/validateCodeIdentificationData';
import { validateObsData } from '../../middleware/teacher/validateObs';
import { validateGradeData } from '../../middleware/teacher/validateGrade';
import { validateSectionId } from '../../validators/sections/sectionValidator';
import { validateSectionIdData } from '../../middleware/teacher/validateSectionId';
import { getSectionsByTeacherId } from '../../services/sections/sectionService';
import { getSectionController } from '../../controllers/teachers/getSectionController';
import { sendEmailStudentController } from '../../controllers/teachers/sendEmailStudentsController';
import { checkIsAccessToSeccion } from '../../middleware/section/sectionMiddleware';
const router = Router();

router.get('/', authenticate, authorizeRole(['DEPARTMENT_HEAD']) ,getTeachers);

/**
{
    'identificationCode': 'number',
    'sectionId': number,
    'grade': double,
    'obs': 'APR'
}
*/
router.post('/submit-grades', 
    authenticate, 
    authorizeRole(['DEPARTMENT_HEAD', 'TEACHER', 'COORDINATOR']),
    checkActiveProcessByTypeIdMiddleware(4),
    checkActiveProcessByTypeIdMiddleware(5),
    validateObsData,
    validateCodeIdentificationData,
    validateGradeData,
    validateSectionIdData,
    isStudentCode,
    checkEnrollStudent,
    submitGradesController
);

router.get('/sections',
    authenticate,
    authorizeRole(['DEPARTMENT_HEAD', 'TEACHER', 'COORDINATOR']),
    getSectionController,
)

router.put('/section-info/:id',
    authenticate,
    authorizeRole(['DEPARTMENT_HEAD', 'TEACHER', 'COORDINATOR']),
    checkIsAccessToSeccion,
    updateSectionInfoController
)

router.post('/complete-grade-entry',
    authenticate, 
    authorizeRole(['DEPARTMENT_HEAD', 'TEACHER', 'COORDINATOR']),
    checkActiveProcessByTypeIdMiddleware(4),
    checkActiveProcessByTypeIdMiddleware(5),
    sendEmailStudentController,
)

export default router;