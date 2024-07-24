// src/controllers/admin/processController.ts
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { createProcess, activateProcess, deactivateProcess, updateFinalDate, getAllProcesses, getAllActiveProcesses, getAllProcessType } from '../../services/admin/processService';

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

export const getAllProcessesController = async (req: Request, res: Response) => {
  try {
    const processes = await getAllProcesses();
    res.status(200).json(processes);
  } catch (error) {
    console.error('Error fetching all processes:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getAllActiveProcessesController = async (req: Request, res: Response) => {
  try {
    const activeProcesses = await getAllActiveProcesses();
    res.status(200).json(activeProcesses);
  } catch (error) {
    console.error('Error fetching active processes:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getAllProcessTypeController = async (req: Request, res: Response) => {
  try{
    const typeprocess = await getAllProcessType();
    res.status(200).json(typeprocess);
  } catch (error) {
    console.error('Error fetching all processes', error);
    res.status(500).json({ error: 'Internal Server Error'});
  }
}


