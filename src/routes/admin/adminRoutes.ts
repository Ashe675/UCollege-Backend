import { Router } from 'express';
import { createTeacher } from '../../controllers/admin/adminController';
import { validateTeacher } from '../../validators/admin/teacherValidator';
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
  "roleId": 2, // Asumiendo que 2 es un ID válido en la tabla Role
  "identificationCode": "ID123458",
  "institutionalEmail": "john.doe2@institution.com",
  "password": "securepassword123"
}
*/

router.post('/create-teacher',authenticate, authorizeRole(['ADMIN']) ,validateTeacher, createTeacher);
//router.post('/create-teacher' ,validateTeacher, createTeacher);

export default router;
