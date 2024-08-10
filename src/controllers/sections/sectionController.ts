// src/controllers/sectionController.ts
import { Request, Response } from 'express';
import { prisma } from '../../config/db';
import {
  createSection,
  getAllSections,
  getSectionById,
  updateSection,
  deleteSection,
  getSectionsByTeacherId,
  getSectionByDepartment,
  updateSectionCapacity,
  getTeachersByDepartment,
  getSectionByDepartmentActual,
  getWaitingListById,
  createSectionNext,
  getSectionsByTeacherIdNext,
  getSectionByDepartmentActualNext,
  getGradesBySectionId,
  getEnrollmentsActual,
  getTeachersByDepartmentPagination,
  downloadSectionEnrollmentsExcel,
} from '../../services/sections/sectionService';
import { getRegionalCenterTeacher } from "../../utils/teacher/getTeacherCenter";
import { getRegionalCenterSection, } from "../../utils/section/sectionUtils";

export const createSectionController = async (req: Request, res: Response) => {
  try {
    const newSection = await createSection(req.body, req);
    res.status(201).json(newSection);
  } catch (error) {
    console.error('Error creando la sección:', error);
    res.status(400).json({ error: error.message });
  }
};

export const createSectionControllerNext = async (req: Request, res: Response) => {
  try {
    const newSection = await createSectionNext(req.body, req);
    res.status(201).json(newSection);
  } catch (error) {
    console.error('Error creando la sección:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getAllSectionsController = async (req: Request, res: Response) => {
  try {
    const sections = await getAllSections();
    res.status(200).json(sections);
  } catch (error) {
    console.error('Error obteniendo secciones:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getUserData = async (req: Request, res: Response) => {
  try {
      const user = req.user;

      if (!user) {
          return res.status(401).json({ error: 'Not authorized' });
      }

      // Devolver todos los datos del usuario autenticado
      res.status(200).json(user);
  } catch (error) {
      console.error('Error fetching user data:', error);
      res.status(400).json({ error: error.message });
  }
};

export const getSectionByIdController = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const section = await getSectionById(Number(id));
    if (section) {
      res.status(200).json(section);
    } else {
      res.status(404).json({ error: 'Sección no encontrada' });
    }
  } catch (error) {
    console.error('Error obteniendo sección:', error);
    res.status(400).json({ error: error.message });
    
  }
};

export const getSectionByDepartmentController = async (req: Request, res: Response) => {
  try {
    const sections = await getSectionByDepartment(req);
    res.json(sections);
  } catch (error) {
    res.status(400).json({ message: 'Error retrieving sections', error });
  }
}; 

export const getEnrollmentByDepartmentController = async (req: Request, res: Response) => {
  try {
    const sections = await getEnrollmentsActual(req);
    res.json(sections);
  } catch (error) {
    res.status(400).json({ message: 'Error retrieving sections', error });
  }
}; 

export const updateSectionController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const sectionData = req.body;

  try {
    const updatedSection = await updateSection(Number(id), sectionData, req);
    res.status(200).json({
      message: 'Sección actualizada correctamente',
      updatedSection,
    });
  } catch (error) {
    console.error('Error actualizando sección:', error);
    res.status(400).json({ error: error.message });
  }
};

export const deleteSectionController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { justification } = req.body;
  const userId = req.user.id;

  if (!justification || justification.trim() === "") {
    return res.status(400).json({ error: "La justificación es necesaria y no debe ir vacía" });
  }

  try {
    const teacherCenter = await getRegionalCenterTeacher(userId);
    const sectionCenter = await getRegionalCenterSection(Number(id));

    if (teacherCenter !== sectionCenter) {
      return res.status(403).json({ error: "No pertenece al centro de la sección" });
    }

    const updatedSection = await deleteSection(Number(id), justification);
    res.status(200).json({ message: 'Sección cancelada correctamente', updatedSection });
  } catch (error) {
    console.error('Error desactivando sección:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getSectionsByTeacherIdController = async (req: Request, res: Response) => {
  try {
    const sections = await getSectionsByTeacherId(req);
    res.status(200).json(sections);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getSectionsByTeacherIdControllerNext = async (req: Request, res: Response) => {
  try {
    const sections = await getSectionsByTeacherIdNext(req);
    res.status(200).json(sections);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateSectionCapacityController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const increment = Number(req.body.increment);

  try {
    const updatedSection = await updateSectionCapacity(Number(id), increment);
    res.status(200).json({
      message: 'Capacidad de la sección actualizada correctamente',
      updatedSection,
    });
  } catch (error) {
    console.error('Error actualizando la capacidad de la sección:', error);
    res.status(400).json({error: error.message });
  }
};

export const getTeachersByDepartmentController = async (req: Request, res: Response) => {
  try {
    const result = await getTeachersByDepartment(req);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error getting teachers by department:', error);
    res.status(400).json({error: error.message});
  }
};

export const getTeachersByDepartmentPageController = async (req: Request, res: Response) => {
  try {
    const result = await getTeachersByDepartmentPagination(req);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error getting teachers by department:', error);
    res.status(400).json({error: error.message});
  }
};

export const getTeachersByDepartmentAcademicPeriodController = async (req: Request, res: Response) => {
  try {
    const result = await getSectionByDepartmentActual(req);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error getting teachers by department:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getTeachersByDepartmentAcademicPeriodControllerNext = async (req: Request, res: Response) => {
  try {
    const result = await getSectionByDepartmentActualNext(req);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error getting teachers by department:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getWaitingListController = async (req: Request, res: Response) => {
  const { sectionId } = req.params;

  try {
    const waitingListStudents = await getWaitingListById(Number(sectionId));

    if (!waitingListStudents) {
      return res.status(404).json({ error: 'No se encontró la lista de espera para la sección especificada' });
    }

    res.status(200).json(waitingListStudents);
  } catch (error) {
    console.error('Error obteniendo la lista de espera:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getGradesBySectionIdController = async (req: Request, res: Response) => {
  try {
    // Obtén el ID de la sección del parámetro de la solicitud
    const sectionId = parseInt(req.params.sectionId, 10);
    
    if (isNaN(sectionId)) {
      return res.status(400).json({ message: 'ID de sección inválido' });
    }

    // Obtén las notas utilizando el servicio
    const grades = await getGradesBySectionId(sectionId, req);

    // Devuelve las notas en la respuesta
    return res.status(200).json(grades);
  } catch (error) {
    // Maneja los errores y devuelve una respuesta de error
    return res.status(500).json({ message: error.message });
  }
};

export const getSectionEnrollmentsExcel = async (req: Request, res: Response) => {
  const sectionId = parseInt(req.params.id, 10);
  const userId = req.user.id;

  if (isNaN(sectionId)) {
    return res.status(400).json({ error: 'ID de sección inválido' });
  }

  try {
    //Verificar si el usuario autenticado es el teacher de la sección
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      select: { teacherId: true }
    });

    if (!section) {
      return res.status(404).json({ error: 'Sección no encontrada' });
    }

    if (section.teacherId !== userId) {
      return res.status(403).json({ error: 'No autorizado: No eres el profesor de esta sección' });
    }

    // Si la validación pasa, descargar el archivo Excel
    await downloadSectionEnrollmentsExcel(sectionId, res);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
  }
};

