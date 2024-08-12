import express from 'express';

import { enrollStudent, enrollStudent2, getAvailableSectionsController, getEnrolledClassesForStudentController,addTeacherGrade } from '../../controllers/enrollStudent/enrollStudentController';
import { removeEnrollment } from '../../controllers/enrollStudent/deleteEnrollStudentController';

import { enrollStudentValidatorData } from '../../validators/enrollStudent/enrollStudentValidator';
import {
        existSection,
        existStudent,
        notAlreadyEnrolled,
        validEnrollmentProcess,
        validateStudentEnrollmentPeriod,
        isSameClass,
        isStudentOfSectionRegion
} from '../../middleware/enrollStudent/existEntity'

import { authenticate, authorizeRole } from '../../middleware/auth/auth';
import { checkActiveProcessByTypeIdMiddleware } from "../../middleware/checkActiveProcessGeneric";

const router = express.Router();

/**
 * De la tabal Student el id del estudiante
 * De el id de la tabla section
  {
  "sectionId": 4
   }
 * 
 */

router.get('/student',
        authenticate,
        authorizeRole(['STUDENT']),
        checkActiveProcessByTypeIdMiddleware(3),
        getAvailableSectionsController
);

router.get('/student/enroll',
        authenticate,
        authorizeRole(['STUDENT']),
        checkActiveProcessByTypeIdMiddleware(3),
        getEnrolledClassesForStudentController
);

router.post('/enroll',
        authenticate,
        authorizeRole(['STUDENT']),
        enrollStudentValidatorData,
        existSection,
        existStudent,
        validateStudentEnrollmentPeriod,
        validEnrollmentProcess,
        isSameClass,
        notAlreadyEnrolled,
        isStudentOfSectionRegion,
        enrollStudent);

router.delete('/enroll-delete/:sectionId',
        authenticate,
        authorizeRole(['STUDENT']),
        existSection,
        existStudent,
        validEnrollmentProcess,
        validateStudentEnrollmentPeriod,
        removeEnrollment
);

// * ISSUE : FALTA EL VALIDATOR
router.post('/teacher-grade/:sectionId',authenticate,authorizeRole(['STUDENT']), addTeacherGrade); 
// router.post('/test01',
//         enrollStudent2,
//         )



export default router;