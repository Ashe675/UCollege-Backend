import { Request, Response } from "express";
import { prisma } from "../../config/db";

// Librerías para PDF y Excel
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export const exportExcel = async (req: Request, res: Response) => {
    try {
        const { id: userId } = req.user;

        // Buscar información del docente con sus departamentos y relaciones
        const teacher = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                teacherDepartments: {
                    include: {
                        regionalCenterFacultyCareerDepartment: {
                            include: {
                                RegionalCenterFacultyCareer: true, // Corregido el nombre y formato
                            }
                        }
                    }
                }
            }
        });

        // Verificar si el teacher existe antes de continuar
        if (!teacher) {
            return res.status(404).json({ error: 'Docente no encontrado' });
        }

        // Buscar el ID de la carrera asociada al docente
        const careerData = await prisma.regionalCenter_Faculty_Career_Department.findFirst({
            where: {
                RegionalCenterFacultyCareerDepartmentTeacher: {
                    some: { teacherId: teacher.id }
                }
            },
            include: {
                RegionalCenterFacultyCareer: true
            }
        });

        // Validar si se encontró la carrera
        if (!careerData || !careerData.RegionalCenterFacultyCareer) {
            return res.status(404).json({ error: 'No se encontró la carrera asociada al docente' });
        }

        const carrerIdTeacher = careerData.RegionalCenterFacultyCareer.careerId;

        // Buscar las secciones asociadas a la carrera del docente
        const sections = await prisma.section.findMany({
            where: {
                regionalCenter_Faculty_Career: { careerId: carrerIdTeacher },
                academicPeriod: {
                    process: { active: true, processTypeId: 5 }
                }
            },
            include: {
                class: true,
                teacher: {
                    include: {
                        person: true
                    }
                },
                enrollments: true,
                classroom: {
                    include: { building: true }
                }
            }
        });

        // Crear un nuevo libro de Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sections');

        // Agregar los encabezados de columna
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Código Clase', key: 'classCode', width: 10 },
            { header: 'Clase', key: 'className', width: 50 },
            { header: 'Código Docente', key: 'teacherCode', width: 30 },
            { header: 'Docente', key: 'teacherName', width: 50 },
            { header: 'No. Estudiantes', key: 'studentCount', width: 20 },
            { header: 'Cupos', key: 'capacity', width: 10 },
            { header: 'Aula', key: 'classroom', width: 20 },
            { header: 'Edificio', key: 'building', width: 30 },
            // Añade las columnas que necesites según la estructura de tu modelo Section
        ];

        // Agregar filas de datos
        sections.forEach((section) => {
            const teacherName = section.teacher?.person
                ? `${section.teacher.person.firstName || ''} ${section.teacher.person.lastName || ''}`.trim()
                : 'No asignado';

            worksheet.addRow({
                id: section.id,
                classCode: section.class?.code || '',
                className: section.class?.name || '',
                teacherCode: section.teacher?.identificationCode || '',
                teacherName: teacherName,
                studentCount: section.enrollments.length || 0,
                capacity: section.capacity || 0,
                classroom: section.classroom?.code || '',
                building: section.classroom?.building?.code || '',
            });
        });

        // Escribir el archivo en un buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Configurar las cabeceras de respuesta para la descarga
        res.setHeader('Content-Disposition', 'attachment; filename=sections.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (error) {
        console.error('Error exporting Excel:', error);
        res.status(500).json({
            error: error.message || 'Error interno del servidor',
        });
    }
};

export const exportPdf = async (req: Request, res: Response) => {
    try {
        const { id: userId } = req.user;

        // Buscar información del docente con sus departamentos y relaciones
        const teacher = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                teacherDepartments: {
                    include: {
                        regionalCenterFacultyCareerDepartment: {
                            include: {
                                RegionalCenterFacultyCareer: true,
                            }
                        }
                    }
                }
            }
        });

        if (!teacher) {
            return res.status(404).json({ error: 'Docente no encontrado' });
        }

        const careerData = await prisma.regionalCenter_Faculty_Career_Department.findFirst({
            where: {
                RegionalCenterFacultyCareerDepartmentTeacher: {
                    some: { teacherId: teacher.id }
                }
            },
            include: {
                RegionalCenterFacultyCareer: { include: { career: true } }
            }
        });

        if (!careerData || !careerData.RegionalCenterFacultyCareer) {
            return res.status(404).json({ error: 'No se encontró la carrera asociada al docente' });
        }

        const carrerIdTeacher = careerData.RegionalCenterFacultyCareer.careerId;

        const sections = await prisma.section.findMany({
            where: {
                regionalCenter_Faculty_Career: { careerId: carrerIdTeacher },
                academicPeriod: {
                    process: { active: true, processTypeId: 5 }
                }
            },
            include: {
                class: true,
                teacher: {
                    include: {
                        person: true
                    }
                },
                enrollments: true,
                classroom: {
                    include: { building: true }
                },
                regionalCenter_Faculty_Career: true
            }
        });

        const period = await prisma.academicPeriod.findFirst({
            where: {
                process: { active: true, processTypeId: 5 }
            },
            include: {
                process: true
            }
        });

        // Crear un nuevo documento PDF con tamaño personalizado
        const doc = new PDFDocument({
            size: [700, 900], // Personaliza el tamaño de la página según sea necesario
            margin: 30,
            layout: 'landscape'
        });
        const tableTop = 80;
        const columnWidths = {
            id: 40,
            classCode: 100,
            className: 150,
            teacherCode: 100,
            teacherName: 90,
            studentCount: 90,
            capacity: 70,  // Reducido para hacer espacio para 'Aula'
            classroom: 70, // Ancho para 'Aula'
            building: 90,
        };

        // Configurar las cabeceras de respuesta para la descarga del PDF
        res.setHeader('Content-Disposition', 'attachment; filename=sections.pdf');
        res.setHeader('Content-Type', 'application/pdf');

        // Escribir el PDF en la respuesta
        doc.pipe(res);

        // Título del documento
        doc.fontSize(18).text(`Carga Académica - ${careerData.RegionalCenterFacultyCareer.career.name}\nPeriodo ${period.number} - Año ${period.process.startDate.getFullYear()}`, { align: 'center' });
        doc.moveDown(2);

        // Dibujar encabezados de tabla
        drawTableRow(doc, tableTop, "ID", "Cod. Clase", "Clase", "Cod. Docente", "Docente", "No. Estudiantes", "Cupos", "Aula", "Edificio", columnWidths);
        drawTableLine(doc, tableTop + 15, columnWidths);

        // Dibujar filas de datos
        let position = tableTop + 30;
        sections.forEach((section, index) => {
            const teacherName = section.teacher?.person
                ? `${section.teacher.person.firstName || ''} ${section.teacher.person.lastName || ''}`.trim()
                : 'No asignado';

            // Calcula la altura de la fila en función del contenido más alto
            const rowHeight = calculateRowHeight(doc, [
                section.id.toString(),
                section.class?.code || '',
                section.class?.name || '',
                section.teacher?.identificationCode || '',
                teacherName,
                section.enrollments.length.toString(),
                section.capacity.toString(),
                section.classroom?.code || '',
                section.classroom?.building?.code || ''
            ], columnWidths);

            drawTableRow(
                doc,
                position,
                section.id.toString(),
                section.class?.code || '',
                section.class?.name || '',
                section.teacher?.identificationCode || '',
                teacherName,
                section.enrollments.length.toString(),
                section.capacity.toString(),
                section.classroom?.code || '',
                section.classroom?.building?.code || '',
                columnWidths
            );
            drawTableLine(doc, position + rowHeight - 5, columnWidths);
            position += rowHeight;

            // Verifica si el contenido se ha salido de la página, y si es así, agrega una nueva página
            if (position > doc.page.height - 40) {
                doc.addPage();
                position = tableTop;
                drawTableRow(doc, tableTop, "ID", "Código Clase", "Clase", "Código Docente", "Docente", "No. Estudiantes", "Cupos", "Aula", "Edificio", columnWidths);
                drawTableLine(doc, tableTop + 15, columnWidths);
                position += 30;
            }
        });

        // Finalizar el documento PDF
        doc.end();
    } catch (error) {
        console.error('Error exporting PDF:', error);
        res.status(500).json({
            error: error.message || 'Error interno del servidor',
        });
    }
};

// Función para dibujar una fila de tabla
function drawTableRow(doc: PDFKit.PDFDocument, y: number, id: string, classCode: string, className: string, teacherCode: string, teacherName: string, studentCount: string, capacity: string, classroom: string, building: string, columnWidths: any) {
    doc.fontSize(10);
    doc.text(id, 30, y, { width: columnWidths.id, align: 'left' });
    doc.text(classCode, 30 + columnWidths.id, y, { width: columnWidths.classCode, align: 'left' });
    doc.text(className, 30 + columnWidths.id + columnWidths.classCode, y, { width: columnWidths.className, align: 'left' });
    doc.text(teacherCode, 30 + columnWidths.id + columnWidths.classCode + columnWidths.className, y, { width: columnWidths.teacherCode, align: 'left' });
    doc.text(teacherName, 30 + columnWidths.id + columnWidths.classCode + columnWidths.className + columnWidths.teacherCode, y, { width: columnWidths.teacherName, align: 'left' });
    doc.text(studentCount, 30 + columnWidths.id + columnWidths.classCode + columnWidths.className + columnWidths.teacherCode + columnWidths.teacherName, y, { width: columnWidths.studentCount, align: 'right' });
    doc.text(capacity, 40 + columnWidths.id + columnWidths.classCode + columnWidths.className + columnWidths.teacherCode + columnWidths.teacherName + columnWidths.studentCount, y, { width: columnWidths.capacity, align: 'right' });
    doc.text(classroom, 30 + columnWidths.id + columnWidths.classCode + columnWidths.className + columnWidths.teacherCode + columnWidths.teacherName + columnWidths.studentCount + columnWidths.capacity, y, { width: columnWidths.classroom, align: 'right' });
    doc.text(building, 40 + columnWidths.id + columnWidths.classCode + columnWidths.className + columnWidths.teacherCode + columnWidths.teacherName + columnWidths.studentCount + columnWidths.capacity + columnWidths.classroom, y, { width: columnWidths.building, align: 'center' });
}

// Función para dibujar una línea entre las filas de la tabla
function drawTableLine(doc: PDFKit.PDFDocument, y: number, columnWidths: any) {
    doc.strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(30, y)
        .lineTo(30 + columnWidths.id + columnWidths.classCode + columnWidths.className + columnWidths.teacherCode + columnWidths.teacherName + columnWidths.studentCount + columnWidths.capacity + columnWidths.classroom + columnWidths.building, y)
        .stroke();
}

// Función para calcular la altura de la fila
function calculateRowHeight(doc: PDFKit.PDFDocument, texts: string[], columnWidths: any): number {
    let maxHeight = 0;
    texts.forEach((text, i) => {
        const width = Object.values(columnWidths)[i] as number;
        const height = doc.heightOfString(text, { width });
        if (height > maxHeight) {
            maxHeight = height;
        }
    });
    return maxHeight + 5; // Añadir un poco de espacio extra
}