// controllers/admissions/regionalCenterController.ts
import { Request, Response } from 'express';
import { getRegionalCenters } from '../../services/admission/regionalCenterService'

export const getRegionalCentersHandler = async (req: Request, res: Response) => {
  try {
    const regionalCenters = await getRegionalCenters();
    if (!regionalCenters.length) {
      return res.status(404).send('No se encontraron centros regionales.');
    }
    res.json(regionalCenters);
  } catch (error) {
    console.error('Error al obtener los centros regionales:', error);
    res.status(500).send('Error interno en el servidor');
  }
};




