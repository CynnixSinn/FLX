import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { Execution, Workflow } from '@prisma/client';
import prisma from '../services/prisma';
import { ExecutionStatus } from '@prisma/client';
import { emitExecutionUpdate, emitExecutionLog } from '../services/socketService';

// Define types for our node execution
interface NodeExecutionData {
  nodeId: string;
  nodeType: string;
  parameters: any;
  input: any;
}

interface NodeExecutionResult {
  nodeId: string;
  status: ExecutionStatus;
  output: any;
  error?: string;
}

// Mock implementations of different node types
// In a real application, these would be more sophisticated
const nodeExecutors: { [key: string]: (data: NodeExecutionData) => Promise<NodeExecutionResult> } = {
  // Trigger nodes
  'webhook-trigger': async (data: NodeExecutionData) => {
    // Webhook trigger would listen for HTTP requests
    return {
      nodeId: data.nodeId,
      status: 'SUCCESS',
      output: { message: 'Webhook triggered', timestamp: new Date() },
    };
  },

  'schedule-trigger': async (data: NodeExecutionData) => {
    // Schedule trigger would be handled by a scheduler
    return {
      nodeId: data.nodeId,
      status: 'SUCCESS',
      output: { message: 'Schedule triggered', timestamp: new Date() },
    };
  },

  // Action nodes
  'http-request': async (data: NodeExecutionData) => {
    // In a real implementation, this would make an actual HTTP request
    try {
      // Simulate HTTP request
      const { url, method, headers, body } = data.parameters;
      
      // Mock response
      return {
        nodeId: data.nodeId,
        status: 'SUCCESS',
        output: {
          statusCode: 200,
          headers: { 'content-type': 'application/json' },
          body: { message: 'Mock HTTP response', input: data.input },
        },
      };
    } catch (error) {
      return {
        nodeId: data.nodeId,
        status: 'ERROR',
        output: null,
        error: (error as Error).message,
      };
    }
  },

  'code': async (data: NodeExecutionData) => {
    try {
      // In a real implementation, this would execute JavaScript code safely
      // For now, we'll just return the input with some transformation
      return {
        nodeId: data.nodeId,
        status: 'SUCCESS',
        output: {
          ...data.input,
          processedBy: 'code-node',
          timestamp: new Date(),
        },
      };
    } catch (error) {
      return {
        nodeId: data.nodeId,
        status: 'ERROR',
        output: null,
        error: (error as Error).message,
      };
    }
  },

  'set': async (data: NodeExecutionData) => {
    try {
      // Set node would modify data based on parameters
      const { key, value } = data.parameters;
      const output = {
        ...data.input,
        [key]: value,
      };

      return {
        nodeId: data.nodeId,
        status: 'SUCCESS',
        output,
      };
    } catch (error) {
      return {
        nodeId: data.nodeId,
        status: 'ERROR',
        output: null,
        error: (error as Error).message,
      };
    }
  },

  // Flow control nodes
  'if': async (data: NodeExecutionData) => {
    try {
      // Evaluate condition and determine next path
      const { condition } = data.parameters;
      
      // This is simplified - in reality, you'd evaluate the condition properly
      const conditionResult = evalCondition(condition, data.input);
      
      return {
        nodeId: data.nodeId,
        status: 'SUCCESS',
        output: {
          ...data.input,
          conditionResult,
          nextPath: conditionResult ? 'true' : 'false',
        },
      };
    } catch (error) {
      return {
        nodeId: data.nodeId,
        status: 'ERROR',
        output: null,
        error: (error as Error).message,
      };
    }
  },

  // Communication nodes
  'email-send': async (data: NodeExecutionData) => {
    try {
      // Send email logic would go here
      const { to, subject, body } = data.parameters;
      
      return {
        nodeId: data.nodeId,
        status: 'SUCCESS',
        output: {
          message: 'Email sent successfully',
          to,
          subject,
        },
      };
    } catch (error) {
      return {
        nodeId: data.nodeId,
        status: 'ERROR',
        output: null,
        error: (error as Error).message,
      };
    }
  },

  // Database nodes
  'postgres': async (data: NodeExecutionData) => {
    try {
      // Execute database query
      const { query, params } = data.parameters;
      
      // In a real implementation, this would execute the actual query
      return {
        nodeId: data.nodeId,
        status: 'SUCCESS',
        output: {
          message: 'Query executed',
          query,
          result: [],
        },
      };
    } catch (error) {
      return {
        nodeId: data.nodeId,
        status: 'ERROR',
        output: null,
        error: (error as Error).message,
      };
    }
  },

  // AI nodes
  'openai': async (data: NodeExecutionData) => {
    try {
      // Call OpenAI API
      const { prompt, model } = data.parameters;
      
      return {
        nodeId: data.nodeId,
        status: 'SUCCESS',
        output: {
          response: 'This is a mock OpenAI response',
          model,
          prompt,
        },
      };
    } catch (error) {
      return {
        nodeId: data.nodeId,
        status: 'ERROR',
        output: null,
        error: (error as Error).message,
      };
    }
  },
};

// Helper function to evaluate conditions
function evalCondition(condition: string, input: any): boolean {
  // In a real implementation, you would want to use a safer method than eval
  // For example, using a library like math.js or building a custom parser
  try {
    // Replace variables in condition with actual values from input
    let evalCondition = condition;
    for (const key in input) {
      evalCondition = evalCondition.replace(new RegExp(`{${key}}`, 'g'), JSON.stringify(input[key]));
    }
    
    // Simplified evaluation - in a real system you'd want more robust parsing
    return new Function('return ' + evalCondition)();
  } catch (error) {
    console.error('Error evaluating condition:', error);
    return false;
  }
}

// Main workflow execution function
export const executeWorkflow = async (workflow: Workflow, input?: any): Promise<Execution> => {
  try {
    // Update execution status to running
    const execution = await prisma.execution.create({
      data: {
        workflowId: workflow.id,
        status: 'RUNNING',
        input: input || {},
      },
    });

    // Emit execution start event
    await emitExecutionUpdate(execution.id, 'RUNNING');

    // Parse workflow nodes and connections
    const nodes: any[] = workflow.nodes as any[];
    const connections: any[] = workflow.connections as any[] || [];

    // Find the starting node(s) - in this simple implementation, we'll assume it's the first one
    // In a real system, you'd find nodes with no incoming connections or specific trigger nodes
    const startNodes = nodes.filter(node => node.type.includes('trigger'));

    if (startNodes.length === 0) {
      await emitExecutionUpdate(execution.id, 'ERROR', null, 'No starting nodes found in workflow');
      throw new Error('No starting nodes found in workflow');
    }

    // Execute the workflow using a recursive approach
    const results: { [key: string]: NodeExecutionResult } = {};
    
    // Execute starting node(s)
    for (const startNode of startNodes) {
      await executeNode(startNode, workflow, input || {}, results, execution.id);
    }

    // Update execution status to success
    await prisma.execution.update({
      where: { id: execution.id },
      data: { status: 'SUCCESS', completedAt: new Date() },
    });

    // Emit execution completion event
    await emitExecutionUpdate(execution.id, 'SUCCESS', results);

    return execution;
  } catch (error) {
    console.error('Error executing workflow:', error);
    
    // Update execution status to error
    try {
      await prisma.execution.update({
        where: { id: execution.id },
        data: { 
          status: 'ERROR', 
          error: (error as Error).message,
          completedAt: new Date() 
        },
      });

      // Emit execution error event
      await emitExecutionUpdate(execution.id, 'ERROR', null, (error as Error).message);
    } catch (updateError) {
      console.error('Error updating execution status:', updateError);
    }
    
    throw error;
  }
};

// Execute a single node and its dependent nodes
const executeNode = async (
  node: any,
  workflow: Workflow,
  input: any,
  results: { [key: string]: NodeExecutionResult },
  executionId: string
): Promise<NodeExecutionResult> => {
  try {
    // Emit node execution start event
    await emitExecutionLog(executionId, node.id, 'RUNNING', input);

    // Log execution to the database
    await prisma.executionLog.create({
      data: {
        executionId,
        nodeId: node.id,
        status: 'RUNNING',
        input,
      },
    });

    // Execute the node based on its type
    const executor = nodeExecutors[node.type];
    if (!executor) {
      throw new Error(`Unknown node type: ${node.type}`);
    }

    const nodeData: NodeExecutionData = {
      nodeId: node.id,
      nodeType: node.type,
      parameters: node.data?.parameters || {},
      input,
    };

    const result = await executor(nodeData);

    // Store result
    results[node.id] = result;

    // Log the result to the database
    await prisma.executionLog.create({
      data: {
        executionId,
        nodeId: node.id,
        status: result.status,
        input,
        output: result.output,
        error: result.error,
      },
    });

    // Emit node execution result event
    await emitExecutionLog(executionId, node.id, result.status, input, result.output, result.error);

    // Find downstream nodes connected to this one
    const connections: any[] = workflow.connections as any[] || [];
    const downstreamNodes = connections
      .filter(conn => conn.source === node.id)
      .map(conn => workflow.nodes.find((n: any) => n.id === conn.target))
      .filter(Boolean) as any[];

    // Execute downstream nodes
    for (const downstreamNode of downstreamNodes) {
      // In a real system, you'd need to handle merging inputs from multiple upstream nodes
      await executeNode(downstreamNode, workflow, result.output || {}, results, executionId);
    }

    return result;
  } catch (error) {
    console.error(`Error executing node ${node.id}:`, error);
    
    // Log error to the database
    await prisma.executionLog.create({
      data: {
        executionId,
        nodeId: node.id,
        status: 'ERROR',
        input,
        error: (error as Error).message,
      },
    });

    // Emit node execution error event
    await emitExecutionLog(executionId, node.id, 'ERROR', input, null, (error as Error).message);

    // In a real system, you might have error handling nodes or retry logic

    throw error;
  }
};

// Create a worker-based execution function for parallel processing
export const executeWorkflowInWorker = (workflow: Workflow, input?: any): Promise<Execution> => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(__filename, {
      workerData: { workflow, input }
    });

    worker.on('message', (result) => {
      resolve(result);
    });

    worker.on('error', (error) => {
      reject(error);
    });
  });
};

// If this module is run as a worker thread, execute the workflow
if (!isMainThread && parentPort && workerData) {
  const { workflow, input } = workerData;
  
  executeWorkflow(workflow, input)
    .then(result => {
      parentPort?.postMessage(result);
    })
    .catch(error => {
      parentPort?.postMessage({ error: error.message });
    });
}