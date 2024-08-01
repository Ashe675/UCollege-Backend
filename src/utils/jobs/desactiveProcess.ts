import cron from 'node-cron';
import { prisma } from '../../config/db'; // Asegúrate de que la ruta sea correcta
import { DateTime } from 'luxon';

// Definir el trabajo que se ejecutará cada minuto
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
    const updatePromises = processes.map(async (element) => {
      if (!(now >= element.startDate && now <= element.finalDate)) {
        return prisma.process.update({
          where: { id: element.id },
          data: { active: false }
        });
      }
    });

    // Ejecutar todas las actualizaciones en paralelo
    await Promise.all(updatePromises);

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
    console.log('se ejecuto un job de procesos')

  } catch (error) {
    console.error('Error al ejecutar el trabajo de verificación de fechas:', error);
  }
});
