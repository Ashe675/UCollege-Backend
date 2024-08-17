import { prisma } from "../../config/db"

// Función que recibe sectionId y userId y retorna la nota, nombre de la clase y código de la sección
export const getStudentGradeInfo = async (sectionId: number, userId: number) => {
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
            sectionId_studentId: {
                sectionId: sectionId,
                studentId: idStudent,
            }
        },
        include: {
            section: { include: { class: true } },
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
        className,
        nota
    };
};
