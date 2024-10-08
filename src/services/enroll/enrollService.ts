import { Career, RegionalCenter_Faculty_Career, RoleEnum } from "@prisma/client";
import { prisma } from "../../config/db";
import { insertRandomDots, makeUserMethodSingle, shuffleArray } from "../../utils/enroll/generateRandomEmail";
import { StudentData } from "../admission/CSVService";
import { generateIdentificationCodeStudent } from "../../utils/admin/generateIdentifactionCode";
import { generatePasswordUser } from "../../utils/admin/generatePassword";
import { hashPassword } from "../../utils/auth/auth";
import { AuthEmail, IEmail2 } from "../mail/authEmail";

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

            username.replace(/[ñÑ]/g, 'n')
            username.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            // Check if the username already exists
            const userExists = await prisma.user.findUnique({ where: { institutionalEmail: username + domain } });

            if (!userExists) {
                break;
            }
        }

        username.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        return username.replace(/[ñÑ]/g, 'n').toLowerCase() + domain;
    }


    static async createUsersStudents(students: StudentData[]) {
        let index = 0;
        let countIdentification = 0 
        const users: IEmail2[] = []
        await prisma.$transaction(async tx => {
            for (const student of students) {
                index++
                let principalCareerFound: Career = undefined;
                let secondaryCareerFound: Career = undefined;
                let regionalCenterFacultyPrincipalCareer: RegionalCenter_Faculty_Career = undefined;
                let regionalCenterFacultySecondaryCareer: RegionalCenter_Faculty_Career = undefined;
                let career: Career = undefined;
                let regionalCenterFactultyCareer: RegionalCenter_Faculty_Career = undefined;
           

                if (student.dni.length > 13) {
                    throw new Error(`DNI inválido, línea: ${index}`)
                }

                if (student.primer_nombre.toUpperCase() == 'NULL' || student.primer_apellido.toUpperCase() == 'NULL') {
                    throw new Error(`Nombre inválido, línea: ${index}`)
                }

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

                    regionalCenterFacultyPrincipalCareer = await tx.regionalCenter_Faculty_Career.findFirst({ where: { careerId: principalCareerFound.id, regionalCenter_Faculty_RegionalCenterId: regionalCenter.id, active: true } })

                    if (!regionalCenterFacultyPrincipalCareer) {
                        throw new Error(`La carrera principal ${principalCareerFound.code} no está disponible en el centro regional ${regionalCenter.code}, línea: ${index}`)
                    }
                }



                if (student.carrera_secundaria.toUpperCase() !== 'NULL') {

                    secondaryCareerFound = await tx.career.findUnique({ where: { code: student.carrera_secundaria.toUpperCase() } })

                    if (!secondaryCareerFound) {
                        throw new Error(`La carrera secundaria no existe, línea: ${index}`)
                    }

                    regionalCenterFacultySecondaryCareer = await tx.regionalCenter_Faculty_Career.findFirst({ where: { careerId: secondaryCareerFound.id, regionalCenter_Faculty_RegionalCenterId: regionalCenter.id, active: true } })

                    if (!regionalCenterFacultySecondaryCareer) {
                        throw new Error(`La carrera secundaria ${secondaryCareerFound.code} no está disponible en el centro regional ${regionalCenter.code}, línea: ${index}`)
                    }
                }


                if (!principalCareerFound && !secondaryCareerFound) {
                    throw new Error(`El estudiante no aprobó ninguna carrera, fila: ${index}`)
                }

                const userIsEnrollment = await tx.enrollment.findFirst({ where: { student: { user: { person: { dni: student.dni } } } } })

                if (userIsEnrollment) {
                    throw new Error(`El estudiante ya está matriculado, fila: ${index}`)
                }

                const emailExists = await tx.person.findFirst({ where: { dni: { not: student.dni }, email: student.correo_electronico } })

                if (emailExists) {
                    throw new Error(`El correo le pertenece a otra pesona, fila: ${index}`)
                }

                let userFound = await tx.user.findFirst({ where: { person: { dni: student.dni } } })
                if (userFound) {

                    if(userFound.roleId !== 5){
                        throw new Error(`Este estudiante es un docente, fila: ${index}`)
                    }

                    await tx.regionalCenter_Faculty_Career_User.deleteMany({ where: { userId: userFound.id } })
                    await tx.user.update({
                        data: { verified: false }, where: {
                            id: userFound.id
                        }
                    })

                    await tx.optionCareer.deleteMany({ where: { userId: userFound.id } })

                    await tx.person.update({ data: { email: student.correo_electronico }, where: { dni: student.dni } })
                    await tx.person.update({ data: { phoneNumber: student.numero_telefonico }, where: { dni: student.dni } })
                } else {
                    const middleName = student.segundo_nombre.toUpperCase() === 'NULL' ? null : student.segundo_nombre
                    const secondLastName = student.segundo_apellido.toUpperCase() === 'NULL' ? null : student.segundo_apellido
                    const userName = await EnrollService.generateUniqueUsername(student.primer_nombre, middleName, student.primer_apellido, secondLastName)
                    const identificationCode = parseInt(await generateIdentificationCodeStudent()) + countIdentification
                  
                    const passwordGenerate = await generatePasswordUser()
                    const passwordHashed = await hashPassword(passwordGenerate)


                    let person = {
                        dni: student.dni,
                        email: student.correo_electronico,
                        firstName: student.primer_nombre,
                        middleName,
                        lastName: student.primer_apellido,
                        secondLastName,
                        phoneNumber: student.numero_telefonico,
                    }

                    userFound = await tx.user.create({
                        data: {
                            identificationCode : identificationCode.toString(),
                            institutionalEmail: userName,
                            password: passwordHashed,
                            verified: false,
                            role: {
                                connect: {
                                    name: RoleEnum.STUDENT
                                }
                            },
                            person: {
                                connectOrCreate: {
                                    where: { dni: student.dni },
                                    create: {
                                        dni: student.dni,
                                        email: student.correo_electronico,
                                        firstName: student.primer_nombre,
                                        middleName: student.segundo_nombre.toUpperCase() === 'NULL' ? null : student.segundo_nombre,
                                        lastName: student.primer_apellido,
                                        secondLastName: student.segundo_apellido.toUpperCase() === 'NULL' ? null : student.segundo_apellido,
                                        phoneNumber: student.numero_telefonico
                                    }
                                }
                            }
                        }
                    })

                    await tx.student.create({
                        data : {
                            userId : userFound.id
                        }
                    })

                    users.push({
                        email: student.correo_electronico,
                        newEmail: userFound.institutionalEmail,
                        name: student.primer_nombre,
                        password: passwordGenerate
                    })
                }



                if (principalCareerFound && secondaryCareerFound) {
                    await tx.optionCareer.createManyAndReturn({
                        data: [
                            {
                                userId: userFound.id,
                                regionalCenter_Faculty_CareerId: regionalCenterFacultyPrincipalCareer.id
                            },
                            {
                                userId: userFound.id,
                                regionalCenter_Faculty_CareerId: regionalCenterFacultySecondaryCareer.id
                            }
                        ]
                    })

                } else {
                    career = principalCareerFound?.id ? principalCareerFound : secondaryCareerFound
                    regionalCenterFactultyCareer = regionalCenterFacultyPrincipalCareer?.id ? regionalCenterFacultyPrincipalCareer : regionalCenterFacultySecondaryCareer

                    await tx.regionalCenter_Faculty_Career_User.create({
                        data: {
                            userId: userFound.id,
                            regionalCenter_Faculty_CareerId: regionalCenterFactultyCareer.id
                        }
                    })

                    await tx.user.update({ where : { id : userFound.id }, data : {
                        verified : true
                    } })

                    
                }
                countIdentification++;
            }
        }, {
            maxWait: 20000, // Aumenta el tiempo máximo de espera a 10 segundos
            timeout: 30000, // Aumenta el tiempo de espera de la transacción a 20 segundos
        })

        for (const user of users) {
            await AuthEmail.sendPasswordAndEmail(user, true);
        }

    }
}