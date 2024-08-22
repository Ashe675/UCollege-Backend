import cloudinary from '../../utils/cloudinary/resources';
import { prisma } from '../../config/db';
import fs from 'fs';
import { promisify } from 'util';
import { ResourceType } from '@prisma/client';
const unlink = promisify(fs.unlink);

export const uploadFileService = async ({ filePath, fileType, fileName, frontSection, sectionId, isMessage }:
  {
    filePath: string,
    fileType: string,
    fileName: string, // Nombre descriptivo para la base de datos
    frontSection?: boolean, // Parámetro opcional para indicar si es frontSection
    sectionId?: number,
    isMessage?: boolean
  }
) => {
  // Validar el tipo de archivo
  const allowedFileTypes = [
    'image/jpg', 'image/jpeg', 'image/png', 'image/webp',
    'video/mp4', 'video/mkv', 'video/webm', // Añade otros formatos de video permitidos
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // Permitir PDF, DOC y DOCX
    , "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];

  if (!allowedFileTypes.includes(fileType)) {
    throw new Error('Tipo de archivo no permitido. Solo se permiten JPG, PNG, MP4, MKV, WEBM, PDF, DOC y DOCX.');
  }

  // Determinar el tipo de recurso usando el enum de Prisma
  let resourceType: ResourceType;
  if (fileType.startsWith('video/')) {
    resourceType = 'VIDEO';
  } else if (fileType.startsWith('image/')) {
    resourceType = 'PHOTO';
  } else if (fileType.startsWith('application/')) {
    resourceType = 'DOCUMENT';
  } else {
    throw new Error('Tipo de archivo no reconocido.');
  }

  let uploadResult;

  if (resourceType === 'VIDEO') {
    uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_large(filePath,
        {
          resource_type: 'video',
          folder: isMessage ? 'messages_files' : 'SECTION_RESOURCES',
        },
        (error, result) => {
          if (error) {
            reject(error);
          }
          resolve(result);
        }
      );
    });
  } else if (resourceType === 'PHOTO') {
    // Transformación para ajustar la imagen si es una foto de portada
    const transformation = frontSection
      ? [{ width: 1200, height: 800, crop: 'fill' }] // Ajusta a las dimensiones requeridas
      : [];

    uploadResult = await cloudinary.uploader.upload(filePath, {
      resource_type: 'image',
      folder: isMessage ? 'messages_files' : 'SECTION_RESOURCES',
      transformation: transformation
    });
  } else if (resourceType === 'DOCUMENT') {
    uploadResult = await cloudinary.uploader.upload(filePath, {
      resource_type: 'raw',
      folder: isMessage ? 'messages_files' : 'SECTION_RESOURCES',
    });
  } else {
    throw new Error('Tipo de recurso no soportado.');
  }

  const fileUrl = uploadResult.secure_url || '';
  const publicId = uploadResult.public_id || '';

  if (!fileUrl || !publicId) {
    throw new Error('La subida a Cloudinary falló, no se obtuvo un URL o publicId válido.');
  }

  if (isMessage) {
    await unlink(filePath);
    return { fileUrl , publicId, resourceType }
  }

  // Guardar en la base de datos usando Prisma
  const resource = await prisma.resource.create({
    data: {
      url: fileUrl,
      publicId: publicId,
      name: fileName,
      type: resourceType,
      sectionId: sectionId,
      frontSection: frontSection && resourceType === 'PHOTO' ? true : false, // Solo establecer frontSection si es una foto
    },
  });

  await unlink(filePath);

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

  let resourceType: 'image' | 'video' | 'raw';

  switch (resource.type) {
    case 'PHOTO':
      resourceType = 'image';
      break;
    case 'VIDEO':
      resourceType = 'video';
      break;
    case 'DOCUMENT':
      resourceType = 'raw';
      break;
    default:
      throw new Error('Tipo de recurso no soportado');
  };


  // Eliminar el archivo de Cloudinary
  await new Promise<void>((resolve, reject) => {
    cloudinary.uploader.destroy(resource.publicId, { resource_type: resourceType }, (error) => {
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


