// src/controllers/admin/processController.ts
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { createProcess, activateProcess, deactivateProcess, updateFinalDate } from '../../services/admin/processService';

export const createProcessController = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const process = await createProcess(req.body);
    return res.status(201).json(process);
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const activateProcessController = async (req: Request, res: Response) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Process ID is required.' });
  }

  try {
    const process = await activateProcess(id);
    return res.status(200).json(process);
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deactivateProcessController = async (req: Request, res: Response) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Process ID is required.' });
  }

  try {
    const process = await deactivateProcess(id);
    return res.status(200).json(process);
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateFinalDateController = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id, finalDate } = req.body;
  if (!id || !finalDate) {
    return res.status(400).json({ error: 'Process ID and final date are required.' });
  }

  try {
    const process = await updateFinalDate(id, new Date(finalDate));
    return res.status(200).json(process);
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

