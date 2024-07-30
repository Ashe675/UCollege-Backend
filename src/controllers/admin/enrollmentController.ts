import { Request, Response } from 'express';
import { activateEnrollmentProcess, generateDayEnroll } from '../../services/admin/enrollmentService';

export const activateEnrollment = async (req: Request, res: Response) => {
  try {
    const { startDate, finalDate, processTypeId, days } = req.body;

    
    const process = await activateEnrollmentProcess(new Date(startDate), new Date(finalDate), processTypeId);

    if (days && days.length > 0) {
      await generateDayEnroll(process.id , days);
    }

    res.status(200).json({ message: 'Proceso de matrícula activado y calendario generado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
