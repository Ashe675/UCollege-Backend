import { Sequelize } from "sequelize-typescript";
import dotenv from 'dotenv';
dotenv.config()
import colors from 'colors'


const db = new Sequelize(process.env.POSTGRES_DATABASE_URL,{
    models: [__dirname + '/../models/**/*'],
    logging: false
})

// Conectando a bdd
export async function connectDB() {
    try {
        await db.authenticate()
        db.sync()
        console.log(colors.magenta.bold('Successfully connection to db'))
    } catch (error) {
        // console.log(error)
        console.log(colors.red.bold('Error db Connection'))
    }
}

export default connectDB