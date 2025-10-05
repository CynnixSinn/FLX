export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    icon: string;
    color: string;
    parameters?: Record<string, any>;
  };
}

export interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'active' | 'inactive';
  version: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface ExecutionLog {
  id: string;
  workflowId: string;
  nodeId: string;
  status: 'pending' | 'running' | 'success' | 'error';
  input?: any;
  output?: any;
  error?: string;
  timestamp: Date;
}