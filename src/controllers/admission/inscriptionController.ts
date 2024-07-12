
import { Request, Response } from 'express';
import InscriptionService from '../../services/inscription/inscriptionService';
import InscriptionValidator from '../../validators/admission/InscriptionValidator';
import deleteImage from '../../utils/admission/fileHandler';
import { getInscriptionDetailsByDni } from '../../services/admission/getinscriptionsService';


/**
 * Controlador para manejar las inscripciones.
 * 
 * La clase `InscriptionController` se encarga de gestionar las operaciones relacionadas con las inscripciones.
 * 
 * Propiedades:
 * - `inscriptionService`: Instancia del servicio de inscripciones que maneja la lógica de negocio.
 * 
 * Métodos:
 * - `constructor()`: Inicializa una nueva instancia de `InscriptionService`.
 * - `register(req: Request, res: Response)`: Método asincrónico que maneja la lógica para registrar una nueva inscripción.
 * 
 * Funcionalidad del método `register`:
 * 1. Extrae los datos de la persona y las carreras del cuerpo de la solicitud (`req.body`).
 * 2. Obtiene la ruta del certificado de foto del archivo cargado (`req.file?.path`).
 * 3. Intenta crear o encontrar una persona en la base de datos usando `inscriptionService.createOrFindPerson`.
 * 4. Valida las inscripciones de la persona usando `InscriptionValidator.counterInscription`.
 *    - Si la validación falla, lanza un error con el mensaje correspondiente.
 * 5. Crea una nueva inscripción en la base de datos usando `inscriptionService.createInscription`.
 * 6. Crea los resultados de la inscripción usando `inscriptionService.createResults`.
 * 7. Responde con un estado 201 (Created) y la inscripción creada en formato JSON.
 * 8. Maneja los errores y responde con el estado y mensaje de error apropiados.
 */
export default class InscriptionController {
  private inscriptionService: InscriptionService;

  constructor() {
    this.inscriptionService = new InscriptionService();
  }

  /**
   * Maneja el registro de inscripciones.
   * @param req - Objeto de solicitud HTTP (Request).
   * @param res - Objeto de respuesta HTTP (Response).
   * @returns Una respuesta JSON con el resultado de la inscripción o un mensaje de error.
   */
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
      processId,
      regionalCenterId,
    } = req.body;
    const photoCertificate = req.file.path;

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

      const inscriptionProcess = await this.inscriptionService.validateProcessIdUnique(person.id, processId);
      if (inscriptionProcess) {
        throw new Error('¡No se puede inscribir en este proceso de inscripción por que ya se encuentra inscrito!');
      }
      
      const validation = await InscriptionValidator.counterInscription(person.id);
      if (!validation.valid) {
        throw new Error(validation.message);
      }
      
      
      const inscription = await this.inscriptionService.createInscription(
        person.id, 
        parseInt(principalCareerId, 10), 
        parseInt(secondaryCareerId, 10), 
        processId ,
        regionalCenterId,
        photoCertificate);

      await this.inscriptionService.createResults(inscription.id, parseInt(principalCareerId, 10), parseInt(secondaryCareerId, 10), processId);

      res.status(201).send("¡Felicidades! Se ha inscrito con éxito");
    } catch (error) {
      if (error.message) {
        
        //Eliminamos la imagen del servidor
        deleteImage(photoCertificate);
        
        res.status(400).json({ error: error.message });
      } else {
        
        //Eliminamos la imagen del servidor
        deleteImage(photoCertificate);
        res.status(500).json({ error: 'Internal server error' });
      }
    }

  }

  async getAproveCSV(req: Request, res: Response){
    const processResultId = req.processResult.id 
    try {
      const csv = await InscriptionService.getApprovedCSVService(processResultId);
      
      // Configuración de la respuesta para retornar el archivo CSV
      res.header('Content-Type', 'text/csv');
      res.attachment('approved_candidates.csv');
      res.send(csv);
    } catch (error) {
      if (error.message === 'Ningún estudiante aprobó las pruebas.') {
        res.status(404).json({ error: 'Ningún estudiante aprobó las pruebas.' });
      } else {
        console.error(error);
        res.status(500).json({ error: 'Ocurrió un error al obtener los candidatos aprobados' });
      }
    }
  
  }


  
}

export const getInscriptionDetails = async (req: Request, res: Response) => {
  const { dni } = req.params;
  const processInscriptionId = req.processInscription.id
  try {
    const details = await getInscriptionDetailsByDni(dni, processInscriptionId);
    res.json(details);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};