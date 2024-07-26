
import { Request, Response } from 'express';
import * as regionalCenterService from '../../middleware/regionalCenterService';

export const getAllRegionalCentersWithDepartments = async (req: Request, res: Response) => {
  try {
    const regionalCenters = await regionalCenterService.getAllRegionalCentersWithDepartments();
    res.status(200).json(regionalCenters);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los centros regionales con sus departamentos' });
  }
};