import { Person, Role, User } from '@prisma/client'
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../../config/db'


declare global {
    namespace Express {
        interface Request {
            user?: Pick<User, 'id' | 'verified' | 'identificationCode' | 'institutionalEmail'> & {
                role : {
                    name : Role['name']
                }
                person: {
                    firstName: Person['firstName'];
                    lastName: Person['lastName'];
                }; 
            }
        }
    }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const bearer = req.headers.authorization
    if (!bearer) {
        const error = new Error('Not authorized')
        return res.status(401).json({ error: error.message })
    }

    const [, token] = bearer.split(' ')

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (typeof decoded === 'object' && decoded.id) {
            const user = await prisma.user.findUnique({ where: { id: decoded.id }, select: { id: true, institutionalEmail: true, identificationCode: true, role: { select : { name : true }  }, verified: true, person: { select : { firstName : true, lastName : true } } } })
            if (user) {
                req.user = user
                next()
            } else {
                return res.status(400).json({ error: 'Invalid Token' })
            }
        }
    } catch (error) {
        res.status(400).json({ error: 'Invalid Token' })
    }

}

export const authorizeRole = (roleNames: string[]) => {
    return (req : Request, res : Response, next : NextFunction) => {
        if (!roleNames.includes(req.user.role.name)) {
            const error = new Error('No tiene los permisos necesarios')
            return res.status(403).json({ error: error.message })
        }
        next();
    };
};