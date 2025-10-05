import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { userService } from './userService';
import prisma from './prisma';

interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check for API key in header
  const apiKey = req.headers['x-api-key'];
  
  if (apiKey && typeof apiKey === 'string') {
    try {
      const user = await userService.getUserByApiKey(apiKey);
      if (user) {
        req.user = user;
        return next();
      }
    } catch (error) {
      console.error('Error verifying API key:', error);
    }
  }

  // Check for JWT token in authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev';
    const decoded = jwt.verify(token, secret) as { userId: string; email: string };
    
    // Verify the user still exists in the database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token - user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};