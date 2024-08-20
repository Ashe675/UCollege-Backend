import { Request, Response } from "express"
import { prisma } from "../../config/db"
import path from "path"
import fs from 'fs';
import { promisify } from "util";
import { uploadFileService } from "../../services/Resources/resourcesService";
import { io } from "../../server";

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

export default class MessageController {
    static getMessages = async (req: Request, res: Response) => {
        const { conversationId } = req.params

        try {
            const messages = await prisma.message.findMany({
                where : {
                    conversationId
                },
                include : {
                    sender : {
                        include : {
                            user : {
                                
                                select : {
                                    id : true,
                                    images : {
                                        select : {
                                            url : true,
                                        
                                        },
                                        where : {
                                            avatar : true
                                        }
                                    },
                                    identificationCode : true,
                                    institutionalEmail : true,
                                    person : {
                                        select : {
                                            firstName : true,
                                            lastName : true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    conversation : true
                }
            })
            return res.json(messages);
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: error.message })
        }
    }

    static createMessage = async (req: Request, res: Response) => {
        const { conversationId } = req.params
        const { message } = req.body
        const isFile = req.query?.file
        const userId = req.user.id
        const file = req.file
        

        if (isFile && !file) {
            return res.status(409).json({ error: 'No se proporcionó ningún archivo' });
        }

        const fileName = req.body?.fileName || file?.originalname; 
        

        const tempFilePath = path.join(__dirname, `${Date.now()}-${file?.originalname}`);

        try {

            let fileUpload

            if (isFile) {
                const fileType = file.mimetype;

                const fileBuffer = new Uint8Array(file.buffer);

                await writeFile(tempFilePath, fileBuffer);

                

                // Validar el tamaño del archivo (1GB máximo para videos)
                const maxVideoSize = 1024 * 1024 * 1024; // 1GB en bytes
                if (fileType.startsWith('video/') && file.buffer.length > maxVideoSize) {
                    throw new Error('El tamaño del video excede el límite de 1GB.');
                }

                fileUpload = await uploadFileService({ filePath: tempFilePath, fileType, fileName, isMessage: true });
            }

            const member = await prisma.member.findFirst({
                where: {
                    conversationId,
                    userId,
                }
            })

            const payload =  isFile ? {
                fileUrl : fileUpload.fileUrl,
                fileId : fileUpload.publicId,
                fileType : fileUpload.resourceType,
                fileName 
            } : {
                body : message
            }

            const messageCreated = await prisma.message.create({
                data: {
                    ...payload,
                    senderId: member.id,
                    conversationId
                },
                include: {
                    sender: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    images: {
                                        select: {
                                            url: true
                                        },
                                        where: {
                                            avatar: true
                                        }
                                    },
                                    institutionalEmail: true,
                                    identificationCode: true
                                }
                            }
                        }
                    },
                    conversation : {
                        include : {
                            members : {
                                select : {
                                    userId : true
                                }
                            }
                        }
                    }
                },

            })


            io.to(conversationId).emit("newMessage", messageCreated)

            messageCreated.conversation.members.forEach(member => {
                io.to(member.userId.toString()).emit("newMessageInConversation", messageCreated)
            })

            return res.json({
                message: 'Mensaje Enviado!',
                data: messageCreated
            })
        } catch (error) {
            if(isFile){
                await unlink(tempFilePath);
            }
            res.status(500).json({ error: error.message })
        }
    }
}