import { Request, Response } from 'express';
import { prisma } from '../../config/db';


export const getSectionController= async( req: Request, res: Response)=>{
    const {id:userId}= req.user
    try {
        const result = await prisma.section.findMany({
            where:{
                teacherId: userId
            },
            include: {enrollments: {
                include: {
                    student:{
                        include:{
                            user: true
                        }
                    }
                }
            }}
        })

        return res.status(200).json(result);
    } catch (error) {
        
    }
}
