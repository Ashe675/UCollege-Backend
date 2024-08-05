import { prisma } from '../../config/db'; // Asegúrate de que la ruta sea correcta
export const getRegionalCenterSection = async (id: number) => {
    const center = await prisma.section.findFirst({
        where:{id: id},
        select: {classroom : {select :{building: {select: {regionalCenterId: true}}}}}
    });
    const regionalCenterId= center.classroom.building.regionalCenterId;
    return regionalCenterId;
  };

  export const getMatriculados = async (sectionId: number) => {
    const enrollments = await prisma.enrollment.findMany({
      where: { sectionId: sectionId, waitingListId: null },
      select: {
        student: {
          select: {
            user: {
              select: {
                id: true,
                identificationCode: true,
                institutionalEmail: true,
                person: {
                  select: {
                    dni: true,
                    firstName: true,
                    middleName: true,
                    lastName: true,
                    secondLastName: true
                  }
                }
              }
            }
          }
        }
      }
    });
  
    // Mapea el resultado para obtener solo los campos necesarios
    const matriculados = enrollments.map(enrollment => ({
      id: enrollment.student.user.id,
      identificationCode: enrollment.student.user.identificationCode,
      instituionalEmail: enrollment.student.user.institutionalEmail,
      person: {
        dni: enrollment.student.user.person.dni,
        FirstName: enrollment.student.user.person.firstName,
        MiddleName: enrollment.student.user.person.middleName,
        LastName: enrollment.student.user.person.lastName,
        SecondLastName: enrollment.student.user.person.secondLastName
      }
    }));
  
    return matriculados;
  };

  export const getEnListadeEspera = async (sectionId: number) => {
    const waitingList = await prisma.waitingList.findFirst({
        where: {sectionId: sectionId}
    });
    const waitingListId= waitingList.sectionId;
    const enrollments = await prisma.enrollment.findMany({
      where: { sectionId: sectionId, waitingListId: { not: null } },
      select: {
        student: {
          select: {
            user: {
              select: {
                id: true,
                identificationCode: true,
                institutionalEmail: true,
                person: {
                  select: {
                    dni: true,
                    firstName: true,
                    middleName: true,
                    lastName: true,
                    secondLastName: true
                  }
                }
              }
            }
          }
        }
      }
    });
  
    // Mapea el resultado para obtener solo los campos necesarios
    const matriculados = enrollments.map(enrollment => ({
      id: enrollment.student.user.id,
      identificationCode: enrollment.student.user.identificationCode,
      instituionalEmail: enrollment.student.user.institutionalEmail,
      person: {
        dni: enrollment.student.user.person.dni,
        FirstName: enrollment.student.user.person.firstName,
        MiddleName: enrollment.student.user.person.middleName,
        LastName: enrollment.student.user.person.lastName,
        SecondLastName: enrollment.student.user.person.secondLastName
      }
    }));
  
    return matriculados;
  };