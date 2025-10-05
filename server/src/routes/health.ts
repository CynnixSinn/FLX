import express, { Request, Response } from 'express';
import prisma from '../services/prisma';

const router = express.Router();

// Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // In a real implementation, you might check other services like Redis
    // const redisStatus = await checkRedisConnection();
    
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      services: {
        database: 'OK',
        // redis: redisStatus ? 'OK' : 'ERROR'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      services: {
        database: 'ERROR',
      },
      error: (error as Error).message
    });
  }
});

export default router;