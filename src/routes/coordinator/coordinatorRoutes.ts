import express from 'express';
import { RoleEnum } from '@prisma/client';

//middleware
import { authenticate, authorizeRole } from '../../middleware/auth/auth';
import {  checkActiveProcessByTypeIdMiddleware } from '../../middleware/checkActiveProcessGeneric';

//controllers
import { exportExcel, exportPdf } from '../../controllers/coordinator/exportAcademicLoadController';
import { validateCodeIdentificationData } from '../../middleware/codeIdentification/validateCodeIdentificationData';
import { isStudentCode } from '../../validators/departmentHead/isStudentCode';
import { getAcademicHistory } from '../../controllers/departmentHead/departmentHeadController';



const router = express.Router();

router.get('/get-academicLoad/export/excel',
            authenticate,
            authorizeRole([RoleEnum.COORDINATOR]),
            checkActiveProcessByTypeIdMiddleware(5),
            exportExcel
);

router.get('/get-academicLoad/export/pdf',
    authenticate,
    authorizeRole([RoleEnum.COORDINATOR]),
    checkActiveProcessByTypeIdMiddleware(5),
    exportPdf
);

router.get('/student-history/:identificationCode',
    authenticate, 
    authorizeRole([RoleEnum.COORDINATOR]),
    validateCodeIdentificationData,
    isStudentCode,
    getAcademicHistory,
);


export default router;