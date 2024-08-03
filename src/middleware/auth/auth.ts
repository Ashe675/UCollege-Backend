import { Person, Role, User } from '@prisma/client'
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../../config/db'


declare global {
    namespace Express {
        interface Request {
            user?: Pick<User, 'id' | 'verified' | 'identificationCode' | 'institutionalEmail'> & {
                role: {
                    name: Role['name']
                };
                person: {
                    firstName: Person['firstName'];
                    lastName: Person['lastName'];
                };
                avatar: string | null;
                teacherDepartments: {
                    active: boolean;
                    regionalCenter_Faculty_Career_Department_Departament_id: number;
                    regionalCenter_Faculty_Career_Department_RegionalCenter_Faculty_Career_id: number;
                    role: Role

                }[]
            }
        }
    }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const bearer = req.headers.authorization
    if (!bearer) {
        const error = new Error('No autorizado')
        return res.status(401).json({ error: error.message })
    }

    const [, token] = bearer.split(' ')
    if (!token) {
        return res.status(401).json({ error: 'No autorizado' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (typeof decoded === 'object' && decoded.id) {
            const user = await prisma.user.findUnique({
                where: { id: decoded.id, verified: true },
                select: {
                    id: true, institutionalEmail: true,
                    identificationCode: true,
                    role: {
                        select: {
                            name: true
                        }
                    },
                    verified: true,
                    person: {
                        select: { firstName: true, lastName: true }
                    }, images: {
                        select: { url: true },
                        where: { avatar: true }
                    },
                    teacherDepartments: {
                        select: {
                            active: true,
                            regionalCenter_Faculty_Career_Department_Departament_id: true,
                            regionalCenter_Faculty_Career_Department_RegionalCenter_Faculty_Career_id: true,
                            role: true
                        }
                    }
                }
            })
            if (user && user.verified) {
                const avatar = user.images.length ? user.images[0].url : null
                const userWithAvatar = { ...user, avatar }
                req.user = userWithAvatar
                return next()
            } else {
                return res.status(400).json({ error: 'Sesión expirada' })
            }
        }
    } catch (error) {
        return res.status(400).json({ error: 'Sesión expirada' })
    }

}

export const authorizeRole = (roleNames: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!roleNames.includes(req.user.role?.name) && !req.user.teacherDepartments.some(depto => roleNames.includes(depto.role.name))) {
            const error = new Error('No tiene los permisos necesarios')
            return res.status(403).json({ error: error.message })
        }
        next();
    };
};

export const authenticateVerifiedLess = async (req: Request, res: Response, next: NextFunction) => {
    const bearer = req.headers.authorization
    if (!bearer) {
        const error = new Error('No autorizado')
        return res.status(401).json({ error: error.message })
    }

    const [, token] = bearer.split(' ')
    if (!token) {
        return res.status(401).json({ error: 'No autorizado' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (typeof decoded === 'object' && decoded.id) {
            const user = await prisma.user.findUnique({
                where: { id: decoded.id }, select: {
                    id: true, institutionalEmail: true, identificationCode: true, role: { select: { name: true } }, verified: true, person: { select: { firstName: true, lastName: true } }, images: { select: { url: true }, where: { avatar: true } },
                    teacherDepartments: {
                        select: {
                            active: true,
                            regionalCenter_Faculty_Career_Department_Departament_id: true,
                            regionalCenter_Faculty_Career_Department_RegionalCenter_Faculty_Career_id: true,
                            role: true
                        }
                    }
                }
            })
            if (user) {
                if (user.verified) {
                    return res.status(400).json({ error: 'No permitido' })
                }
                const avatar = user.images.length ? user.images[0].url : null
                const userWithAvatar = { ...user, avatar }
                req.user = userWithAvatar
                return next()
            } else {
                return res.status(400).json({ error: 'Sesión expirada' })
            }
        }
    } catch (error) {
        return res.status(400).json({ error: 'Sesión expirada' })
    }

}