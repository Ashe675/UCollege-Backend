import { Request, Response, NextFunction } from 'express';

// Middleware para validar que lo que se sube sea una imagen
export const validateImageFile = (req: Request, res: Response, next: NextFunction) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      error: "No se ha proporcionado ningún archivo.",
    });
  }

  // Tipos de archivos permitidos
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  // Verificar si el archivo tiene un tipo MIME permitido
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return res.status(400).json({
      error: "Solo se permiten archivos de imagen en formato JPG, JPEG, PNG o WEBP.",
    });
  }

  // Si todo está bien, continuar con el siguiente middleware/controlador
  next();
};
