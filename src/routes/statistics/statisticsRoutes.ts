import { Router } from 'express';
import {
    handleGetAprobadosPorClase,
    handleGetReprobadosPorClase,
    handleGetPorcentajeAprobados,
    handleGetPorcentajeReprobados,
    handleGetPorcentajeAprobadosDepartamento,
    handleGetPorcentajeAprobadosDepartamentoActual,
    handleGetPorcentajeReprobadosDepartamento,
    handleGetPorcentajeReprobadosDepartamentoActual,
    handleGetClaseConMasAprobado,
    handleGetClaseConMasReprobado,
    getEstadisticasDepartmentController,
    getEstadisticasDepartmentControllerActual
} from '../../controllers/statistics/statisticsController';
import { authenticate, authorizeRole } from '../../middleware/auth/auth';
import { RoleEnum } from '@prisma/client';

const router = Router();

// Rutas para estadísticas por clase
router.get('/aprobados/:sectionId', authenticate ,authorizeRole([RoleEnum.DEPARTMENT_HEAD]),handleGetAprobadosPorClase);
router.get('/reprobados/:sectionId',authenticate,authorizeRole([RoleEnum.DEPARTMENT_HEAD]), handleGetReprobadosPorClase);
router.get('/porcentaje-aprobados/:sectionId',authenticate,authorizeRole([RoleEnum.DEPARTMENT_HEAD]), handleGetPorcentajeAprobados);
router.get('/porcentaje-reprobados/:sectionId',authenticate,authorizeRole([RoleEnum.DEPARTMENT_HEAD]), handleGetPorcentajeReprobados);

// Rutas para estadísticas por departamento
router.get('/porcentaje-aprobados-departamento',authenticate,authorizeRole([RoleEnum.DEPARTMENT_HEAD]), handleGetPorcentajeAprobadosDepartamento);
router.get('/porcentaje-aprobados-departamento-actual',authenticate,authorizeRole([RoleEnum.DEPARTMENT_HEAD]), handleGetPorcentajeAprobadosDepartamentoActual);
router.get('/porcentaje-reprobados-departamento',authenticate,authorizeRole([RoleEnum.DEPARTMENT_HEAD]), handleGetPorcentajeReprobadosDepartamento);
router.get('/porcentaje-reprobados-departamento-actual',authenticate,authorizeRole([RoleEnum.DEPARTMENT_HEAD]), handleGetPorcentajeReprobadosDepartamentoActual);

// Rutas para la clase con más aprobados y reprobados
router.get('/clase-con-mas-aprobados',authenticate,authorizeRole([RoleEnum.DEPARTMENT_HEAD]), handleGetClaseConMasAprobado);
router.get('/clase-con-mas-reprobados',authenticate,authorizeRole([RoleEnum.DEPARTMENT_HEAD]), handleGetClaseConMasReprobado);
router.get('/estadisticas-departamento', authenticate,authorizeRole([RoleEnum.DEPARTMENT_HEAD]), getEstadisticasDepartmentController)
router.get('/estadisticas-departamento-actual', authenticate,authorizeRole([RoleEnum.DEPARTMENT_HEAD]), getEstadisticasDepartmentControllerActual)
export default router;
