import { prisma } from "../../config/db";

export class EnrollService {
    static async enrollStudentCareer(optionId : number, userId : number) {
        const option = await prisma.optionCareer.findUnique({where : { id : optionId, userId}})
        if(!option){
            throw new Error(`La opción es inválida`)
        }

        const enroll = await prisma.regionalCenter_Faculty_Career_User.findFirst({
            where : {
                userId,
                regionalCenter_Faculty_CareerId : option.regionalCenter_Faculty_CareerId
            }
        })

        if(enroll){
            throw new Error(`Ya está matriculado en la carrera`)
        }

        await prisma.regionalCenter_Faculty_Career_User.create({data : {
            regionalCenter_Faculty_CareerId : option.regionalCenter_Faculty_CareerId,
            userId
        }})

        await prisma.optionCareer.deleteMany({where : {userId}})

        await prisma.user.update({where: {id : userId}, data : { verified : true }})

    }
}