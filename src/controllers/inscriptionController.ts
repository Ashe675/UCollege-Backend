import { Request, Response } from 'express';
import InscriptionService from '../services/inscription/inscriptionService';
import InscriptionValidator from '../validators/inscription/InscriptionValidator';

export default class InscriptionController {
  private inscriptionService: InscriptionService;

  constructor() {
    this.inscriptionService = new InscriptionService();
  }

  async register(req: Request, res: Response) {
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
    const photoCertificate = req.file?.path;

    try {
      const person = await this.inscriptionService.createOrFindPerson({
        dni,
        firstName,
        middleName,
        lastName,
        secondLastName,
        phoneNumber,
        email,
      });

      
      
      let isEspecialTest = await InscriptionValidator.isEspecialTest(principalCareerId, secondaryCareerId);
      
      if(isEspecialTest){
        const validation = await InscriptionValidator.counterInscription(person.id);
        if (!validation.valid) {
          throw new Error(validation.message);
        }
      }
      const inscription = await this.inscriptionService.createInscription(person.id, parseInt(principalCareerId, 10), parseInt(secondaryCareerId, 10), photoCertificate);

      await this.inscriptionService.createResults(inscription.id, parseInt(principalCareerId, 10), parseInt(secondaryCareerId, 10));

      res.status(201).json("inscription");
    } catch (error) {
      console.error(error);
      if (error.message) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
}
