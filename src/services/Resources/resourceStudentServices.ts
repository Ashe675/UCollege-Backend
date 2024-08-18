import cloudinary from '../../utils/cloudinary/resources';
import { prisma } from '../../config/db';
import fs from 'fs';
import { promisify } from 'util';
import { ResourceType } from '@prisma/client';

const unlink = promisify(fs.unlink);

export const uploadImageStudentService = async (
    filePath: string,
    fileType: string,
    userId: number,
    avatar: boolean
  ) => {
    // Validar el tipo de archivo
    const allowedFileTypes = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp'];
  
    if (!allowedFileTypes.includes(fileType)) {
      throw new Error('Tipo de archivo no permitido. Solo se permiten JPG, PNG y WEBP.');
    }
  
    let resourceType: ResourceType = 'PHOTO';
  
    try {
      // Transformación para foto de perfil (cuadrada)
      const transformation = [{ width: 600, height: 600, crop: 'fill' }];
  
      // Subir la imagen a Cloudinary
      const uploadResult = await cloudinary.uploader.upload(filePath, {
        resource_type: 'image',
        folder: 'STUDENT_PROFILE_PICS',
        transformation: transformation,
      });
  
      const fileUrl = uploadResult.secure_url || '';
      const publicId = uploadResult.public_id || '';
  
      if (!fileUrl || !publicId) {
        throw new Error('La subida a Cloudinary falló, no se obtuvo un URL o publicId válido.');
      }
  
      // Guardar la información en la base de datos
      const resource = await prisma.image.create({
        data: {
          url: fileUrl,
          publicId: publicId,
          avatar: avatar, // Cambia esto si es necesario
          userId: userId,
        },
      });
  
      return resource;
    } catch (error) {
      throw new Error(`Error durante la subida de la imagen: ${error.message}`);
    }
};

export const deleteImageStudentService = async (imageId: number, userId: number) => {
    try {
      // Buscar la imagen en la base de datos
      const image = await prisma.image.findUnique({
        where: {
          idImage:imageId
        }
      });
  
      // Verificar que la imagen exista y que pertenezca al usuario
      if (!image || image.userId !== userId) {
        throw new Error('Imagen no encontrada o no pertenece al estudiante');
      }
  
      // Eliminar la imagen de Cloudinary
      const result = await cloudinary.uploader.destroy(image.publicId);
      if (result.result !== 'ok') {
        throw new Error('No se pudo eliminar la imagen de Cloudinary');
      }
  
      // Eliminar la imagen de la base de datos
      await prisma.image.delete({
        where: {
            idImage: imageId
        }
      });
  
      return true;
    } catch (error) {
      throw new Error(`Error durante la eliminación de la imagen: ${error.message}`);
    }
  };

  export const deleteAvatarStudentService = async ( userId: number) => {
    try {
      // Buscar la imagen en la base de datos
      const image = await prisma.image.findFirst({
        where: {
          avatar: true
        }
      });
  
      // Verificar que la imagen exista y que pertenezca al usuario
      if (!image || image.userId !== userId) {
        throw new Error('Imagen no encontrada o no pertenece al estudiante');
      }
  
      // Eliminar la imagen de Cloudinary
      const result = await cloudinary.uploader.destroy(image.publicId);
      if (result.result !== 'ok') {
        throw new Error('No se pudo eliminar la imagen de Cloudinary');
      }
  
      // Eliminar la imagen de la base de datos
      await prisma.image.delete({
        where: {
            idImage: image.idImage
        }
      });
  
      return true;
    } catch (error) {
      throw new Error(`Error durante la eliminación de la imagen: ${error.message}`);
    }
};
