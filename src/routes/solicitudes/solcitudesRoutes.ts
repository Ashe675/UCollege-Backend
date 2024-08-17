import { Router } from 'express';
import { createSolicitudCambiodeCarreraController, createSolicitudCambiodeCentroController, createSolicitudCancelacionExcepcionalController, createSolicitudPagoReposicionController, getSolicitudesCambioCarreraController, getSolicitudesCambioCentroController, getSolicitudesCancelacionController } from '../../controllers/solcitudes/solicitudesController';
import { checkSolicitudPendCambioCarrera, checkSolicitudPendCancelacion, checkSolicitudReposicion, checkSolicitudCambioCentro, validateFilesPresence, validateEnrollments } from "../../middleware/solicitudes/solicitudesMiddleware";
import { authenticate, authorizeRole } from '../../middleware/auth/auth';
import { checkActiveProcessByTypeId2 } from "../../middleware/checkActiveProcessGeneric";
import { ReposicionValidator, RegionalCenterValidator, validateSolicitudCambioCarrera, validateSolicitudCancelacion } from "../../validators/solicitud/solicitudValidators";
import { RoleEnum } from '@prisma/client';
import multer from 'multer';
const upload = multer();
const router = Router();

//OBTENER SOLICITUDES
router.get('/cancelaciones',authenticate, authorizeRole([RoleEnum.COORDINATOR]),getSolicitudesCancelacionController);
router.get('/carreras' ,authenticate,authorizeRole([RoleEnum.COORDINATOR]),getSolicitudesCambioCarreraController);

//CREAR SOLICITUDES
router.post('/cancelaciones',authenticate, authorizeRole([RoleEnum.STUDENT]), upload.array('files'),validateSolicitudCancelacion,checkActiveProcessByTypeId2(7), validateFilesPresence, checkSolicitudPendCancelacion, validateEnrollments ,createSolicitudCancelacionExcepcionalController);
router.post('/carreras',authenticate, authorizeRole([RoleEnum.STUDENT]), validateSolicitudCambioCarrera, checkSolicitudPendCambioCarrera,createSolicitudCambiodeCarreraController);
router.post('/cambio-centro',authenticate, authorizeRole([RoleEnum.STUDENT]),RegionalCenterValidator,checkSolicitudCambioCentro, createSolicitudCambiodeCentroController);
router.post('/pago-reposicion',authenticate, authorizeRole([RoleEnum.STUDENT]), ReposicionValidator, checkActiveProcessByTypeId2(8),checkSolicitudReposicion, createSolicitudPagoReposicionController);

export default router;