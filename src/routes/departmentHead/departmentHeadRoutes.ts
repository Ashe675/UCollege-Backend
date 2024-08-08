import express from 'express';
import { RoleEnum } from '@prisma/client';

//middleware
import { authenticate, authorizeRole } from '../../middleware/auth/auth';
import {validateCodeIdentificationData} from '../../middleware/codeIdentification/validateCodeIdentificationData'

//validators
import {isStudentCode} from '../../validators/departmentHead/isStudentCode'

//Controladores
import {getAllBuilding} 
from '../../controllers/sections/buildingController';
import { getAllClass } from '../../controllers/departmentHead/classController';
import { getAcademicHistory } from '../../controllers/departmentHead/departmentHeadController'



const router = express.Router();

/**
 * -----------------------------------------------------------------------------
 * Autor: Cesar Abraham Banegas Figueroa
 * Correo: cabanegasf@unah.hn
 * Propósito: Desarrollo de las rutas par edificios
 * -----------------------------------------------------------------------------
 */
router.get('/buildings-rooms',
    authenticate, 
    authorizeRole([RoleEnum.DEPARTMENT_HEAD]),
    getAllBuilding
);

router.get('/classes',
    authenticate, 
    authorizeRole([RoleEnum.DEPARTMENT_HEAD]),
    getAllClass
);

router.get('/student-history/:identificationCode',
    authenticate, 
    authorizeRole([RoleEnum.DEPARTMENT_HEAD]),
    validateCodeIdentificationData,
    isStudentCode,
    getAcademicHistory,
);

export default router;