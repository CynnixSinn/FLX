import { Server as SocketIOServer, Socket } from 'socket.io';
import { executionService } from '../services/executionService';
import { ExecutionStatus } from '@prisma/client';

// Interface for the server to include our Socket.IO instance
interface ServerWithIO {
  io?: SocketIOServer;
}

export const setupSocketIO = (server: any) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`User ${socket.id} connected`);

    // Handle join workflow room
    socket.on('joinWorkflow', (workflowId: string) => {
      socket.join(workflowId);
      console.log(`User ${socket.id} joined workflow room: ${workflowId}`);
    });

    // Handle join execution room
    socket.on('joinExecution', (executionId: string) => {
      socket.join(executionId);
      console.log(`User ${socket.id} joined execution room: ${executionId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.id} disconnected`);
    });
  });

  // Add io to the server instance
  (server as ServerWithIO).io = io;

  return io;
};

// Function to emit execution updates
export const emitExecutionUpdate = async (executionId: string, status: ExecutionStatus, output?: any, error?: string) => {
  // In a real application, you would have access to the server instance
  // For now, we'll just log the update
  console.log(`Execution update: ${executionId}, status: ${status}, output:`, output, 'error:', error);
  
  // In a real implementation, you would emit to the execution room
  // server.io?.to(executionId).emit('executionUpdate', { executionId, status, output, error });
};

// Function to emit execution log updates
export const emitExecutionLog = async (executionId: string, nodeId: string, status: ExecutionStatus, input?: any, output?: any, error?: string) => {
  console.log(`Execution log: ${executionId}, node: ${nodeId}, status: ${status}`);
  
  // In a real implementation, you would emit to the execution room
  // server.io?.to(executionId).emit('executionLog', { executionId, nodeId, status, input, output, error });
};

// Function to emit workflow status changes
export const emitWorkflowStatusChange = (workflowId: string, status: 'DRAFT' | 'ACTIVE' | 'INACTIVE') => {
  console.log(`Workflow status change: ${workflowId}, status: ${status}`);
  
  // In a real implementation, you would emit to the workflow room
  // server.io?.to(workflowId).emit('workflowStatusChange', { workflowId, status });
};