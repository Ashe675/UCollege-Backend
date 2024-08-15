import { prisma } from '../../config/db'; // Asegúrate de que la ruta sea correcta
export const getRegionalCenterTeacher = async (id: number) => {
    const center = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
      where: { teacherId: id },
      select: {regionalCenterFacultyCareerDepartment: {select: {RegionalCenterFacultyCareer: {select:{regionalCenter_Faculty : {select : {regionalCenterId : true}}}}}}}}
    );
    const regionalCenterId = center.regionalCenterFacultyCareerDepartment.RegionalCenterFacultyCareer.regionalCenter_Faculty.regionalCenterId;
    return regionalCenterId;
  };

export const getRegionalCenterFacultyCareerTeacher = async (userId: number) => {
  const regionalCenterCareer = await prisma.regionalCenter_Faculty_Career_Department_Teacher.findFirst({
    where:{teacherId: userId},
    select:{regionalCenterFacultyCareerDepartment:{select:{ regionalCenter_Faculty_CareerId : true}}}
  });
  if (!regionalCenterCareer) {
    throw new Error("Carrera no encontrada");
    
  }
  return regionalCenterCareer.regionalCenterFacultyCareerDepartment.regionalCenter_Faculty_CareerId;
};