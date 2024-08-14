import { Request, Response } from 'express';
import { deleteFileService, uploadFileService } from '../../services/Resources/resourcesService'; // Asegúrate de que la ruta sea correcta
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

export const uploadFileController = async (req: Request, res: Response) => {
    const sectionId = parseInt(req.params.id, 10);
    const file = req.file; // Asegúrate de usar middleware como multer para manejar archivos
    const fileName = req.body.fileName || file.originalname; // Nombre del archivo proporcionado o nombre original del archivo
    const frontSection = req.query.frontSection?.toString().toLowerCase() === 'true';

    console.log("Valor de frontSection:", frontSection);
    if (isNaN(sectionId)) {
      return res.status(400).json({ error: 'ID de sección inválido' });
    }
  
    if (!file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
    }
  
    if (!fileName || typeof fileName !== 'string') {
      return res.status(400).json({ error: 'Nombre del archivo no proporcionado o inválido' });
    }
    
    // Generar un nombre de archivo temporal único
    const tempFilePath = path.join(__dirname, `${Date.now()}-${fileName}`);

    try {

      const fileType = file.mimetype;
      
      const fileBuffer = new Uint8Array(file.buffer);
      
      await writeFile(tempFilePath, fileBuffer);

      // Validar el tamaño del archivo (1GB máximo para videos)
      const maxVideoSize = 1024 * 1024 * 1024; // 1GB en bytes
      if (fileType.startsWith('video/') && file.buffer.length > maxVideoSize) {
        throw new Error('El tamaño del video excede el límite de 1GB.');
      }
  
      await uploadFileService(tempFilePath, fileType, sectionId, fileName, frontSection);
      res.status(201).send('¡Video Subido Correctamente!');
    } catch (error) {
      // Eliminar el archivo temporal en caso de error
      await unlink(tempFilePath);
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
      res.status(200).send('Archivo eliminado exitosamente');
    } catch (error) {
      res.status(500).json({ error: `Error al eliminar el archivo: ${error.message}` });
    }
  };
