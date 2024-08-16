import { Request, Response } from 'express';
import { updateSection } from '../../services/teacher/teacherService';

export const updateSectionInfoController = async (req: Request, res: Response) => {
    const sectionId = parseInt(req.params.id, 10);
    const { title, description } = req.body;

    if (isNaN(sectionId)) {
        return res.status(400).json({ error: 'ID de sección inválido' });
    }

    if (!title && !description) {
        return res.status(400).json({ error: 'Debe proporcionar al menos un título o una descripción' });
    }

    try {
        const updatedSection = await updateSection(sectionId, title ?? null, description ?? null);
        res.status(200).send('Información Actualizada Correctamente');
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};