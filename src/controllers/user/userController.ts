import { Request, Response } from 'express';
import { getUserData } from '../../services/user/userService';

import { validationResult } from 'express-validator';

export const getUserDataController = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const userId = parseInt(req.params.userId, 10);

  try {
    const userData = await getUserData(userId);
    return res.status(200).json(userData);
  } catch (error) {
    return res.status(404).json({ error: error.message });
  }
};