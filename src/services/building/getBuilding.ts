import { prisma } from '../../config/db';

export const getBuildingByRegionalCenterId = async (regionalCenterId: number) => {

    try {
        const buildings = await prisma.building.findMany({
            where: {
                regionalCenterId: regionalCenterId
            },
            include : {
                classrooms : true
            }
        });
        return buildings;
    } catch (error) {
        console.error('Error al obtener edificios por centro regional:', error);
        throw new Error('Error al obtener edificios por centro regional');
    }

}