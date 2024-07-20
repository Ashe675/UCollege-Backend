import { Role, User } from '@prisma/client'
import jwt from 'jsonwebtoken'

type UserPayload = {
    id : User['id'],
    role : Role['name']
}

export const generateJWT = (payload : UserPayload) =>{
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn : '2h'
    })

    return token
}