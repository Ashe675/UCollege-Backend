// src/routes/sectionRoutes.ts
import express from 'express';
import {
  checkActiveProcesMatricula, 
  checkActiveProcessesByTypeIdMiddlewareOR, 
  checkActiveProcessPeriod} 
  from '../../middleware/checkActiveProcessGeneric'
import {
  createSectionController,
  getAllSectionsController,
  getSectionByIdController,
  updateSectionController,
  deleteSectionController,
  getSectionsByTeacherIdController,
  getUserData,
  getSectionByDepartmentController,
  updateSectionCapacityController,
  getTeachersByDepartmentController,
  getTeachersByDepartmentAcademicPeriodController,
  getWaitingListController,
  createSectionControllerNext,
  getSectionsByTeacherIdControllerNext,
  getTeachersByDepartmentAcademicPeriodControllerNext,
  getGradesBySectionIdController,
  getEnrollmentByDepartmentController,
} from '../../controllers/sections/sectionController';

import { 
  validateSectionId, 
  createSectionValidators, 
  validateSectionCapacity,
} from '../../validators/sections/sectionValidator';
import { 
  checkAcademicPeriodValid,
  checkClassExistsAndActive,
  checkClassroomAvailability,
  checkClassroomAvailabilityUpdate,
  checkClassroomExists,
  checkClassroomExistsAndValidate,
  checkClassCareerandCenterandTeacher,
  checkTeacherExistsAndActive,
  checkTeacherScheduleConflict,
  checkTeacherScheduleConflictUpdate,
  validateTeacherId,
  checkSectionandCenterDepartment,
  checkClassroomAvailabilityNext,
  checkTeacherScheduleConflictNext,
  checkClassroomAvailabilityUpdateNext,
  checkTeacherScheduleConflictUpdateNext,

 } from "../../middleware/section/sectionMiddleware";
import { authenticate, authorizeRole } from '../../middleware/auth/auth';
import { RoleEnum } from '@prisma/client';

const router = express.Router();
router.get('/validar/',authenticate, getUserData)
//CREAR SECCIONES
router.post('/',
  authenticate,
  authorizeRole([RoleEnum.DEPARTMENT_HEAD]),
  createSectionValidators, 
  checkActiveProcessesByTypeIdMiddlewareOR([3]),
  checkClassExistsAndActive, 
  checkClassroomExistsAndValidate, //corregir por periodo
  checkClassroomAvailability, //corregir por periodo
  checkTeacherExistsAndActive,
  checkClassCareerandCenterandTeacher,
  checkTeacherScheduleConflict, //corregir por periodo
  createSectionController
  );
  //CREAR SECCIONES SIGUEINTE PERIODO
router.post('/next',
  authenticate,
  authorizeRole([RoleEnum.DEPARTMENT_HEAD]),
  createSectionValidators, 
  checkActiveProcessesByTypeIdMiddlewareOR([6]),
  checkClassExistsAndActive, 
  checkClassroomExistsAndValidate, 
  checkClassroomAvailabilityNext, //corregir por periodo
  checkTeacherExistsAndActive,
  checkClassCareerandCenterandTeacher,
  checkTeacherScheduleConflictNext, //corregir por periodo
  createSectionControllerNext
);
//OBTENER TODAS LAS SECCIONES
router.get('/', 
  authenticate,
  authorizeRole([RoleEnum.ADMIN]),
  getAllSectionsController);
//OBTENER TODOS LOS MATRICULADOS DEL DEPARTAMRNTO
router.get('/enrollments/current/',
  authenticate, 
  authorizeRole([RoleEnum.DEPARTMENT_HEAD]),
  getEnrollmentByDepartmentController)
//OBTENER SECCIONES POR MAESTRO
router.get('/teacher/', 
  authenticate,
  authorizeRole([RoleEnum.DEPARTMENT_HEAD, RoleEnum.COORDINATOR, RoleEnum.TEACHER]),
  getSectionsByTeacherIdController);
//OBTENER SECCIONES POR MAESTRO SIGUIENTE PERIODO
router.get('/teacher/next', 
  authenticate,
  authorizeRole([RoleEnum.DEPARTMENT_HEAD, RoleEnum.COORDINATOR, RoleEnum.TEACHER]),
  getSectionsByTeacherIdControllerNext);
//OBTENER MAESTROS DE DEPARTAMENTO
router.get('/department/teacher',
  authenticate,
  authorizeRole([RoleEnum.DEPARTMENT_HEAD]),
  getTeachersByDepartmentController
)
//OBTENER SECCIONES POR DEPARTAMENTO AUTENTICADO
router.get('/department', 
  authenticate, 
  authorizeRole([RoleEnum.DEPARTMENT_HEAD]),
  getSectionByDepartmentController)
//OBTENER SECCIONES POR DEPARTAMENTO AUTENTICADO PERIODO ACTUAL
router.get('/department/actual', 
  authenticate, 
  authorizeRole([RoleEnum.DEPARTMENT_HEAD]),
  getTeachersByDepartmentAcademicPeriodController)
//OBTENER SECCIONES POR DEPARTAMENTO AUTENTICADO SIGUIENTE PERIODO
router.get('/department/next', 
  authenticate, 
  authorizeRole([RoleEnum.DEPARTMENT_HEAD]),
  getTeachersByDepartmentAcademicPeriodControllerNext)
//OBTENER SECCION POR ID
router.get('/:id', 
  authenticate,
  authorizeRole([RoleEnum.DEPARTMENT_HEAD]),
  checkSectionandCenterDepartment,
  validateSectionId, 
  getSectionByIdController);
//ACTUALIZAR SECCION
router.put('/:id', 
  authenticate,
  authorizeRole([RoleEnum.DEPARTMENT_HEAD]),
  createSectionValidators,
  checkSectionandCenterDepartment,
  validateSectionId,
  checkActiveProcessesByTypeIdMiddlewareOR([3]),
  checkClassExistsAndActive, 
  checkClassroomExistsAndValidate,
  checkClassroomAvailabilityUpdate,
  checkTeacherExistsAndActive,
  checkTeacherScheduleConflictUpdate,
  checkClassCareerandCenterandTeacher,
  updateSectionController);
//ACTUALIZAR SECCION SIGUIENTE PERIODO
router.put('/next/:id', 
  authenticate,
  authorizeRole([RoleEnum.DEPARTMENT_HEAD]),
  createSectionValidators,
  checkSectionandCenterDepartment,
  validateSectionId,
  checkActiveProcessesByTypeIdMiddlewareOR([6]),
  checkClassExistsAndActive, 
  checkClassroomExistsAndValidate,
  checkClassroomAvailabilityUpdateNext,
  checkTeacherExistsAndActive,
  checkTeacherScheduleConflictUpdateNext,
  checkClassCareerandCenterandTeacher,
  updateSectionController);

//AUMENTAR CUPOS
router.put('/capacity/:id',
  authenticate,
  authorizeRole([RoleEnum.DEPARTMENT_HEAD]),
  checkActiveProcessesByTypeIdMiddlewareOR([3,6]),
  checkSectionandCenterDepartment,
  validateSectionCapacity,
  updateSectionCapacityController
)

router.put('/deactivate/:id', 
  authenticate,
  authorizeRole([RoleEnum.DEPARTMENT_HEAD]),
  checkActiveProcessesByTypeIdMiddlewareOR([3,6]),
  checkSectionandCenterDepartment,
  validateSectionId, 
  deleteSectionController);
router.get('/grades/:sectionId', 
  authenticate, 
  authorizeRole([RoleEnum.DEPARTMENT_HEAD, RoleEnum.COORDINATOR, RoleEnum.TEACHER]),
  getGradesBySectionIdController); 

// Define la ruta para obtener la lista de espera de estudiantes de una sección
router.get('/waiting-list/:sectionId', getWaitingListController);

export default router;


