// userController.ts
import { Request, Response } from 'express';
import { getAllTeachers } from '../../services/teacher/getTeachers';

export const getTeachers = async (req: Request, res: Response) => {
  try {
    const teachers = await getAllTeachers();
    res.status(200).json(teachers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
