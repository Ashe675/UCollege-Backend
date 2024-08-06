// src/controllers/sectionController.ts
import { Request, Response } from 'express';
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
  getSectionByDepartmentActual
} from '../../services/sections/sectionService';

export const createSectionController = async (req: Request, res: Response) => {
  try {
    const newSection = await createSection(req.body, req);
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
    res.status(500).json({ error: 'Internal Server Error' });
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
      res.status(500).json({ error: 'Internal Server Error' });
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
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getSectionByDepartmentController = async (req: Request, res: Response) => {
  try {
    const sections = await getSectionByDepartment(req);
    res.json(sections);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving sections', error });
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
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteSectionController = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await deleteSection(Number(id));
    res.status(200).json({ message: 'Sección eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando sección:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getSectionsByTeacherIdController = async (req: Request, res: Response) => {
  try {
    const sections = await getSectionsByTeacherId(req);
    res.status(200).json(sections);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getTeachersByDepartmentController = async (req: Request, res: Response) => {
  try {
    const result = await getTeachersByDepartment(req);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error getting teachers by department:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getTeachersByDepartmentAcademicPeriodController = async (req: Request, res: Response) => {
  try {
    const result = await getSectionByDepartmentActual(req);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error getting teachers by department:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};