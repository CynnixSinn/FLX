import { Request, Response } from 'express';
import { userService } from '../services/userService';
import { workflowService } from '../services/workflowService';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

interface AuthRequest extends Request {
  user?: any;
}

// Generate JWT token
const generateToken = (user: any) => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev';
  return jwt.sign(
    { userId: user.id, email: user.email },
    secret,
    { expiresIn: '24h' }
  );
};

// Generate refresh token
const generateRefreshToken = (user: any) => {
  const secret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_for_dev';
  return jwt.sign(
    { userId: user.id },
    secret,
    { expiresIn: '7d' }
  );
};

export const authController = {
  // Register new user
  register: async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;
      
      // Check if user already exists
      const existingUser = await userService.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'User with this email already exists' });
      }
      
      // Create new user
      const user = await userService.createUser({
        email,
        password,
        name,
      });
      
      // Generate tokens
      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);
      
      // Don't send password in response
      const { passwordHash, ...userWithoutPassword } = user;
      
      res.status(201).json({
        message: 'User registered successfully',
        user: userWithoutPassword,
        token,
        refreshToken,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Login user
  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      // Find user by email
      const user = await userService.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      // Validate password
      const isPasswordValid = await userService.validateUserPassword(user, password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      // Generate tokens
      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);
      
      // Don't send password in response
      const { passwordHash, ...userWithoutPassword } = user;
      
      res.json({
        message: 'Login successful',
        user: userWithoutPassword,
        token,
        refreshToken,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Refresh token
  refreshToken: async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token required' });
      }
      
      const secret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_for_dev';
      let decoded: any;
      
      try {
        decoded = jwt.verify(refreshToken, secret);
      } catch (error) {
        return res.status(403).json({ error: 'Invalid refresh token' });
      }
      
      // Find user by ID
      const user = await userService.getUserById(decoded.userId);
      if (!user) {
        return res.status(403).json({ error: 'User not found' });
      }
      
      // Generate new tokens
      const token = generateToken(user);
      const newRefreshToken = generateRefreshToken(user);
      
      // Don't send password in response
      const { passwordHash, ...userWithoutPassword } = user;
      
      res.json({
        message: 'Tokens refreshed successfully',
        user: userWithoutPassword,
        token,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get user profile
  getProfile: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // Don't send password in response
      const { passwordHash, ...userWithoutPassword } = req.user;
      
      res.json({
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Update user profile
  updateProfile: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { name, email } = req.body;
      
      // Check if email is being changed to an already existing email
      if (email && email !== req.user.email) {
        const existingUser = await userService.getUserByEmail(email);
        if (existingUser && existingUser.id !== req.user.id) {
          return res.status(409).json({ error: 'Email already in use by another user' });
        }
      }
      
      const updatedUser = await userService.updateUser(req.user.id, { name, email });
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Don't send password in response
      const { passwordHash, ...userWithoutPassword } = updatedUser;
      
      res.json({
        message: 'Profile updated successfully',
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};