import { Request, Response } from "express"
import { prisma } from "../../config/db"
import { generateJWT } from "../../utils/auth/jwt"
import { generateToken } from '../../utils/auth/token';
import { AuthEmail } from "../../services/mail/authEmail";
import { checkPassword, hashPassword } from "../../utils/auth/auth";

export class AuthController {

    static login = async (req: Request, res: Response) => {
        const { institutionalEmail, password }: { institutionalEmail: string, password: string } = req.body
        try {
            const userFound = await prisma.user.findUnique({ where: { institutionalEmail }, include: { role: true } })
            if (!userFound) {
                const error = new Error('¡El usuario no existe!')
                return res.status(404).send({ error: error.message })
            }

            const isPasswordCorrect = await checkPassword(password, userFound.password)

            if (!isPasswordCorrect) {
                const error = new Error('¡Contraseña Incorrecta!')
                return res.status(401).json({ error: error.message })
            }

            const jwtoken = generateJWT({ id: userFound.id, role: userFound.role.name })

            res.send(jwtoken)
        } catch (error) {
            res.status(500).json({ error: 'Server internal error' })
        }
    }

    static forgotPassword = async (req: Request, res: Response) => {
        const { institutionalEmail }: { institutionalEmail: string } = req.body
        try {
            const userFound = await prisma.user.findUnique({ where: { institutionalEmail }, include: { role: true, person: true } })
            if (!userFound) {
                const error = new Error('¡El usuario no existe!')
                return res.status(404).send({ error: error.message })
            }

            if (userFound.role.name === 'TEACHER' || userFound.role.name === 'COORDINATOR') {
                const error = new Error('Debes solicitar al jefe de carrera que reinicie tu clave.')
                return res.status(404).send({ error: error.message })
            }

            // if a token exists, remove it
            const tokenExists = await prisma.userToken.findUnique({ where: { userId: userFound.id } })
            if (tokenExists) {
                await prisma.userToken.delete({ where: { token: tokenExists.token } })
            }

            const tokenGenerated = generateToken()
            await prisma.userToken.create({
                data: {
                    token: tokenGenerated,
                    userId: userFound.id,
                    expiresAt: new Date(Date.now() + 15 * 60 * 1000)
                }
            })

            await AuthEmail.sendPasswordResendToken({ email: userFound.person.email, name: userFound.person.firstName, token: tokenGenerated }, false)

            res.send('Te hemos enviado un email a tu correo personal con las instrucciones')
        } catch (error) {
            res.status(500).json({ error: 'Server internal error' })
        }
    }

    static forgotPasswordTeacher = async (req: Request, res: Response) => {
        const  idTeacher : number  = parseInt(req.body.idTeacher)
        try {
            const userFound = await prisma.user.findUnique({ where: { id: idTeacher }, include: { role: true, person: true } })
            if (!userFound) {
                const error = new Error('¡El usuario no existe!')
                return res.status(404).send({ error: error.message })
            }

            if (userFound.role.name !== 'TEACHER' && userFound.role.name !== 'COORDINATOR') {
                const error = new Error('El usuario no es un docente.')
                return res.status(404).send({ error: error.message })
            }

            // if a token exists, remove it
            const tokenExists = await prisma.userToken.findUnique({ where: { userId: userFound.id } })
            if (tokenExists) {
                await prisma.userToken.delete({ where: { token: tokenExists.token } })
            }

            const tokenGenerated = generateToken()
            await prisma.userToken.create({
                data: {
                    token: tokenGenerated,
                    userId: userFound.id,
                    expiresAt: new Date(Date.now() + 2 * 60 * 1000)
                }
            })

            await AuthEmail.sendPasswordResendToken({ email: userFound.person.email, name: userFound.person.firstName, token: tokenGenerated }, true)

            res.send(`Hemos enviado un email al docente ${userFound.person.firstName} ${userFound.person.lastName} con el enlace para cambiar su contraseña`)
        } catch (error) {
            res.status(500).json({ error: 'Server internal error' })
        }
    }


    static validateToken = async (req: Request, res: Response) => {
        const { token } = req.body
        try {
            const tokenExists = await prisma.userToken.findUnique({ where: { token: token } })
            if (!tokenExists) {
                const error = new Error('Token Inválido')
                return res.status(404).json({ error: error.message })
            }

            res.send('Token válido, define tu nueva contraseña')
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' })
        }
    }

    static updatePasswordWithToken = async (req: Request, res: Response) => {
        const { token } = req.params
        try {
            const tokenExists = await prisma.userToken.findUnique({ where: { token: token } })
            if (!tokenExists) {
                const error = new Error('Token Inválido')
                return res.status(404).json({ error: error.message })
            }

            const userFound = await prisma.user.findUnique({ where: { id: tokenExists.userId } })
            if (!userFound) {
                const error = new Error('¡El usuario no existe!')
                return res.status(404).send({ error: error.message })
            }

            const newPassword = await hashPassword(req.body.password)

            await Promise.allSettled([prisma.user.update({ where: { id: userFound.id }, data: { password: newPassword } }), prisma.userToken.delete({ where: { token: tokenExists.token } })])

            res.send('¡Contraseña restablecida correctamente!')
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' })
        }

    }

    static user = async (req: Request, res: Response) => {
        return res.json(req.user)
    }

    static updateCurrentUserPassword = async (req: Request, res: Response) => {
        try {
            const { current_password, password } = req.body
            const user = await prisma.user.findUnique({ where: { id: req.user.id } })
            const isPasswordCorrect = await checkPassword(current_password, user.password)
            if (!isPasswordCorrect) {
                const error = new Error('La contraseña actual es incorrecta.')
                return res.status(401).json({ error: error.message })
            }

            const newPassword = await hashPassword(password)
            await prisma.user.update({ where: { id: user.id }, data: { password: newPassword } })

            res.send('¡Contraseña cambiada correctamente!')
        } catch (error) {
            res.status(500).json({ error: 'An error occurred' })
        }
    }

    static checkPassword = async (req: Request, res: Response) => {
        try {
            const { password } = req.body
            const user = await prisma.user.findUnique({ where: { id: req.user.id } })
            const isPasswordCorrect = await checkPassword(password, user.password)
            if (!isPasswordCorrect) {
                const error = new Error('La contraseña es incorrecta.')
                return res.status(401).json({ error: error.message })
            }

            res.send('¡Contraseña Correcta!')
        } catch (error) {
            res.status(500).json({ error: 'An error occurred' })
        }
    }


    static async userTokenExists(req: Request, res: Response) {
        try {
            const { token } = req.params
            const tokenFound = await prisma.userToken.findUnique({ where: { token } })
            if (!tokenFound) {
                const error = new Error('Token no encontrado')
                return res.status(404).json({ error: error.message })
            }
            return res.status(200).send('Token encontrado')
        } catch (error) {
            res.status(500).json({ error: 'An error occurred' })
        }
    }

}