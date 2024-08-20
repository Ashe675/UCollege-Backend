import { Request, Response } from "express"
import { prisma } from "../../config/db"
import { User } from "@prisma/client"
import { io } from "../../server"


export default class ConversationController {

    static getConversations = async (req: Request, res: Response) => {
        const userId = req.user.id
        const searchValue = req.query.searchValue?.toString()

        try {
            const conversations = await prisma.conversation.findMany({
                where: {
                    AND: [
                        {
                            members: {
                                some: {
                                    userId
                                }
                            }
                        }
                    ],
                    OR: searchValue ? [
                        {
                            groupTitle: {
                                contains: searchValue,
                                mode: 'insensitive'
                            }
                        },
                        {
                            members: {
                                some: {
                                    user: {
                                        institutionalEmail: {
                                            contains:
                                                searchValue,
                                            mode: 'insensitive'
                                        }
                                    }
                                }
                            }
                        },
                        {
                            members: {
                                some: {
                                    user: {
                                        identificationCode: {
                                            contains:
                                                searchValue,
                                            mode: 'insensitive'
                                        }
                                    }
                                }
                            }
                        }
                    ] : undefined
                },
                include: {
                    messages: {
                        select: {
                            createdAt: true
                        },
                        orderBy: {
                            createdAt: 'desc'
                        },
                        take: 1 // Para obtener solo el último mensaje

                    },
                    members: {
                        include: {
                            user: {
                                select: {
                                    id: true,
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
                            }
                        }

                    }
                }
            })

            conversations.sort((a, b) => {
                const aLastMessage = a.messages[0]?.createdAt || new Date(0);
                const bLastMessage = b.messages[0]?.createdAt || new Date(0);
                return bLastMessage.getTime() - aLastMessage.getTime();
            });

            return res.json(conversations)
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: error.message })
        }
    }


    static createConversation = async (req: Request, res: Response) => {
        const { type, members } = req.body
        const userId = req.user.id

        if (!type || !members?.length) {
            const error = new Error('¡Se requiere el tipo y los miembros para crear el chat!')
            return res.status(409).send({ error: error.message })
        }
        try {
            if (type === 'DIRECT_MESSAGE') {
                const chatExists = await prisma.conversation.findFirst({
                    where: {
                        type: 'DIRECT_MESSAGE',
                        AND: [
                            {
                                members: {
                                    some: {
                                        userId: userId
                                    }
                                }
                            },
                            {
                                members: {
                                    some: {
                                        userId: members[0].id
                                    }
                                }
                            }
                        ]
                    }
                });

                if (chatExists) {
                    console.log(chatExists)
                    const error = new Error('Ya existe un chat con esta persona.')
                    return res.status(409).send({ error: error.message })
                }

            }



            const conversation = await prisma.conversation.create({
                data: {
                    type,
                    members: {
                        create: [{ userId, role: (req.body?.isGroup ? 'ADMIN' : 'MEMBER') }, ...members.map((user: User) => ({ userId: user?.id }))]
                    },
                    groupTitle: req?.body?.groupTitle,
                    isGroup: req?.body.isGroup
                },
                include: {
                    members: {
                        include: {
                            user: true
                        }
                    }
                }
            })

            conversation?.members?.forEach(member => {
                io.to(member?.userId.toString()).emit("newConversation", conversation)
            })

            return res.json({ message: 'Chat Creado Correctamente!', conversation })
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: error.message })
        }
    }



}