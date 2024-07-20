import cron from 'node-cron'
import { prisma } from '../../config/db';

const deleteExpiredTokens = async () => {
  const now = new Date();
  try {
    await prisma.userToken.deleteMany({
      where: {
        expiresAt: {
          lt: now
        }
      }
    });
  } catch (error) {
    console.error('Error deleting expired tokens:', error);
  }
};

// programando la tarea para que se elimine un token cada minuto
export const startCronJobs = () => {
    cron.schedule('* * * * *', deleteExpiredTokens);
    console.log('Cron job scheduled: delete expired tokens every minute');
  };