import { Request, Response } from 'express';
import { deleteFileService, uploadFileService } from '../../services/Resources/resourcesService'; // Asegúrate de que la ruta sea correcta

export const uploadFileController = async (req: Request, res: Response) => {
    const sectionId = parseInt(req.params.id, 10);
    const file = req.file; // Asegúrate de usar middleware como multer para manejar archivos
    const fileName = req.body.fileName || file.originalname; // Nombre del archivo proporcionado o nombre original del archivo
    if (isNaN(sectionId)) {
      return res.status(400).json({ error: 'ID de sección inválido' });
    }
  
    if (!file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
    }
  
    if (!fileName || typeof fileName !== 'string') {
      return res.status(400).json({ error: 'Nombre del archivo no proporcionado o inválido' });
    }
  
    try {
      const fileBuffer = file.buffer;
      const fileType = file.mimetype;
  
      const resource = await uploadFileService(fileBuffer, fileType, sectionId, fileName);
      res.status(201).json(resource);
    } catch (error) {
      res.status(500).json({ error: `Error al subir el archivo: ${error.message}` });
    }
  };

export const deleteFileController = async (req: Request, res: Response) => {
    const resourceId = parseInt(req.params.id, 10);
  
    if (isNaN(resourceId)) {
      return res.status(400).json({ error: 'ID de recurso inválido' });
    }
  
    try {
      await deleteFileService(resourceId);
      res.status(200).json({ message: 'Archivo eliminado exitosamente' });
    } catch (error) {
      res.status(500).json({ error: `Error al eliminar el archivo: ${error.message}` });
    }
  };
