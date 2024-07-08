const careerService = require('../../services/admission/careerService');

const getAllCareers = async (req, res) => {
  try {
    const careers = await careerService.getAllCareers();
    res.json(careers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllCareers,
};
