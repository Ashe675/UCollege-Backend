import { Socket } from "socket.io";
import { joinRoom, leaveRoom } from "./room";
import { prisma } from "../../config/db";
import { io } from "../../server";


export const handleEvents = (socket: Socket) => {
    socket.on("joinConversation", (conversationId: string) => {
        // console.log("Se unió un usuario a ", conversationId, socket.data.user)
        joinRoom(socket, conversationId)

    })

    socket.on("leaveConversation", (conversationId: string) => {
        // console.log("Se desconectó un usuario de ", conversationId, socket.data.user)
        leaveRoom(socket, conversationId)
        joinRoom(socket, conversationId)

    })

    socket.on("connectedUser", async (userId: string) => {

        await prisma.user.update({
            where: {
                id: Number(userId)
            },
            data: {
                isOnline: true,
                lastOnline: null
            }
        })

        // Emitir a todos los sockets que el usuario está en línea
        socket.broadcast.emit("userStatusChanged", { userId, isOnline: true,  lastOnline: null });

        joinRoom(socket, userId)
    })

    socket.on("disconnectedUser", async (userId: string) => {

        await prisma.user.update({
            where: {
                id: Number(userId)
            },
            data: {
                isOnline: false,
                lastOnline: new Date()
            }
        })

        // Emitir a todos los sockets que el usuario está fuera de línea
        socket.broadcast.emit("userStatusChanged", { userId, isOnline: false, lastOnline: new Date() });

        leaveRoom(socket, userId)
    })

    socket.on('disconnect', async () => {
        // console.log("New socket disconnect", socket.id, socket.data.user)

        const userId = socket.data.user?.id;
        if (userId) {
            await prisma.user.update({
                where: { id: Number(userId) },
                data: {
                    isOnline: false,
                    lastOnline: new Date()
                }
            });
            socket.broadcast.emit("userStatusChanged", { userId, isOnline: false, lastOnline: new Date()  });
        }

    })
}