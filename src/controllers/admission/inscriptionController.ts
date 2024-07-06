import { getInscriptionDetailsByDni } from '../../services/admission/getinscriptionsService';

export const getInscriptionDetails = async (req, res) => {
  const { dni } = req.params;
  try {
    const person = await getInscriptionDetailsByDni(dni);
    if (!person) {
      return res.status(404).json({ error: 'No se encontro la persona por ese DNI' });
    }
    res.status(200).json(person);
  } catch (error) {
    res.status(500).json({ error: 'Error interno en el servidor' });
  }
};