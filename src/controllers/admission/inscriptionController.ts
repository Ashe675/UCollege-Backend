import { getInscriptionDetailsByDni } from '../../services/admission/getInscriptionsService';
import { Request, Response } from 'express';

export const getInscriptionDetails = async (req: Request, res: Response) => {
    const { dni } = req.params;
  
    try {
      const details = await getInscriptionDetailsByDni(dni);
      res.json(details);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  };