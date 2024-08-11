import { Router } from 'express';
import { getTeachers } from '../../controllers/teachers/getTeachers';
import { authenticate, authorizeRole } from '../../middleware/auth/auth';
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
const router = Router();

router.get('/', authenticate, authorizeRole(['DEPARTMENT_HEAD']) ,getTeachers);

/**
{
    'identificationCode': number,
    'sectionId': number,
    'grade': double,
    'obs': 'APR'
}
*/
router.post('/submit-grades', 
    authenticate, 
    authorizeRole(['DEPARTMENT_HEAD', 'TEACHER', 'COORDINATOR']),
    checkActiveProcessByTypeIdMiddleware(4),
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

export default router;