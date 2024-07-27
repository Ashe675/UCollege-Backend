import { Router } from 'express';
import {
  createProcessController, activateProcessController, deactivateProcessController, updateFinalDateController, getAllProcessesController,
  getAllActiveProcessesController, getAllProcessTypeController
} from '../../controllers/admin/processController'
import { authenticate, authorizeRole } from '../../middleware/auth/auth';
import { createProcessValidator, processIdValidator, finalDateValidator } from '../../validators/admin/processValidator';
import { checkActiveProcess } from '../../middleware/admin/checkActiveProcess';
import { RoleEnum } from '@prisma/client';
import {
  createTeacher,
  getTeachers,
  getTeacherById,
  getTeacherByDni,
  getTeacherByIdentificationCode,
  updateTeacher,
  deleteTeacher
} from '../../controllers/admin/adminController';

import { validateTeacher, validateTeacherUpdate } from '../../validators/admin/teacherValidator';
import { isValidDepartament, isValidRegionalCenter, isDepartamentInRegionalCenter } from '../../validators/validateRegionalCenter';
import upload from '../../middleware/admission/upload';
import { getTeacherRolesController } from '../../controllers/teachers/getTeachers';


const router = Router();

router.post('/process', authenticate, authorizeRole([RoleEnum.ADMIN]), createProcessValidator, checkActiveProcess, createProcessController);
router.put('/process/activate', authenticate, authorizeRole([RoleEnum.ADMIN]), processIdValidator, checkActiveProcess, activateProcessController);
router.put('/process/deactivate', authenticate, authorizeRole([RoleEnum.ADMIN]), processIdValidator, checkActiveProcess, deactivateProcessController);
router.put('/process/updateFinalDate', authenticate, authorizeRole([RoleEnum.ADMIN]), finalDateValidator, checkActiveProcess, updateFinalDateController);
router.get('/process/all', authenticate, authorizeRole([RoleEnum.ADMIN]), getAllProcessesController);
router.get('/process/active', authenticate, authorizeRole([RoleEnum.ADMIN]), getAllActiveProcessesController);
router.get('/processType/all', authenticate, authorizeRole([RoleEnum.ADMIN]), getAllProcessTypeController);


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
  authenticate,
  authorizeRole(['ADMIN']),
  upload.single('avatar'),
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
router.get('/teacher-by-id/:id',
  authenticate,
  authorizeRole(['ADMIN']),
  getTeacherById
);

router.get('/teacher-by-dni/:dni',
  authenticate,
  authorizeRole(['ADMIN']),
  getTeacherByDni
)

router.get('/teacher-by-code/:identificationCode',
  authenticate,
  authorizeRole(['ADMIN']),
  getTeacherByIdentificationCode
)


// Ruta para actualizar un docente

/**
 * Forma del json para la peticion
 * {
  "firstName": "Jane",
  "middleName": "Elizabeth",
  "lastName": "Doe",
  "secondLastName": "White",
  "email": "jane.elizabeth@example.com",
  "phoneNumber":95496655
  "roleId": 4,
}

 */
router.put('/teacher-update/:identificationCode',
  authenticate,
  authorizeRole(['ADMIN']),
  validateTeacherUpdate,

  updateTeacher
);


// Ruta para eliminar un docente
router.delete('/teacher-delete/:id',
  authenticate,
  authorizeRole(['ADMIN']),
  deleteTeacher
);

router.get('/teacher/roles',
  authenticate,
  authorizeRole([RoleEnum.ADMIN]),
  getTeacherRolesController,
)

export default router;
