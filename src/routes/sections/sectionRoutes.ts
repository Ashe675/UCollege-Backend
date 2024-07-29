// src/routes/sectionRoutes.ts
import express from 'express';
import {
  checkActiveProcesMatricula, 
  checkActiveProcessPeriod} 
  from '../../middleware/checkActiveProcessGeneric'
import {
  createSectionController,
  getAllSectionsController,
  getSectionByIdController,
  updateSectionController,
  deleteSectionController,
  getSectionsController,
  getUserData,
  getSectionByDepartmentController,
  updateSectionCapacityController,
  getTeachersByDepartmentController
} from '../../controllers/sections/sectionController';
import { 
  validateSectionId, 
  createSectionValidators, 
  checkSectionExists, 
  checkSectionExistsUpdate,
  validateSectionCapacity
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
  validateTeacherId

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
  checkActiveProcessPeriod,
  checkActiveProcesMatricula,
  checkClassExistsAndActive, 
  checkClassroomExistsAndValidate,
  checkClassroomAvailability,
  checkTeacherExistsAndActive,
  checkClassCareerandCenterandTeacher,
  checkTeacherScheduleConflict,
  createSectionController,
  );
//OBTENER TODAS LAS SECCIONES
router.get('/', 
  authenticate,
  authorizeRole([RoleEnum.ADMIN]),
  getAllSectionsController);
//OBTENER SECCIONES POR MAESTRO
router.get('/teacher/:teacherId', 
  authenticate,
  authorizeRole([RoleEnum.DEPARTMENT_HEAD, RoleEnum.COORDINATOR, RoleEnum.TEACHER]),
  validateTeacherId, 
  getSectionsController);
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
//OBTENER SECCION POR ID
router.get('/:id', 
  authenticate,
  authorizeRole([RoleEnum.DEPARTMENT_HEAD]),
  validateSectionId, 
  getSectionByIdController);
//ACTUALIZAR SECCION
router.put('/:id', 
  authenticate,
  authorizeRole([RoleEnum.DEPARTMENT_HEAD]),
  createSectionValidators,
  validateSectionId,
  checkActiveProcessPeriod,
  checkActiveProcesMatricula,
  checkClassExistsAndActive, 
  checkClassroomExistsAndValidate,
  checkClassroomAvailabilityUpdate,
  checkTeacherExistsAndActive,
  checkTeacherScheduleConflictUpdate,
  checkClassCareerandCenterandTeacher,
  updateSectionController);
//AUMENTAR CUPOS
router.put('/capacity/:id',
  authenticate,
  authorizeRole([RoleEnum.DEPARTMENT_HEAD]),
  validateSectionCapacity,
  updateSectionCapacityController
)
router.delete('/:id', 
  authenticate,
  authorizeRole([RoleEnum.DEPARTMENT_HEAD]),
  validateSectionId, 
  deleteSectionController);

export default router;
