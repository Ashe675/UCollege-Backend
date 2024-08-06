import express from 'express';
import { authenticate, authorizeRole } from '../../middleware/auth/auth';
import { RoleEnum } from '@prisma/client';

import {getAllBuilding} 
from '../../controllers/sections/buildingController';

import { getAllClass } from '../../controllers/departmentHead/classController';

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

router.get('/get-class',
    authenticate, 
    authorizeRole([RoleEnum.DEPARTMENT_HEAD]),
    getAllClass
);

export default router;