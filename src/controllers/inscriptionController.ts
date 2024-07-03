import { Request, Response } from 'express';
import { prisma } from '../config/db';
import InscriptionValidator from '../validators/InscriptionValidator';
import { validateInscription } from '../middleware/validateInscription';

export default class InscriptionController {
  async register(req: Request, res: Response) {
    // Extraer datos del cuerpo de la petición
    const {
      dni,
      firstName,
      middleName,
      lastName,
      secondLastName,
      phoneNumber,
      email,
      principalCareerId,
      secondaryCareerId,
    } = req.body;
    const photoCertificate = req.file?.path; // Ruta de la imagen cargada

    try {
      // Crear o encontrar persona
      let person = await prisma.person.findUnique({
        where: { dni },
      });
      console.log(!person);

      if (!person) {
        person = await prisma.person.create({
          data: {
            dni,
            firstName,
            middleName,
            lastName,
            secondLastName,
            phoneNumber,
            email,
          },
        });
      }
      //return res.status(201).json(person);

      const personId = person.id;

      // Validar No. de inscripciones
      const validateSpecialTest = await InscriptionValidator.isEspecialTest(principalCareerId, secondaryCareerId);
      if (validateSpecialTest) {
        const validation = await InscriptionValidator.counterInscription(personId);
        if (!validation.valid) {
          return res.status(400).json({ error: validation.message });
        }
      }

      // Validar que la carrera primaria no sea la misma que la secundaria
      if (principalCareerId == secondaryCareerId) {
        return res.status(400).json({ error: "Las carreras primaria y secundaria son iguales" });
      }

      // Crear inscripción
      validateInscription
      const inscription = await prisma.inscription.create({
        data: {
          principalCareerId: parseInt(principalCareerId, 10),
          secondaryCareerId: parseInt(secondaryCareerId, 10),
          photoCertificate: photoCertificate || '',
          personId: personId,
        },
      });

      // Obtener las pruebas de admisión asociadas a las carreras
      const admissionTests = await prisma.admissionTest_Career.findMany({
        where: {
          OR: [
            { careerId: parseInt(principalCareerId, 10) },
            { careerId: parseInt(secondaryCareerId, 10) },
          ],
        },
        include: {
          admissionTest: true,
        },
      });

      // Crear resultados asociados
      for (const test of admissionTests) {
        try {
          await prisma.result.create({
            data: {
              inscriptionId: inscription.id,
              admissionTestId: test.admissionTestId,
            },
          });
        } catch (error) {
          if (error.code === 'P2002') {
            console.log(`Duplicate entry for inscriptionId: ${inscription.id} and admissionTestId: ${test.admissionTestId}`);
          } else {
            throw error;
          }
        }
      }

      res.status(201).json(inscription);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
