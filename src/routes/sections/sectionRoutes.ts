// src/routes/sectionRoutes.ts
import express from 'express';
import multer from 'multer';
import {
  checkActiveProcesMatricula, 
  checkActiveProcessByTypeIdMiddleware, 
  checkActiveProcessesByTypeIdMiddlewareOR, 
  checkActiveProcessPeriod} 
  from '../../middleware/checkActiveProcessGeneric'
import { validateFrontSection } from "../../middleware/resource/resourceMiddleware";
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
  // getGradesBySectionIdController,
  getEnrollmentByDepartmentController,
  getTeachersByDepartmentPageController,
  getSectionEnrollmentsExcel,
  getSectionsByStudentIdController,
  getSectionByUserIdController,
  getGradesBySectionIdController,
} from '../../controllers/sections/sectionController';

import { 
  validateSectionId, 
  createSectionValidators, 
  validateSectionCapacity,
  validateSectionIdActive,
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
  validateCapacityChange,
  checkIsAccessToSeccion,

 } from "../../middleware/section/sectionMiddleware";

 import { validateDayUv } from '../../validators/sections/validateDayUv';

import { authenticate, authorizeRole } from '../../middleware/auth/auth';
import { RoleEnum } from '@prisma/client';
import { deleteFileController, uploadFileController } from '../../controllers/resources/resourcesController';
import { authorizeTeacherMiddleware, authorizeTeacherMiddlewareDelete } from '../../middleware/teacher/teacherMiddleware';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Usar almacenamiento en memoria
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
  validateDayUv,
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
  validateDayUv,
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
  checkActiveProcessByTypeIdMiddleware(5),
  getSectionsByTeacherIdController);

  
//OBTENER SECCION POR USUARIO
router.get('/space/:id', 
  authenticate,
  authorizeRole([RoleEnum.DEPARTMENT_HEAD, RoleEnum.COORDINATOR, RoleEnum.TEACHER, RoleEnum.STUDENT]),
  checkIsAccessToSeccion,
  getSectionByUserIdController);

//OBTENER SECCIONES POR STUDENT
router.get('/student/', 
  authenticate,
  authorizeRole([RoleEnum.STUDENT]),
  checkActiveProcessByTypeIdMiddleware(5),
  getSectionsByStudentIdController);

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
);
router.get('/department/teacher-page/',
  authenticate,
  authorizeRole([RoleEnum.DEPARTMENT_HEAD]),
  getTeachersByDepartmentPageController
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
router.get('/download/:id', 
    authenticate,
    authorizeRole([RoleEnum.DEPARTMENT_HEAD, RoleEnum.COORDINATOR, RoleEnum.TEACHER]),
    checkSectionandCenterDepartment,
    validateSectionId, 
    getSectionEnrollmentsExcel);
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
  validateCapacityChange,
  updateSectionCapacityController
)

router.put('/deactivate/:id', 
  authenticate,
  authorizeRole([RoleEnum.DEPARTMENT_HEAD]),
  checkActiveProcessesByTypeIdMiddlewareOR([3,6]),
  checkSectionandCenterDepartment,
  validateSectionId, 
  deleteSectionController);

//OBTENER NOTAS DE UNA SECCION
router.get('/grades/:id', 
authenticate, 
authorizeRole([RoleEnum.DEPARTMENT_HEAD, RoleEnum.COORDINATOR, RoleEnum.TEACHER]),
getGradesBySectionIdController); 

// Define la ruta para obtener la lista de espera de estudiantes de una sección
router.get('/waiting-list/:sectionId', getWaitingListController);

router.post('/resources/:id', 
  authenticate,
  authorizeRole([RoleEnum.DEPARTMENT_HEAD, RoleEnum.COORDINATOR, RoleEnum.TEACHER]),
  validateSectionId, 
  validateSectionIdActive,
  authorizeTeacherMiddleware,
  upload.single('file'), 
  validateFrontSection,
  uploadFileController);

router.delete('/resources/:id',
  authenticate,
  authorizeRole([RoleEnum.DEPARTMENT_HEAD, RoleEnum.COORDINATOR, RoleEnum.TEACHER]),
  authorizeTeacherMiddlewareDelete,
  deleteFileController);

export default router;


