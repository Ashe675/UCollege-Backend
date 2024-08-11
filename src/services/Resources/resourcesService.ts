import cloudinary from '../../utils/cloudinary/resources';
import { prisma } from '../../config/db';
import { Readable } from 'stream';
import { ResourceType } from '@prisma/client';

export const uploadFileService = async (
  fileBuffer: Buffer,
  fileType: string,
  sectionId: number,
  fileName: string // Nombre descriptivo para la base de datos
) => {
  // Validar el tipo de archivo
  const allowedFileTypes = ['image/jpg', 'image/jpeg', 'image/png', 'video/mp4'];
  if (!allowedFileTypes.includes(fileType)) {
    throw new Error('Tipo de archivo no permitido. Solo se permiten JPG, PNG o MP4.');
  }

  // Validar el tamaño del archivo (1GB máximo para videos)
  const maxVideoSize = 1024 * 1024 * 1024; // 1GB en bytes
  if (fileType.startsWith('video/') && fileBuffer.length > maxVideoSize) {
    throw new Error('El tamaño del video excede el límite de 1GB.');
  }

  // Determinar el tipo de recurso usando el enum de Prisma
  let resourceType: ResourceType;
  if (fileType.startsWith('video/')) {
    resourceType = 'VIDEO';
  } else if (fileType.startsWith('image/')) {
    resourceType = 'PHOTO';
  } else {
    resourceType = 'DOCUMENT';
  }

  let uploadResult;
  try {
    if (resourceType === 'VIDEO') {
      // Crear una promesa para manejar el stream de subida
      uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'video',
            folder: 'your_folder', // Opcional: Especifica una carpeta en Cloudinary
          },
          (error, result) => {
            if (error) {
              return reject(new Error(`Error subiendo el video a Cloudinary: ${error.message}`));
            }
            resolve(result);
          }
        );
        // Convertir el buffer en un stream de lectura y enviarlo a Cloudinary
        const readableStream = new Readable();
        readableStream.push(fileBuffer);
        readableStream.push(null);
        readableStream.pipe(uploadStream);
      });
    } else {
      // Subir imágenes como antes
      uploadResult = await cloudinary.uploader.upload(`data:${fileType};base64,${fileBuffer.toString('base64')}`, {
        resource_type: 'image',
        folder: 'your_folder', // Opcional: Especifica una carpeta en Cloudinary
      });
    }
  } catch (error) {
    console.error('Error detallado:', error);
    throw new Error(`Error subiendo a Cloudinary: ${error.message || 'Error no especificado'}`);
  }

  const fileUrl = uploadResult.secure_url || '';
  const publicId = uploadResult.public_id || '';

  // Si la subida falla y no se obtiene una URL o un publicId, evitar crear un recurso en la base de datos
  if (!fileUrl || !publicId) {
    throw new Error('La subida a Cloudinary falló, no se obtuvo un URL o publicId válido.');
  }

  // Guardar en la base de datos usando Prisma
  const resource = await prisma.resource.create({
    data: {
      url: fileUrl,
      publicId: publicId,
      name: fileName,
      type: resourceType,
      sectionId: sectionId,
    },
  });

  return resource;
};

export const deleteFileService = async (resourceId: number) => {
  // Buscar el archivo en la base de datos
  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
  });

  if (!resource) {
    throw new Error('Recurso no encontrado en la base de datos');
  }

  // Eliminar el archivo de Cloudinary
  await new Promise<void>((resolve, reject) => {
    cloudinary.uploader.destroy(resource.publicId, (error) => {
      if (error) {
        return reject(new Error(`Error eliminando de Cloudinary: ${error.message}`));
      }
      resolve();
    });
  });

  // Eliminar el registro de la base de datos
  await prisma.resource.delete({
    where: { id: resourceId },
  });
};


