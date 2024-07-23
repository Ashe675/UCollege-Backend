import { prisma } from '../../config/db';
import { hashPassword } from "../../utils/auth/auth";

interface TeacherData {
    dni: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    secondLastName?: string;
    phoneNumber: string;
    email: string;
    roleId: number;
    identificationCode: string;
    institutionalEmail: string;
    password: string;
    // Otros campos necesarios...
}

export const createTeacherService = async (teacherData: TeacherData) => {
    
        const hashedPassword = await hashPassword(teacherData.password);

        const newTeacher = await prisma.user.create({
            data: {
                identificationCode: teacherData.identificationCode,
                institutionalEmail: teacherData.institutionalEmail,
                password: hashedPassword,
                verified: true,
                role: {
                    connect: { id: teacherData.roleId }
                },
                person: {
                    create: {
                        dni: teacherData.dni,
                        firstName: teacherData.firstName,
                        middleName: teacherData.middleName,
                        lastName: teacherData.lastName,
                        secondLastName: teacherData.secondLastName,
                        phoneNumber: teacherData.phoneNumber,
                        email: teacherData.email,
                    }
                }
            }
        });

        return newTeacher;
    
};
