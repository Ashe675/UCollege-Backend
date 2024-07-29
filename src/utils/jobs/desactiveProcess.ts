import cron from 'node-cron';
import { prisma } from '../../config/db'; // Asegúrate de que la ruta sea correcta
import { DateTime } from 'luxon';

// Definir el trabajo que se ejecutará cada minuto
cron.schedule('0 0 * * *', async () => {
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

    //console.log(process)


    // Activar procesos que están dentro del rango de fechas
     // Paso 1: Obtener procesos que están inactivos pero deberían estar activos
     const processesToActivate = await prisma.process.findMany({
        where: {
            active: false,
            startDate: { lte: now },
            finalDate: { gte: now },
        },
    });

    // Paso 2: Crear una lista de promesas para actualizar los procesos
    const activatePromises = processesToActivate.map(process =>
        prisma.process.update({
            where: { id: process.id },
            data: { active: true },
        })
    );

    // Ejecutar todas las actualizaciones en paralelo
    await Promise.all(activatePromises);

    //console.log('Procesos activados exitosamente.');
    

    //console.log('Trabajo de verificación de fechas completado.');
  } catch (error) {
    console.error('Error al ejecutar el trabajo de verificación de fechas:', error);
  }
});
