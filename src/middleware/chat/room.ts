import { Socket } from "socket.io"

export const joinRoom = (socket : Socket, roomName : string) => {
    socket.join(roomName)
}

export const leaveRoom = (socket : Socket, roomName : string) => {
    socket.leave(roomName)
}