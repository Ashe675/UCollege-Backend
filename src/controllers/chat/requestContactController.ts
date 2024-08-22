import { Request, Response } from "express"
import { prisma } from "../../config/db"
import { User } from "@prisma/client"
import { sendFriendRequest } from "../../services/mail/emailService"


export default class RequestContactController {

    static createRequest = async (req: Request, res: Response) => {
        const senderId = req.user.id
        const { receiverIdentificationCode } = req.body
        try {
            const receiver = await prisma.user.findUnique({
                where: {
                    identificationCode: receiverIdentificationCode,
                    active: true,
                },
                include: {
                    person: true
                }
            })

            if (!receiver) {
                const error = new Error('El usuario al que quiere enviar la solicitud de amistad no existe.')
                return res.status(404).send({ error: error.message })
            }

            if(senderId === receiver.id){
                const error = new Error('No puede enviarse una solicitud a sí mismo.')
                return res.status(404).send({ error: error.message })
            }

            const contact = await prisma.contact.findFirst({
                where: {
                    OR: [
                        {
                            userId: senderId,
                            contactId: receiver.id
                        },
                        {
                            userId: receiver.id,
                            contactId: senderId
                        }
                    ]

                }
            })

            if (contact) {
                const error = new Error('Este usuario ya lo tiene agregado como amigo.')
                return res.status(404).send({ error: error.message })
            }


            const friendRequestFound = await prisma.friendRequest.findFirst({
                where: {
                    senderId,
                    receiverId: receiver.id,
                    status: 'PENDING'
                }
            })

            if (friendRequestFound) {
                const error = new Error('Ya le envió una solicitud de amistad a este usuario.')
                return res.status(404).send({ error: error.message })
            }

            const friendRequest = await prisma.friendRequest.create({
                data: {
                    senderId,
                    receiverId: receiver.id
                }
            })

            const senderUser = await prisma.user.findUnique({ where: { id: req.user.id }, include: { person: true } })

            await sendFriendRequest({
                firstName: senderUser.person.firstName,
                lastName: senderUser.person.lastName,
            }, {
                firstName: receiver.person.firstName,
                lastName: receiver.person.lastName,
            }, receiver.person.email)

            return res.json({
                message: 'Solicitud de amistad enviada correctamente!',
                friendRequest
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: error.message })
        }
    }


    static getRequests = async (req: Request, res: Response) => {
        const userId = req.user.id
        try {

            const friendRequestFounds = await prisma.friendRequest.findMany({
                where: {
                    status: 'PENDING',
                    OR: [
                        {
                            senderId: userId
                        },
                        {
                            receiverId: userId
                        }
                    ]
                },
                include: {
                    receiver: {
                        select: {
                            identificationCode: true,
                            institutionalEmail: true,
                            images: {
                                select: {
                                    url: true
                                },
                                where: {
                                    avatar: true
                                }
                            },
                            person: {
                                select: {
                                    firstName: true,
                                    middleName: true,
                                    lastName: true,
                                    secondLastName: true
                                }
                            }
                        }
                    },
                    sender: {
                        select: {
                            identificationCode: true,
                            institutionalEmail: true,
                            images: {
                                select: {
                                    url: true
                                },
                                where: {
                                    avatar: true
                                }
                            },
                            person: {
                                select: {
                                    firstName: true,
                                    middleName: true,
                                    lastName: true,
                                    secondLastName: true
                                }
                            }
                        }
                    }
                }
            })

            return res.json({
                friendRequestSent: friendRequestFounds.filter(req => req.senderId === userId),
                friendRequestReceived: friendRequestFounds.filter(req => req.receiverId === userId),
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: error.message })
        }

    }


    static acceptFriendRequest = async (req: Request, res: Response) => {
        const receiverId = req.user.id
        const { requestId } = req.params
        try {

            if (isNaN(+requestId)) {
                const error = new Error('Solicitud inválida.')
                return res.status(404).send({ error: error.message })
            }

            const friendRequestFound = await prisma.friendRequest.findUnique({
                where: {
                    id: Number(requestId),
                    receiverId,
                    status: 'PENDING'
                }
            })

            if (!friendRequestFound) {
                const error = new Error('La solicitud que intenta aceptar no existe.')
                return res.status(404).send({ error: error.message })
            }

            await prisma.friendRequest.deleteMany({
                where: {
                    OR: [
                        {
                            receiverId,
                            senderId: friendRequestFound.senderId
                        },
                        {
                            receiverId: friendRequestFound.senderId,
                            senderId: receiverId
                        }
                    ]
                },
            })

            const [contact1, contact2] = await prisma.contact.createManyAndReturn({
                data: [
                    {
                        userId: receiverId,
                        contactId: friendRequestFound.senderId
                    },
                    {
                        userId: friendRequestFound.senderId,
                        contactId: receiverId
                    },
                ]
            })

            return res.json({
                message: 'Solicitud de amistad aceptada!',
                data: {
                    contact1,
                    contact2
                }
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: error.message })
        }
    }

    static declineFriendRequest = async (req: Request, res: Response) => {
        const receiverId = req.user.id
        const { requestId } = req.params
        try {

            if (isNaN(+requestId)) {
                const error = new Error('Solicitud inválida.')
                return res.status(404).send({ error: error.message })
            }

            const friendRequestFound = await prisma.friendRequest.findUnique({
                where: {
                    id: Number(requestId),
                    receiverId,
                    status: 'PENDING'
                }
            })

            if (!friendRequestFound) {
                const error = new Error('La solicitud que intenta rechazar no existe.')
                return res.status(404).send({ error: error.message })
            }

            await prisma.friendRequest.deleteMany({
                where: {
                    OR: [
                        {
                            receiverId,
                            senderId: friendRequestFound.senderId
                        },
                        {
                            receiverId: friendRequestFound.senderId,
                            senderId: receiverId
                        }
                    ]
                }
            })


            return res.json({
                message: 'Solicitud de amistad rechazada!',
                data: {}
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: error.message })
        }
    }


    static getContacts = async (req: Request, res: Response) => {
        const userId = req.user.id
        try {

            const contacts = await prisma.contact.findMany({
                where: {
                    userId,
                    contact: {
                        active: true
                    }
                },
                select: {
                    contact: {
                        select: {
                            id : true,
                            institutionalEmail: true,
                            identificationCode: true,
                            person: {
                                select: {
                                    phoneNumber: true,
                                    email: true,
                                    firstName: true,
                                    lastName: true,
                                    middleName: true,
                                    secondLastName: true
                                }
                            },
                            images: {
                                where: {
                                    avatar: true,
                                },
                                select: {
                                    url: true
                                }
                            },
                            isOnline: true,
                            lastOnline: true
                        }
                    },

                },
                orderBy : {
                    createdAt : 'desc'
                }
            })

            return res.json({ contacts })
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: error.message })
        }

    }


}

