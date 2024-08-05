import { prisma } from '../../config/db'; // Asegúrate de que la ruta sea correcta
export const getRegionalCenterSection = async (id: number) => {
    const center = await prisma.section.findFirst({
        where:{id: id},
        select: {classroom : {select :{building: {select: {regionalCenterId: true}}}}}
    });
    const regionalCenterId= center.classroom.building.regionalCenterId;
    return regionalCenterId;
  };