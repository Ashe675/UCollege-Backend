import { Request, Response, NextFunction } from 'express';
import { prisma } from "../../config/db";



export const conversationExists= async (req: Request, res: Response, next: NextFunction) => {
    const { conversationId } = req.params
    const userId = req.user.id

    try {
        const conversation = await prisma.conversation.findUnique({ 
            where: { 
                id: conversationId,
                members : {
                    some : {
                        userId 
                    }
                }
             } 
            })
    
        if (!conversation){ 
            return res.status(400).json({ error: 'La conversación no existe.' });
        }
    
        next();
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ error: 'Server Internal Error.' });
    }

    
};

