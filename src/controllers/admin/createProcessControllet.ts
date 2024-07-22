import { Request, Response } from 'express';
import { createProcess } from '../../utils/admin/createProcess'

export const createProcessHandler = async (req: Request, res: Response) => {
  const { startDate, finalDate, active, processTypeId, processId } = req.body;

  if (!startDate || !finalDate || !processTypeId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const newProcess = await createProcess({
      startDate: new Date(startDate),
      finalDate: new Date(finalDate),
      active: active ?? true,
      processTypeId,
      processId: processId || null,
    });

    res.status(201).json(newProcess);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
