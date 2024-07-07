// middleware.ts

import { Request, Response, NextFunction } from 'express';
import InscriptionValidator from '../../validators/admissions/InscriptionValidator';

// Ejemplo de middleware para verificar si el usuario está autenticado
export async function getActiveProcess(req: Request, res: Response, next: NextFunction) {
    try {
        const activeProcessId = await InscriptionValidator.getProcessIdInscription(req);
        if (activeProcessId !== null) {
            req.body.processId = activeProcessId;
            //res.status(200).json({ processId: activeProcessId });
        } else {
          res.status(404).json({ message: 'EL proceso de inscripción está inactivo.' });
        }
      } catch (error) {
        res.status(500).json({ message: 'Error al buscar el proceso activo.' });
      }
      next();
}

// Otros middlewares pueden ir aquí...
