import { Request, Response } from 'express';
import { enrollInSection } from '../../services/enrollStudent/enrollSection';
import { prisma } from '../../config/db';

export const enrollStudent = async (req: Request, res: Response) => {
  const {sectionId } = req.body;
  const {id:userId} = req.user;

  

  if (!sectionId) {
    return res.status(400).json({ message: 'Se requiere el ID del estudiante y el ID de la sección.' });
  }

  try {
    const studentId = (await prisma.student.findUnique({where: {userId: userId}})).id;

    const result = await enrollInSection(studentId, sectionId);

    if (result === 'added to waiting list') {
      return res.status(200).json({ message: 'No hay cupos disponibles. El estudiante fue añadido a la lista de espera.' });
    }

    if (result === 'time conflict') {
      return res.status(400).json({ message: 'La sección tiene un conflicto de horario con otra clase matriculada.' });
    }

    if (result === 'prerequisites not met') {
      return res.status(400).json({ message: 'No cumple los requisitos para matricular esta clase.' });
    }

    if (result === 'already enrolled') {
      return res.status(400).json({ message: 'El estudiante ya está matriculado en esta sección.' });
    }
  } catch (error) {
    console.error('Error al matricular al estudiante:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};


export const enrollStudent2 = async (req: Request, res: Response) => {
  const {sectionId}  = req.body;
  const userId = 7;

  

  if (!sectionId) {
    return res.status(400).json({ message: 'Se requiere el ID del estudiante y el ID de la sección.' });
  }

  try {
    const studentId = (await prisma.student.findUnique({where: {userId: userId}})).id;

    const result = await enrollInSection(studentId, sectionId);

    if (result === 'added to waiting list') {
      return res.status(200).json({ message: 'No hay cupos disponibles. El estudiante fue añadido a la lista de espera.' });
    }

    if (result === 'time conflict') {
      return res.status(400).json({ message: 'La sección tiene un conflicto de horario con otra clase matriculada.' });
    }if(result === 'prerequisites not met'){
      return res.status(400).json({ message: 'No cumple los requisitos para matricular esta clase.' });
    }

    return res.status(200).json({ message: 'El estudiante se matriculó exitosamente en la sección.' });
  } catch (error) {
    console.error('Error al matricular al estudiante:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};
