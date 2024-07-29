import express from 'express';

import { enrollStudent } from '../../controllers/enrollStudent/enrollStudentController';
import { enrollStudentValidatorData } from '../../validators/enrollStudent/enrollStudentValidator';
import {existSection, 
        existStudent, 
        notAlreadyEnrolled, 
        validEnrollmentProcess,
        validateStudentEnrollmentPeriod
} from '../../middleware/enrollStudent/existEntity'

const router = express.Router();

/**
 * De la tabal Student el id del estudiante
 * De el id de la tabla section
  {
  "studentId": 5,
  "sectionId": 4
   }
 * 
 */

router.post('/enroll',
        validateStudentEnrollmentPeriod,
        validEnrollmentProcess, 
        existSection,
        existStudent,
        notAlreadyEnrolled,
        enrollStudentValidatorData,
        enrollStudent);

export default router;