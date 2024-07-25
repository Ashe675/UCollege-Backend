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
    await createProcess(req.body);
    return res.status(201).send("¡PROCESO CREADO CORRECTAMENTE!");
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const activateProcessController = async (req: Request, res: Response) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Process ID is required.' });
  }

  try {
    await activateProcess(id);
    return res.status(200).send("¡PROCESO ACTIVADO CORRECTAMENTE!");
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deactivateProcessController = async (req: Request, res: Response) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Process ID is required.' });
  }

  try {
    await deactivateProcess(id);
    return res.status(200).send("¡PROCESO DESACTIVADO CORRECTAMENTE!");
  } catch (error) {
    return res.status(500).json({ error: error.message });
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
    await updateFinalDate(id, new Date(finalDate));
    return res.status(200).json("¡FECHA FINAL ACTUALIZADA CORRECTAMENTE!");
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getAllProcessesController = async (req: Request, res: Response) => {
  try {
    const processes = await getAllProcesses();
    res.status(200).json(processes);
  } catch (error) {
    res.status(500).json({error: error.message });
  }
};

export const getAllActiveProcessesController = async (req: Request, res: Response) => {
  try {
    const activeProcesses = await getAllActiveProcesses();
    res.status(200).json(activeProcesses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllProcessTypeController = async (req: Request, res: Response) => {
  try{
    const typeprocess = await getAllProcessType();
    res.status(200).json(typeprocess);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
}


