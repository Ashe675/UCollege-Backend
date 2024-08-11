import cloudinary from '../../utils/cloudinary/resources';
import { prisma } from '../../config/db';
import fs from 'fs';
import { promisify } from 'util';
import { ResourceType } from '@prisma/client';
const unlink = promisify(fs.unlink);

export const uploadFileService = async (
  filePath: string,
  fileType: string,
  sectionId: number,
  fileName: string // Nombre descriptivo para la base de datos
) => {
  // Validar el tipo de archivo
  const allowedFileTypes = ['image/jpg', 'image/jpeg', 'image/png', 'video/mp4'];
  if (!allowedFileTypes.includes(fileType)) {
    throw new Error('Tipo de archivo no permitido. Solo se permiten JPG, PNG o MP4.');
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
        cloudinary.uploader.upload_large(filePath,
          {
            resource_type: 'video',
            folder: 'SECTION_RESOURCES', // Opcional: Especifica una carpeta en Cloudinary
          },
          (error, result) => {
            if (error) {
              reject(error)
            }
            resolve(result);
          }
        )
        // Convertir el buffer en un stream de lectura y enviarlo a Cloudinary
        // const readableStream = new Readable();
        // readableStream.push(fileBuffer);
        // readableStream.push(null);
        // readableStream.pipe(uploadStream);
      });
    } else {

      // Subir imágenes usando upload normal
      uploadResult = await cloudinary.uploader.upload(filePath, {
        resource_type: 'image',
        folder: 'SECTION_RESOURCES',
      });
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

  } finally {
    // Eliminar el archivo temporal después de la subida
    await unlink(filePath);
  }
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


