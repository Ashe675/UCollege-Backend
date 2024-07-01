import express from 'express';
import resultRoutes from './routes/resultRoutes';
import personRoutes from './routes/personRoutes';
import admissionRoutes from './routes/admissionRoutes';
import careerRoutes from './routes/careerRoutes';

const app = express();
const port = 3000;

app.use(express.json());
app.use('/results', resultRoutes);
app.use('/api', personRoutes);
app.use('/api', admissionRoutes);
app.use('/api', careerRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

