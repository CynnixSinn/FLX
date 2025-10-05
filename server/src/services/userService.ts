import prisma from './prisma';
import { User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

interface CreateUserInput {
  email: string;
  password: string;
  name?: string;
}

interface UpdateUserInput {
  name?: string;
  email?: string;
}

export const userService = {
  // Create a new user
  createUser: async (data: CreateUserInput): Promise<User> => {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    return await prisma.user.create({
      data: {
        id: uuidv4(),
        email: data.email,
        passwordHash: hashedPassword,
        name: data.name,
        apiKey: `flx_${uuidv4().replace(/-/g, '')}`,
      },
    });
  },

  // Get user by email
  getUserByEmail: async (email: string): Promise<User | null> => {
    return await prisma.user.findUnique({
      where: { email },
    });
  },

  // Get user by ID
  getUserById: async (id: string): Promise<User | null> => {
    return await prisma.user.findUnique({
      where: { id },
    });
  },

  // Get user by API key
  getUserByApiKey: async (apiKey: string): Promise<User | null> => {
    return await prisma.user.findUnique({
      where: { apiKey },
    });
  },

  // Update user
  updateUser: async (id: string, data: UpdateUserInput): Promise<User | null> => {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return null;
    }

    return await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
      },
    });
  },

  // Delete user
  deleteUser: async (id: string): Promise<User | null> => {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return null;
    }

    return await prisma.user.delete({
      where: { id },
    });
  },

  // Validate user password
  validateUserPassword: async (user: User, password: string): Promise<boolean> => {
    return await bcrypt.compare(password, user.passwordHash);
  },
};