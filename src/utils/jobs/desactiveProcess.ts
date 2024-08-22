import cron from 'node-cron';
import { prisma } from '../../config/db'; // Asegúrate de que la ruta sea correcta
import { DateTime } from 'luxon';
import { RoleMember } from '@prisma/client';

export const scheduleProcessVerification = () => {// Definir el trabajo que se ejecutará cada minuto
  cron.schedule('0 * * * *', async () => {
    //console.log('Ejecutando trabajo de verificación de fechas...');

    // Obtener la fecha y hora actual en UTC
    const now = DateTime.now().toUTC().toJSDate();

    
    try {
      // Desactivar procesos que están fuera del rango de fechas

      const processes = await prisma.process.findMany({
        where: { active: true }
      });

      // Crear una lista de promesas para actualizar los procesos
     processes.map(async (element) => {
        if (!(now >= element.startDate && now <= element.finalDate)) {
          // si el proceso es de matricula vamos a eliminar los enrollments que estan en lista de espera
          if (element.processTypeId === 3) {
            await prisma.enrollment.deleteMany({
              where: {
                waitingListId: {
                  not: null
                },
                section: {
                  academicPeriod: {
                    process: {
                      active: true
                    }
                  }
                }
              }
            })
            

            const sections = await prisma.section.findMany({
              where: {
                active: true,
                academicPeriod: {
                  process: {
                    active: true
                  }
                },
              },
              include: {
                class: true,
                academicPeriod: true,
                enrollments: {
                  where : {
                    waitingList : null,
                    active : true
                  },
                  include: {
                    student: {
                      include: {
                        user: true
                      }
                    }
                  }
                }
              }
            })

           
            // CREANDO LOS GRUPOS DE CHAT POR CADA SECCION 
            for (const section of sections) {

              const existingGroup = await prisma.conversation.findFirst({
                where: {
                  groupTitle: `${section.class.name}-${section.code}-${section.academicPeriod.number}PAC-${now.getFullYear()}`,
                  type: 'GROUP'
                }
              });

              if (!existingGroup) {

                const conver = await prisma.conversation.create({
                  data: {
                    groupTitle: `${section.class.name}-${section.code}-${section.academicPeriod.number}PAC-${now.getFullYear()}`,
                    isGroup: true,
                    type: 'GROUP',
                    members: {
                      createMany: {
                        data: [
                          { userId: section.teacherId, role: 'ADMIN' },
                          ...section.enrollments.map((enroll) => ({ userId: enroll.student.userId, role: RoleMember.MEMBER }))
                        ]
                      }
                    }
                  }
                })
              
              }
            }

          }
          await prisma.process.update({
            where: { id: element.id },
            data: { active: false }
          });
        }
      });

      const now2 = DateTime.now().toUTC();

      // Activar procesos que coincidan con la hora actual
      const processesToActivate = await prisma.process.findMany({
        where: {
          active: false,
          startDate: { lte: now2.toJSDate() },
          finalDate: { gte: now2.toJSDate() }
        }
      });

      const activatePromises = processesToActivate.map(async (element) => {
        // Activar procesos que coincidan con la hora actual
        const processStartHour = DateTime.fromJSDate(element.startDate).toUTC().hour;

        if (processStartHour === now2.hour) {
          console.log(`Activando proceso con ID: ${element.id}`);
          return prisma.process.update({
            where: { id: element.id },
            data: { active: true }
          });
        } else {
          console.log(`No se activó el proceso con ID: ${element.id}. Hora del proceso: ${processStartHour}, Hora actual: ${now2.hour}`);
        }
      });
      // Ejecutar todas las activaciones en paralelo
      await Promise.all(activatePromises);

    } catch (error) {
      console.error('Error al ejecutar el trabajo de verificación de fechas:', error);
    }
  });
}