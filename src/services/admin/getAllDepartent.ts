import { Request, Response } from 'express';
import { prisma } from '../../config/db';

export const getAllDepartments = async (req: Request, res: Response) => {
    try {
        const department = await prisma.departament.findFirst({
            include: {
                regionalCenterFacultyCareer: {
                    include: {
                        RegionalCenterFacultyCareer: {
                            include: {
                                regionalCenter_Faculty: {
                                    include: {
                                        regionalCenter: true,
                                        faculty: true,
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        return res.status(201).json(department);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
