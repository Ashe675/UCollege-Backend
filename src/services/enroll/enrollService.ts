import { Career } from "@prisma/client";
import { prisma } from "../../config/db";
import { insertRandomDots, makeUserMethodSingle, shuffleArray } from "../../utils/enroll/generateRandomEmail";
import { StudentData } from "../admission/CSVService";

export class EnrollService {
    static async enrollStudentCareer(optionId: number, userId: number) {
        const option = await prisma.optionCareer.findUnique({ where: { id: optionId, userId } })
        if (!option) {
            throw new Error(`La opción es inválida`)
        }

        const enroll = await prisma.regionalCenter_Faculty_Career_User.findFirst({
            where: {
                userId,
                regionalCenter_Faculty_CareerId: option.regionalCenter_Faculty_CareerId
            }
        })

        if (enroll) {
            throw new Error(`Ya está matriculado en la carrera`)
        }

        await prisma.regionalCenter_Faculty_Career_User.create({
            data: {
                regionalCenter_Faculty_CareerId: option.regionalCenter_Faculty_CareerId,
                userId
            }
        })

        await prisma.optionCareer.deleteMany({ where: { userId } })

        await prisma.user.update({ where: { id: userId }, data: { verified: true } })

    }


    /**
     * Generates a unique username based on provided names.
     * 
     * @param {string} firstName - The first name of the user.
     * @param {string | null} middleName - The middle name of the user.
     * @param {string} lastName - The last name of the user.
     * @param {string | null} secondLastName - The second last name of the user.
     * @param {string} domain - The domain to append to the username.
     * @returns {Promise<string>} - A unique username.
     */
    static async generateUniqueUsername(
        firstName: string,
        middleName: string | null,
        lastName: string,
        secondLastName: string | null,
        domain: string = '@unah.hn'
    ): Promise<string> {
        const nameParts = [firstName, middleName, lastName, secondLastName].filter(Boolean);
        let username = '';
        let attemps = 0;

        while (true) {
            attemps++
            const randomParts = shuffleArray(nameParts).slice(0, Math.floor(Math.random() * nameParts.length) + 1);

            if (attemps > 45) {
                username = randomParts.join('').replace(/ /g, '');
                username = insertRandomDots(username);
            } else {
                // Insert dots optionally
                username = makeUserMethodSingle(randomParts);
            }


            // Check if the username already exists
            const userExists = await prisma.user.findUnique({ where: { institutionalEmail: username + domain } });

            if (!userExists) {
                break;
            }
        }

        return username.toLowerCase() + domain;
    }


    static async createUsersStudents(students: StudentData[]) {
        let index = 0;
        await prisma.$transaction(async tx => {
            for (const student of students) {
                index++
                let principalCareerFound : Career = undefined;
                let secondaryCareerFound : Career = undefined;
                let career : Career = undefined;


                if (student.carrera_principal.toUpperCase() === student.carrera_secundaria.toUpperCase()) {
                    throw new Error(`La carrera principal y secundaria deben de ser distintas, línea: ${index}`)
                }

                const regionalCenter = await tx.regionalCenter.findUnique({ where: { code: student.centro_regional.toUpperCase() } })

                if (!regionalCenter) {
                    throw new Error(`El centro regional no existe, línea: ${index}`)
                }


                if (student.carrera_principal.toUpperCase() !== 'NULL') {
                    
                    principalCareerFound = await tx.career.findUnique({ where: { code: student.carrera_principal.toUpperCase() } })

                    if (!principalCareerFound) {
                        throw new Error(`La carrera principal no existe, línea: ${index}`)
                    }

                    const regionalCenterFacultyPrincipalCareer = await tx.regionalCenter_Faculty_Career.findFirst({ where: { careerId: principalCareerFound.id, regionalCenter_Faculty_RegionalCenterId: regionalCenter.id, active: true } })

                    if (!regionalCenterFacultyPrincipalCareer) {
                        throw new Error(`La carrera principal ${principalCareerFound.code} no está disponible en el centro regional ${regionalCenter.code}, línea: ${index}`)
                    }
                }



                if (student.carrera_secundaria.toUpperCase() !== 'NULL') {
                    
                    secondaryCareerFound = await tx.career.findUnique({ where: { code: student.carrera_secundaria.toUpperCase() } })

                    if (!secondaryCareerFound) {
                        throw new Error(`La carrera secundaria no existe, línea: ${index}`)
                    }

                    const regionalCenterFacultySecondaryCareer = await tx.regionalCenter_Faculty_Career.findFirst({ where: { careerId: secondaryCareerFound.id, regionalCenter_Faculty_RegionalCenterId: regionalCenter.id, active: true } })

                    if (!regionalCenterFacultySecondaryCareer) {
                        throw new Error(`La carrera secundaria ${secondaryCareerFound.code} no está disponible en el centro regional ${regionalCenter.code}, línea: ${index}`)
                    }
                }


                if(!principalCareerFound && !secondaryCareerFound){
                    throw new Error(`El estudiante no aprobó ninguna carrera, línea: ${index}`)
                }
                
                const userIsEnrollment = await tx.enrollment.findFirst({where : { student : { user : { person : { dni : student.dni } } } }})

                if(userIsEnrollment){
                    throw new Error(`El estudiante ya está matriculado: ${index}`)
                }

                let userFound = await tx.user.findFirst({where : { person : { dni : student.dni } }}) 
                if(userFound){
                    await tx.regionalCenter_Faculty_Career_User.deleteMany({where : { userId : userFound.id }})
                    await tx.optionCareer.deleteMany({where : { userId : userFound.id }})

                    const emailExists = await tx.person.findFirst({where : { dni : { not : student.dni }, email : student.correo_electronico}})

                    if(emailExists){
                        throw new Error(`El correo le pertenece a otra pesona: ${index}`)
                    }

                    await tx.person.update({data : { email : student.correo_electronico }, where : { dni : student.dni }})
                }else{
                    const userName = await EnrollService.generateUniqueUsername('Jose','Manuel','Cerrato',null, "@unah.hn")
                    // userFound = await tx.user.create({data : {
                    //     identificationCode : 
                    // }})
                }

                if(principalCareerFound && secondaryCareerFound){
                    console.log(principalCareerFound, secondaryCareerFound)
                }else{
                    career = principalCareerFound?.id ? principalCareerFound : secondaryCareerFound 
                    console.log(career)
                }

            }
        })
    }

}