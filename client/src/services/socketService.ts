import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  }

  connect(token?: string) {
    // Disconnect if already connected
    if (this.socket) {
      this.disconnect();
    }

    // Connect to the Socket.IO server
    this.socket = io(this.baseURL, {
      auth: {
        token: token || '',
      },
      transports: ['websocket', 'polling'],
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected() {
    return this.socket && this.socket.connected;
  }

  // Join a workflow room to receive updates
  joinWorkflow(workflowId: string) {
    if (this.socket) {
      this.socket.emit('joinWorkflow', workflowId);
    }
  }

  // Join an execution room to receive execution updates
  joinExecution(executionId: string) {
    if (this.socket) {
      this.socket.emit('joinExecution', executionId);
    }
  }

  // Listen for execution updates
  onExecutionUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('executionUpdate', callback);
    }
  }

  // Listen for execution logs
  onExecutionLog(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('executionLog', callback);
    }
  }

  // Listen for workflow status changes
  onWorkflowStatusChange(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('workflowStatusChange', callback);
    }
  }

  // Remove listeners
  removeExecutionUpdateListener(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off('executionUpdate', callback);
    }
  }

  removeExecutionLogListener(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off('executionLog', callback);
    }
  }

  removeWorkflowStatusChangeListener(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.off('workflowStatusChange', callback);
    }
  }
}

export default new SocketService();