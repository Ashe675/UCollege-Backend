import { prisma } from "../../config/db";
import { NextFunction, Request, Response } from 'express';

export const validateFrontSection = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const frontSection = req.query.frontSection?.toString().toLowerCase() === 'true';
    const file = req.file;
    // Suponiendo que `file` es parte de `req` y que el tipo de archivo es accesible a través de `file.mimetype`
    // Asegúrate de que `file` esté disponible en `req.file` si usas multer o en otro lugar si usas otro middleware
    const fileType = req.file?.mimetype;
    console.log(fileType);
    console.log(id);
    // Validar solo si el tipo de archivo es 'PHOTO' y frontSection es true
    if (fileType?.startsWith('image/') && frontSection) {
      const existingFrontSection = await prisma.resource.findFirst({
        where: {
          sectionId: Number(id),
          frontSection: true,
          type: 'PHOTO', // Asegúrate de que sea tipo PHOTO
        },
      });
  
      if (existingFrontSection) {
        return res.status(400).json({
          error: 'La sección ya tiene un recurso asignado como foto de portada. Debe eliminarla primero.',
        });
      }
    }
  
    next();
  };
