import { prisma } from "../../config/db"

export const getStudentGradeInfo = async (sectionId: number, userId: number) => {
    try {
        // Obtener el ID del estudiante
        const student = await prisma.student.findFirst({
            where: { userId: userId }
        });

        if (!student) {
            throw new Error("Estudiante no encontrado");
        }

        const idStudent = student.id;
        

        // Obtener la nota del estudiante usando la tabla enrollment
        const enrollmentStudent = await prisma.enrollment.findUnique({
            where: {
                active : true,
                sectionId_studentId: {
                    sectionId: sectionId,
                    studentId: idStudent,
                }
            },
            include: {
                section: {
                    include: { 
                        class: true 
                    }
                },
            }
        });
        
        if (!enrollmentStudent) {
            throw new Error("Matrícula no encontrada");
        }

        // Extraer la nota, el código de la sección y el nombre de la clase
        const { grade: nota } = enrollmentStudent;
        const { code: sectionCode, class: classInfo } = enrollmentStudent.section;
        const { name: className } = classInfo;

        // Retornar el resultado como un objeto
        return {
            sectionCode,
            section : enrollmentStudent.section,
            teacherGrade : enrollmentStudent.TeacherGrade ,
            className,
            nota,
            obs: enrollmentStudent.OBS
        };

    } catch (error) {
        console.error(`Error en getStudentGradeInfo: ${error.message}`);
        throw error; // Propagar el error para manejarlo en el controlador
    }
};
