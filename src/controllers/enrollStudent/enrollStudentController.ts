import { Request, Response } from 'express';
import { enrollInSection } from '../../services/enrollStudent/enrollSection';

export const enrollStudent = async (req: Request, res: Response) => {
  const { studentId, sectionId } = req.body;

  if (!studentId || !sectionId) {
    return res.status(400).json({ message: 'Se requiere el ID del estudiante y el ID de la sección.' });
  }

  try {
    const result = await enrollInSection(studentId, sectionId);

    if (result === 'added to waiting list') {
      return res.status(200).json({ message: 'No hay cupos disponibles. El estudiante fue añadido a la lista de espera.' });
    }

    if (result === 'time conflict') {
      return res.status(400).json({ message: 'La sección tiene un conflicto de horario con otra clase matriculada.' });
    }

    return res.status(200).json({ message: 'El estudiante se matriculó exitosamente en la sección.' });
  } catch (error) {
    console.error('Error al matricular al estudiante:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

