import { Router } from 'express';
import { createTeacher } from '../../controllers/admin/adminController';
import { validateTeacher } from '../../validators/admin/teacherValidator';
import { isValidDepartament, isValidRegionalCenter } from '../../validators/validateRegionalCenter';
import { authenticate, authorizeRole } from '../../middleware/auth/auth'


const router = Router();
/*
Este es el JSON que se debe enviar para consumir la API de creación de profesores:
{
  "dni": "1234567890124",
  "firstName": "John",
  "middleName": "Doe",
  "lastName": "Smith",
  "secondLastName": "Brown",
  "phoneNumber": "1234567890",
  "email": "john.doe@example2.com",
  
}

{
  "dni": "9876543210987",
  "firstName": "Jane",
  "middleName": "Elizabeth",
  "lastName": "Doe",
  "secondLastName": "White",
  "phoneNumber": "0987654321",
  "email": "jane.elizabeth@example.com",
  
  "RegionalCenter_Faculty_Career_id": 1
}
*/
/**
 * 
router.post('/create-teacher',
authenticate, 
authorizeRole(['ADMIN']) ,
validateTeacher, 
isValidRegionalCenter,
isValidDepartament, 
createTeacher);
*/

router.post('/create-teacher' ,
  validateTeacher, 
  isValidRegionalCenter,
  isValidDepartament, 
  
  createTeacher);

export default router;
