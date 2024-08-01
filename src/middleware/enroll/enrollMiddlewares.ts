import { Request, Response, NextFunction } from 'express';
import { prisma } from "../../config/db";
import { DateTime } from 'luxon';

// funcion que calcula la diferencia en dias de 2 fechas
const differenceInDays = (startDate: Date, endDate: Date): number => {
    // Convertir las cadenas de fecha en objetos DateTime
    const start = DateTime.fromJSDate(startDate).toUTC().startOf('day');
    const end = DateTime.fromJSDate(endDate).toUTC().startOf('day');

    // Calcular la diferencia en días
    return end.diff(start, 'days').days;
};

// Función para verificar que las fechas no se traslapen
const datesOverlap = (start1: Date, end1: Date, start2: Date, end2: Date): boolean => {
    return !(end1 <= start2 || end2 <= start1);
};

export const isActiveProcessByProcessTypeIdGeneric = async (req: Request, res: Response, next: NextFunction) => {
    let { processTypeId } = req.body

    processTypeId = parseInt(processTypeId)

    if (isNaN(processTypeId)) return res.status(400).json({ error: 'Tipo de proceso inválido.' });

    const processType = await prisma.processType.findUnique({ where: { id: processTypeId } })

    if (!processType) return res.status(400).json({ error: 'Tipo de proceso inválido.' });


    const process = await prisma.process.findFirst({ where: { processTypeId, active : true } })

    if (process) {
        const processType = await prisma.processType.findUnique({ where: { id: processTypeId } })
        return res.status(400).json({ error: `Hay un proceso de ${processType.name} activo` });
    }

    next();
};



// middleware que verifica que se manden los dias completos por un procesos de matricula
export const checkDaysComplete = async (req: Request, res: Response, next: NextFunction) => {
    let { days, startDate, finalDate, processTypeId } = req.body
    try {
        processTypeId = parseInt(processTypeId)

        if (isNaN(processTypeId)) return res.status(400).json({ error: 'Tipo de proceso inválido.' });

        const processType = await prisma.processType.findUnique({ where: { id: processTypeId } })

        if (!processType || processType?.id !== 3) return res.status(400).json({ error: 'Tipo de proceso inválido.' });

        const countDays = differenceInDays(new Date(startDate), new Date(finalDate))

        if (!days || days.length !== countDays) {
            return res.status(400).json({ error: `Tienes que definir (${countDays}) días de la matrícula. ` });
        }

        const generalStartDate = new Date(startDate).getTime();
        const generalFinalDate = new Date(finalDate).getTime();

        // Verificar traslape de fechas y coincidencia con startDate y finalDate generales
        for (let i = 0; i < days.length; i++) {
            const day = days[i];
            const dayStartDate = new Date(day.startDate).getTime();
            const dayFinalDate = new Date(day.finalDate).getTime();

            if (i === 0 && dayStartDate !== generalStartDate) {
                return res.status(400).json({ error: 'El primer día debe coincidir con la fecha de inicio.' });
            }

            if (i === days.length - 1 && dayFinalDate !== generalFinalDate) {
                return res.status(400).json({ error: 'El último día debe coincidir con la fecha de finalización.' });
            }

            // Verificar que startDate sea menor a finalDate para cada día
            if (dayStartDate >= dayFinalDate) {
                return res.status(400).json({ error: `El día ${i + 1} tiene una fecha inicial posterior a la fecha final.` });
            }

            // Verificar que las fechas de los días estén dentro del rango definido por startDate y finalDate generales
            if (dayStartDate < generalStartDate || dayFinalDate > generalFinalDate) {
                return res.status(400).json({ error: `Las fechas del día ${i + 1} están fuera del rango definido por la fecha de inicio y finalización generales.` });
            }


            // Verificar traslape con los siguientes días
            for (let j = i + 1; j < days.length; j++) {
                const nextDay = days[j];

                if (datesOverlap(new Date(day.startDate), new Date(day.finalDate), new Date(nextDay.startDate), new Date(nextDay.finalDate))) {
                    return res.status(400).json({ error: `Las fechas de los días no deben traslaparse. (dia ${j + 1}) ` });
                }
            }

        }


        next();
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Internal server error' });
    }

};