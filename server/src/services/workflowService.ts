import prisma from './prisma';
import { Workflow, User, Execution } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

interface CreateWorkflowData {
  name: string;
  description?: string;
  nodes: any[];
  connections: any[];
  userId: string;
}

interface UpdateWorkflowData {
  name?: string;
  description?: string;
  nodes?: any[];
  connections?: any[];
  status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
}

export const workflowService = {
  // Get all workflows for a user
  getAllWorkflows: async (userId: string): Promise<Workflow[]> => {
    return await prisma.workflow.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  // Get a specific workflow by ID
  getWorkflowById: async (id: string, userId: string): Promise<Workflow | null> => {
    return await prisma.workflow.findFirst({
      where: { id, userId },
    });
  },

  // Create a new workflow
  createWorkflow: async (data: CreateWorkflowData): Promise<Workflow> => {
    return await prisma.workflow.create({
      data: {
        id: uuidv4(),
        name: data.name,
        description: data.description,
        nodes: data.nodes,
        connections: data.connections,
        userId: data.userId,
        status: 'DRAFT',
      },
    });
  },

  // Update a workflow
  updateWorkflow: async (id: string, userId: string, data: UpdateWorkflowData): Promise<Workflow | null> => {
    const workflow = await prisma.workflow.findFirst({
      where: { id, userId },
    });

    if (!workflow) {
      return null;
    }

    return await prisma.workflow.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        nodes: data.nodes,
        connections: data.connections,
        status: data.status,
      },
    });
  },

  // Delete a workflow
  deleteWorkflow: async (id: string, userId: string): Promise<Workflow | null> => {
    const workflow = await prisma.workflow.findFirst({
      where: { id, userId },
    });

    if (!workflow) {
      return null;
    }

    return await prisma.workflow.delete({
      where: { id },
    });
  },

  // Execute a workflow
  executeWorkflow: async (id: string, userId: string, input?: any): Promise<Execution> => {
    const workflow = await prisma.workflow.findFirst({
      where: { id, userId, status: 'ACTIVE' },
    });

    if (!workflow) {
      throw new Error('Workflow not found or not active');
    }

    // Create execution record
    const execution = await prisma.execution.create({
      data: {
        id: uuidv4(),
        workflowId: id,
        status: 'RUNNING',
        input: input || {},
      },
    });

    return execution;
  },
};