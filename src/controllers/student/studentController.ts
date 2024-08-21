import { prisma } from "../../config/db"
import { Request, Response } from "express"
import { getStudentGradeInfo } from "../../services/student/getGradeInfo";
import { deleteAvatarStudentService, deleteImageStudentService, uploadImageStudentService } from "../../services/Resources/resourceStudentServices";
import { error } from "console";

export const getGradeStudent = async (req: Request, res: Response) => {
    const { id: userStudentId } = req.user;
    const sectionId = parseInt(req.params.sectionId);
    

    try {
        // Devolver la respuesta con la información
        const result = await getStudentGradeInfo( sectionId, userStudentId)
        return res.status(200).json(result);

    } catch (error) {
        console.error("Error al obtener la nota del estudiante: ", error);

        return res.status(500).json({
            error: "Error interno del servidor",
            detalles: error.message
        });
    }
};



export const getAllGradeStudent = async (req: Request, res: Response) => {
    const { id: userStudentId } = req.user;

    try {

        const studentId = (await prisma.student.findFirst({
            where:{userId: userStudentId}
        })).id

        // Obtener todas las inscripciones del estudiante (enrollments)
        const enrollments = await prisma.enrollment.findMany({
            where: { studentId: studentId,
              active : true,
                section:{
                    academicPeriod:{
                        process:{
                            active:true
                        }
                    }
                }
             },
            select: { sectionId: true }
        });

        if (enrollments.length === 0) {
            return res.status(404).json({
                error: "No se encontraron inscripciones para el estudiante en este periodo academico"
            });
        }

        // console.log(enrollments)

        // Recorrer todas las inscripciones y obtener la información de cada una
        const gradesInfo = await Promise.all(
            enrollments.map(async (enrollment) => {
                try {
                    return await getStudentGradeInfo(enrollment.sectionId, userStudentId);
                } catch (error) {
                    console.error(`Error al obtener notas para la sección ${enrollment.sectionId}: ${error.message}`);
                    return null; // O manejar de alguna otra forma
                }
            })
        );

        // Filtrar posibles valores null
        const validGradesInfo = gradesInfo.filter(info => info !== null);

        // Devolver todas las notas
        return res.status(200).json(validGradesInfo);

    } catch (error) {
        console.error("Error al obtener todas las notas del estudiante: ", error);

        return res.status(500).json({
            error: "Error interno del servidor",
            detalles: error.message
        });
    }
};



import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const unlink = promisify(fs.unlink);

export const uploadImageStudent = async (req: Request, res: Response) => {
    const { id: userStudentId } = req.user;
    const file = req.file; // Multer manejará la subida del archivo
    const avatar = req.body.avatar === 'true'; // Convertir el valor de avatar a booleano
  
    if (!file) {
      return res.status(400).json({ error: "No se proporcionó ningún archivo" });
    }
  
    try {
      // Validar que el estudiante tenga menos de 3 imágenes
      const images = await prisma.image.findMany({
        where: {
          userId: userStudentId,
        },
      });
  
      // Verificar si ya existe una imagen avatar
      if (avatar) {
        const existingAvatar = images.find(image => image.avatar);
        if (existingAvatar) {
          // Eliminar el archivo subido si ya tiene avatar
          await unlink(file.path);
          return res.status(400).json({
            error: "Ya tiene una imagen de perfil, no se puede agregar otra.",
          });
        }
      }
      
      const imagesNotAvatar = await prisma.image.findMany({
        where: {
          userId: userStudentId,
          avatar : false
        },
      });

      if (!avatar && imagesNotAvatar.length >= 3) {
        // Eliminar el archivo si se excede el límite de imágenes
        await unlink(file.path);
        return res.status(400).json({
          error: "Ya tiene 3 imágenes, favor eliminar una para subir una nueva.",
        });
      }
  
      // Obtener tipo de archivo y ruta del archivo cargado
      const fileType = file.mimetype;
      const filePath = path.resolve(file.path); // Ruta completa del archivo en el servidor
  
      // Subir la imagen a Cloudinary usando el servicio
      const resultImageUpload = await uploadImageStudentService(filePath, fileType, userStudentId, avatar);
  
      // Eliminar el archivo temporal después de subirlo a Cloudinary
      await unlink(filePath);
  
      return res.status(200).json({
        message: `Imagen subida con éxito`,
        data: resultImageUpload,
      });
    } catch (error) {
      console.error(error);
  
      // Eliminar el archivo temporal en caso de error
      if (file) {
        await unlink(file.path);
      }
  
      return res.status(500).json({
        error: `Error al subir la imagen: ${error.message}`,
      });
    }
};

export const deleteImageStudent = async (req: Request, res: Response) => {
    const { id: userStudentId } = req.user;
    const imageId = parseInt(req.params.imageId);

    try {
        // Eliminar la imagen
        const result = await deleteImageStudentService(imageId, userStudentId);

        if (result) {
        return res.status(200).json({
            message: 'Imagen eliminada con éxito'
        });
        } else {
        return res.status(404).json({
            error: 'Imagen no encontrada o no pertenece al estudiante'
        });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
        error: `Error al eliminar la imagen: ${error.message}`
        });
    }
};

export const deleteAvatarStudent = async (req: Request, res: Response) => {
    const { id: userStudentId } = req.user;
    const imageId = parseInt(req.params.imageId);

    try {
        // Eliminar la imagen
        const result = await deleteAvatarStudentService(userStudentId);

        if (result) {
        return res.status(200).json({
            message: 'Imagen eliminada con éxito'
        });
        } else {
        return res.status(404).json({
            error: 'Imagen no encontrada o no pertenece al estudiante'
        });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
        error: `Error al eliminar la imagen: ${error.message}`
        });
    }
};



export const getStudentImages = async (req: Request, res: Response) => {
    const { id: userStudentId } = req.user;
  
    try {
      // Obtener todas las imágenes del estudiante desde la base de datos
      const images = await prisma.image.findMany({
        where: {
          userId: userStudentId,
        },
        select: {
          idImage: true,
          url: true,
          publicId: true,
          avatar: true,
          createdAt: true,
        },
      });
  
      if (images.length === 0) {
        return res.status(404).json({ message: 'No se encontraron imágenes para este estudiante.' });
      }
  
      return res.status(200).json({ images });
    } catch (error) {
      console.error('Error al obtener las imágenes del estudiante:', error);
      return res.status(500).json({ error: 'Error al obtener las imágenes del estudiante.' });
    }
  };