import express from 'express';

import { enrollStudent, enrollStudent2 } from '../../controllers/enrollStudent/enrollStudentController';
import { removeEnrollment } from '../../controllers/enrollStudent/deleteEnrollStudentController';

import { enrollStudentValidatorData } from '../../validators/enrollStudent/enrollStudentValidator';
import {existSection, 
        existStudent, 
        notAlreadyEnrolled, 
        validEnrollmentProcess,
        validateStudentEnrollmentPeriod
} from '../../middleware/enrollStudent/existEntity'

import { authenticate, authorizeRole } from '../../middleware/auth/auth';

const router = express.Router();

/**
 * De la tabal Student el id del estudiante
 * De el id de la tabla section
  {
  "sectionId": 4
   }
 * 
 */

router.post('/enroll',
        authenticate, 
        authorizeRole(['STUDENT']), 
        validateStudentEnrollmentPeriod,
        validEnrollmentProcess, 
        existSection,
        existStudent,
        notAlreadyEnrolled,
        enrollStudentValidatorData,
        enrollStudent);

router.delete('/enroll-delete/:sectionId',
        authenticate,
        authorizeRole(['STUDENT']),
        
        validEnrollmentProcess,
        validateStudentEnrollmentPeriod,
        existSection,
        existStudent,
        removeEnrollment
        );

// router.post('/test01',
//         enrollStudent2,
//         )

export default router;