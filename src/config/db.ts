import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config()
import colors from 'colors'

export const prisma = new PrismaClient()
// Conectando a bdd
export async function connectDB() {
    try {
        await prisma.$connect();
        console.log(colors.magenta.bold('Successfully connection to db'))
        return prisma
    } catch (error) {
        // console.log(error)
        console.log(colors.red.bold('Error db Connection'))
    }
}

export default connectDB