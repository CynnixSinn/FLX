import prisma from './prisma';
import { Execution, ExecutionLog } from '@prisma/client';

interface CreateExecutionData {
  workflowId: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'ERROR';
  input?: any;
}

interface CreateExecutionLogData {
  executionId: string;
  nodeId: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'ERROR';
  input?: any;
  output?: any;
  error?: string;
}

export const executionService = {
  // Create a new execution
  createExecution: async (data: CreateExecutionData): Promise<Execution> => {
    return await prisma.execution.create({
      data: {
        workflowId: data.workflowId,
        status: data.status,
        input: data.input || {},
      },
    });
  },

  // Update an execution
  updateExecution: async (id: string, status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'ERROR', completedAt?: Date, error?: string): Promise<Execution> => {
    return await prisma.execution.update({
      where: { id },
      data: {
        status,
        completedAt,
        error,
      },
    });
  },

  // Get execution by ID
  getExecutionById: async (id: string): Promise<Execution | null> => {
    return await prisma.execution.findUnique({
      where: { id },
    });
  },

  // Get all executions for a workflow
  getExecutionsByWorkflowId: async (workflowId: string): Promise<Execution[]> => {
    return await prisma.execution.findMany({
      where: { workflowId },
      orderBy: { startedAt: 'desc' },
    });
  },

  // Create an execution log
  createExecutionLog: async (data: CreateExecutionLogData): Promise<ExecutionLog> => {
    return await prisma.executionLog.create({
      data: {
        executionId: data.executionId,
        nodeId: data.nodeId,
        status: data.status,
        input: data.input,
        output: data.output,
        error: data.error,
      },
    });
  },

  // Get all logs for an execution
  getExecutionLogs: async (executionId: string): Promise<ExecutionLog[]> => {
    return await prisma.executionLog.findMany({
      where: { executionId },
      orderBy: { timestamp: 'asc' },
    });
  },
};