import { prisma } from '../../config/db';

export const getClassesOfDepartment = async (departmentId: number)=>{

    try {
        const classes = await prisma.class.findMany({
            where: {
                departamentId: departmentId,
                active: true
            }
        });
        return classes;
    } catch (error) {
        console.error('Error al obtener las clases por departamento:', error);
        throw new Error('Error al obtener Clases por departamento');
    }
}