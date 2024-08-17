import { Router } from 'express';
import { createSolicitudCambiodeCarreraController, createSolicitudCambiodeCentroController, createSolicitudCancelacionExcepcionalController, createSolicitudPagoReposicionController, getSolicitudesCambioCarreraController, getSolicitudesCambioCarreraStudentController, getSolicitudesCambioCentroController, getSolicitudesCancelacionController, getSolicitudesCancelacionStudentController, getSolicitudesPagoReposicionController } from '../../controllers/solcitudes/solicitudesController';
import { checkSolicitudPendCambioCarrera, checkSolicitudPendCancelacion, checkSolicitudReposicion, checkSolicitudCambioCentro, validateFilesPresence, validateEnrollments } from "../../middleware/solicitudes/solicitudesMiddleware";
import { authenticate, authorizeRole } from '../../middleware/auth/auth';
import { checkActiveProcessByTypeId2 } from "../../middleware/checkActiveProcessGeneric";
import { ReposicionValidator, RegionalCenterValidator, validateSolicitudCambioCarrera, validateSolicitudCancelacion } from "../../validators/solicitud/solicitudValidators";
import { RoleEnum } from '@prisma/client';
import multer from 'multer';
const upload = multer();
const router = Router();

//OBTENER SOLICITUDES COORDINADOR
router.get('/cancelaciones-coordinator',authenticate, authorizeRole([RoleEnum.COORDINATOR]),getSolicitudesCancelacionController);
router.get('/carreras-coodinator' ,authenticate,authorizeRole([RoleEnum.COORDINATOR]),getSolicitudesCambioCarreraController);

//ESTUDIANTE
router.get('/cambio-centro' ,authenticate,authorizeRole([RoleEnum.STUDENT]),getSolicitudesCambioCentroController);
router.get('/pago-reposicion' ,authenticate,authorizeRole([RoleEnum.STUDENT]),getSolicitudesPagoReposicionController);
router.get('/cancelaciones' ,authenticate,authorizeRole([RoleEnum.STUDENT]),getSolicitudesCancelacionStudentController);
router.get('/carreras' ,authenticate,authorizeRole([RoleEnum.STUDENT]),getSolicitudesCambioCarreraStudentController);

//CREAR SOLICITUDES
router.post('/cancelaciones',authenticate, authorizeRole([RoleEnum.STUDENT]), upload.array('files'),validateSolicitudCancelacion,checkActiveProcessByTypeId2(7), validateFilesPresence, checkSolicitudPendCancelacion, validateEnrollments ,createSolicitudCancelacionExcepcionalController);
router.post('/carreras',authenticate, authorizeRole([RoleEnum.STUDENT]), validateSolicitudCambioCarrera, checkSolicitudPendCambioCarrera,createSolicitudCambiodeCarreraController);
router.post('/cambio-centro',authenticate, authorizeRole([RoleEnum.STUDENT]),RegionalCenterValidator,checkSolicitudCambioCentro, createSolicitudCambiodeCentroController);
router.post('/pago-reposicion',authenticate, authorizeRole([RoleEnum.STUDENT]), ReposicionValidator, checkActiveProcessByTypeId2(8),checkSolicitudReposicion, createSolicitudPagoReposicionController);

export default router;