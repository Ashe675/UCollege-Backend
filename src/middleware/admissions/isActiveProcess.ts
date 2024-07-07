// Ejemplo de middleware para validar una solicitud
import { Request, Response, NextFunction } from 'express';
import InscriptionValidator from '../../validators/admissions/InscriptionValidator'
import deleteImage from '../../utils/admissions/fileHandler'

// Middleware de validación
export const validateProcess = async (req: Request, res: Response, next: NextFunction) => {
  // Verificar si los datos necesarios están presentes en la solicitud
  const  processId  = req.body.processId;
 
  
  const activeProcess =  await InscriptionValidator.isActiveProcess(processId);

  
  
  if (!activeProcess) {
    const photoCertificate = req.file?.path;
    
    deleteImage(photoCertificate)
    return res.status(400).json({ error: 'El proceso al que intente inscribirse esta inactivo.' });
  }

  
  next();
};
