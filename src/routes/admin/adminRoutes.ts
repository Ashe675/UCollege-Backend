import { Router } from 'express';
import {
  createProcessController, activateProcessController, deactivateProcessController, updateFinalDateController, getAllProcessesController,
  getAllActiveProcessesController, getAllProcessTypeController
} from '../../controllers/admin/processController'
import { authenticate, authorizeRole } from '../../middleware/auth/auth';
import { createProcessValidator, processIdValidator, finalDateValidator } from '../../validators/admin/processValidator';
import { activateEnrollmentValidator } from '../../validators/admin/enrollmentValidator';

import {validateCodeIdentificationData} from '../../middleware/codeIdentification/validateCodeIdentificationData'

import { checkActiveProcess } from '../../middleware/admin/checkActiveProcess';
import { RoleEnum } from '@prisma/client';
import {
  createTeacher,
  getTeachers,
  getTeacherById,
  getTeacherByDni,
  getTeacherByIdentificationCode,
  updateTeacher,
  deleteTeacher,
  updateTeacherCenters,
  getTeachersPagination,
  desactiveTeacher,
  activateTeacher
 } from '../../controllers/admin/teacherAdminController';
 import { changeRoleController } from '../../controllers/admin/changeRoleController';

 import {getAllDepartments} from '../../services/admin/getAllDepartent'

 import { activateEnrollment } from '../../controllers/admin/enrollmentController';

import { getAllRegionalCentersWithDepartments } from '../../controllers/admin/departmentController';

import { validateTeacher, validateTeacherUpdate, validateChangeRegionalCenterData } from '../../validators/admin/teacherValidator';
import { isValidDepartament, isValidRegionalCenter, isDepartamentInRegionalCenter } from '../../middleware/validateRegionalCenter';
import upload from '../../middleware/admission/upload';
import { getTeacherRolesController } from '../../controllers/teachers/getTeachers';
import { checkDaysComplete, isActiveProcessByProcessTypeIdGeneric } from '../../middleware/enroll/enrollMiddlewares';
import { checkActiveProcessByTypeIdMiddleware } from '../../middleware/checkActiveProcessGeneric';
import { isRoleTeacher } from '../../middleware/admin/isRoleTeacher';


const router = Router();

router.post('/process', authenticate, authorizeRole([RoleEnum.ADMIN]), createProcessValidator, checkActiveProcess ,createProcessController);
router.put('/process/activate', authenticate, authorizeRole([RoleEnum.ADMIN]), processIdValidator, checkActiveProcess, activateProcessController);
router.put('/process/deactivate', authenticate, authorizeRole([RoleEnum.ADMIN]), processIdValidator, checkActiveProcess, deactivateProcessController);
router.put('/process/updateFinalDate', authenticate, authorizeRole([RoleEnum.ADMIN]), finalDateValidator, checkActiveProcess, updateFinalDateController);
router.get('/process/all', authenticate, authorizeRole([RoleEnum.ADMIN]), getAllProcessesController);
router.get('/process/active', authenticate, authorizeRole([RoleEnum.ADMIN]), getAllActiveProcessesController);
router.get('/processType/all', authenticate, authorizeRole([RoleEnum.ADMIN]), getAllProcessTypeController);


/*
Este es el JSON que se debe enviar para consumir la API de creación de profesores:

form data -> para probar en postman
{
  "dni": "9876543210987",
  "firstName": "Jane",
  "middleName": "Elizabeth",
  "lastName": "Doe",
  "secondLastName": "White",
  "phoneNumber": "0987654321",
  "email": "jane.elizabeth@example.com",
  "roleId" : 4
  
  "regionalCenter": 1,
  "departamentId" : 1,

  "avata": file

}
*/
router.post('/create-teacher',
  authenticate,
  authorizeRole(['ADMIN']),
  upload.single('avatar'),
  validateTeacher,
  isValidDepartament,
  isValidRegionalCenter,
  isDepartamentInRegionalCenter,
  createTeacher
);

// Ruta para obtener todos los docentes
router.get('/teachers',
  authenticate,
  authorizeRole(['ADMIN']),
  getTeachers
);

router.get('/teachers-pagination',
  authenticate,
  authorizeRole(['ADMIN']),
  getTeachersPagination
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


// Ruta para eliminar un docente (No recomendada es destructiva)
router.delete('/teacher-delete/:id',
  authenticate,
  authorizeRole(['ADMIN']),
  deleteTeacher
);

// Ruta para desactivar y activar un docente
router.put('/teacher-desactivate/:id',
  authenticate,
  authorizeRole(['ADMIN']),
  desactiveTeacher
);

router.put('/teacher-activate/:id',
  authenticate,
  authorizeRole(['ADMIN']),
  activateTeacher
);


/**
 * Body de la peticion :
 * {
 *  regionalCenterId: number
 *  departmentId: number
 *  roleId: number
 * }
 */
router.put('/teachers/update-centers/:teacherCode',
  authenticate,
  authorizeRole(['ADMIN']),
  validateChangeRegionalCenterData,
  isValidDepartament,
  isValidRegionalCenter,
  isDepartamentInRegionalCenter,
  updateTeacherCenters
);


// obtener todos los departamentos por Centro regional
router.get('/center/department',
  authenticate,
  authorizeRole(['ADMIN']),
  getAllRegionalCentersWithDepartments
);


router.get('/teacher/roles',
  authenticate,
  authorizeRole([RoleEnum.ADMIN]),
  getTeacherRolesController,
)

//
router.post('/enroll/activate', 
              authenticate, 
              authorizeRole(['ADMIN']),
              activateEnrollmentValidator,
              checkActiveProcessByTypeIdMiddleware(5),
              isActiveProcessByProcessTypeIdGeneric, 
              checkDaysComplete,
              activateEnrollment);

router.get('/getAllDataDepartment',
            getAllDepartments,
)


/**
 * {
 *  'roleName': 'ADMIN'
 * }
 */
router.put('/change-role/:identificationCode',
  authenticate,
  authorizeRole([RoleEnum.ADMIN]),
  validateCodeIdentificationData,
  isRoleTeacher,
  changeRoleController,
  
)

export default router;
