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
import { accetSolicitudCarrer, accetSolicitudClass, declineSolicitud } from '../../controllers/coordinator/solicitudController';



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

router.put('/solicitude/career-change/accept/:idSolicitud',
    authenticate,
    authorizeRole([RoleEnum.COORDINATOR]),
    accetSolicitudCarrer
);

router.put('/solicitude/career-change/decline/:idSolicitud',
    authenticate,
    authorizeRole([RoleEnum.COORDINATOR]),
    declineSolicitud
);

router.put('/solicitude/class-cancel/accept/:idSolicitud',
    authenticate,
    authorizeRole([RoleEnum.COORDINATOR]),
    accetSolicitudClass
);

router.put('/solicitude/class-cancel/decline/:idSolicitud',
    authenticate,
    authorizeRole([RoleEnum.COORDINATOR]),
    declineSolicitud,
);


export default router;