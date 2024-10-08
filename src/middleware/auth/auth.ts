import { Person, Role, User } from '@prisma/client'
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../../config/db'
import { Server, Socket } from 'socket.io';

declare global {
    namespace Express {
        interface Request {
            user?: Pick<User, 'id' | 'verified' | 'identificationCode' | 'institutionalEmail'> & {
                role: {
                    name: Role['name']
                }
                person: {
                    firstName: Person['firstName'];
                    lastName: Person['lastName'];
                };
                avatar: string | null
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



    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (typeof decoded === 'object' && decoded.id) {

            const user = await prisma.user.findUnique({ where: { id: decoded.id, verified: true, active: true }, select: { id: true, institutionalEmail: true, identificationCode: true, role: { select: { name: true } }, verified: true, person: { select: { firstName: true, lastName: true } }, images: { select: { url: true }, where: { avatar: true } } } })
            if (user) {

                const avatar = user.images.length ? user.images[0].url : null
                const userWithAvatar = { ...user, avatar }
                req.user = userWithAvatar

                next()
            } else {
                return res.status(400).json({ error: 'Sesión expirada' })
            }
        }
    } catch (error) {
        res.status(400).json({ error: 'Sesión expirada' })
    }

}

export const authorizeRole = (roleNames: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!roleNames.includes(req.user.role.name)) {
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

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (typeof decoded === 'object' && decoded.id) {
            const user = await prisma.user.findUnique({ where: { id: decoded.id, active: true }, select: { id: true, institutionalEmail: true, identificationCode: true, role: { select: { name: true } }, verified: true, person: { select: { firstName: true, lastName: true } }, images: { select: { url: true }, where: { avatar: true } } } })
            if (user) {
                if (user.verified) {
                    return res.status(400).json({ error: 'No permitido' })
                }
                const avatar = user.images.length ? user.images[0].url : null
                const userWithAvatar = { ...user, avatar }
                req.user = userWithAvatar
                next()
            } else {
                return res.status(400).json({ error: 'Sesión expirada' })
            }
        }
    } catch (error) {
        res.status(400).json({ error: 'Sesión expirada' })
    }

}

export const authenticateSocket = async (socket: Socket, next: (err?: any) => void) => {
    const bearer = socket.handshake.auth.token;

    if (!bearer) {
        return next(new Error('No autorizado'));
    }

    const [, token] = bearer.split(' ');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (typeof decoded === 'object' && decoded.id) {
            const user = await prisma.user.findUnique({
                where: { id: decoded.id, verified: true, active: true },
                select: {
                    id: true,
                    institutionalEmail: true,
                    identificationCode: true,
                    role: { select: { name: true } },
                    verified: true,
                    person: { select: { firstName: true, lastName: true } },
                    images: { select: { url: true }, where: { avatar: true } },
                },
            });

            if (user) {
                const avatar = user.images.length ? user.images[0].url : null;
                const userWithAvatar = { ...user, avatar };
                socket.data.user = userWithAvatar; // Almacena el usuario autenticado en los datos del socket
                return next();
            } else {
                return next(new Error('Sesión expirada'));
            }
        }
    } catch (error) {
        return next(new Error('Sesión expirada'));
    }
};