import { Request, Response } from 'express';
import { prisma } from '../../config/db'; // Ajusta la ruta según tu configuración
import PDFCertificate from '../../services/generatorPDF/generatorPdf'; // Ajusta la ruta según tu configuración
import path from 'path';

// Función para descargar el certificado en PDF
export const downloadStudentCertificatePdf = async (req: Request, res: Response) => {
  const { id: userStudentId } = req.user;

  try {
    const student =await prisma.student.findFirst({ 
      where: { userId: userStudentId },
      include: {
        user:{
          include:{
            person:true
          }
        }
      }
    })
    const studentId = student.id;

    const tableT = (await  prisma.regionalCenter_Faculty_Career_User.findFirst({
      where:{
        userId:student.user.id
      },
      include:{
        regionalCenter_Faculty_Career:{
          include:{
            career: true
          }
        }
      }

    }))

    const career = tableT.regionalCenter_Faculty_Career.career

    // Obtener las inscripciones del estudiante
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      include: {
        section: {
          include: {
            class: true,
            academicPeriod: {
              include: {
                process: true,
              },
            },
          },
        },
      },
    });
    console.log(enrollments.length)
    if (enrollments.length === 0) {
      return res.status(400).json({ error: 'No se encontraron inscripciones para este estudiante' });
    }

    console.log('ssss')

    // Ruta del PDF original
    const pdfPath = path.resolve('assets/templatespdf/certificacion.pdf');

    // Crear el PDF modificado
    const pdf = new PDFCertificate(student.user, student.user.person, career);
    const pdfBytes = await pdf.generate(enrollments, pdfPath);

    // Verificación adicional: Asegúrate de que pdfBytes no esté vacío
    if (!pdfBytes || pdfBytes.length === 0) {
      throw new Error('El PDF generado está vacío.');
    }

    // Enviar el PDF como respuesta sin modificar el original en el servidor
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="certificado_clases.pdf"');
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Error al generar el certificado en PDF: ', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
