import { Router } from 'express';
import { createTeacher, getTeachers, getTeacher } from '../../controllers/admin/adminController';

import { validateTeacher } from '../../validators/admin/teacherValidator';
import { isValidDepartament, isValidRegionalCenter, isDepartamentInRegionalCenter } from '../../validators/validateRegionalCenter';
import { authenticate, authorizeRole } from '../../middleware/auth/auth'


const router = Router();
/*
Este es el JSON que se debe enviar para consumir la API de creación de profesores:
{
  "dni": "9876543210987",
  "firstName": "Jane",
  "middleName": "Elizabeth",
  "lastName": "Doe",
  "secondLastName": "White",
  "phoneNumber": "0987654321",
  "email": "jane.elizabeth@example.com",
  "roleId" : 4
  
  "RegionalCenter_Faculty_Career_id": 1,
  "departamentId" : 1,

}
*/
router.post('/create-teacher',
  //authenticate, 
  //authorizeRole(['ADMIN']) ,
  validateTeacher, 
  isValidRegionalCenter,
  isValidDepartament, 
  isDepartamentInRegionalCenter,
  createTeacher
);

// Ruta para obtener todos los docentes
router.get('/teachers', 
  authenticate, 
  authorizeRole(['ADMIN']),
  getTeachers
);

// Ruta para obtener un docente por ID
router.get('/teacher/:id', 
  authenticate, 
  authorizeRole(['ADMIN']),
  getTeacher
);

/**
// Ruta para actualizar un docente
router.put('/teachers/:id', 
  authenticate, 
  authorizeRole(['ADMIN']) ,
  validateTeacher, 
  isValidRegionalCenter,
  isValidDepartament, 
  isDepartamentInRegionalCenter,
  updateTeacher
  );
  
   * 
// Ruta para eliminar un docente
router.delete('/teachers/:id', 
authenticate, 
authorizeRole(['ADMIN']),
deleteTeacher
);
*/

export default router;
