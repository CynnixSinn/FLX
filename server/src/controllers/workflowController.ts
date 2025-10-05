import { Request, Response } from 'express';
import { workflowService } from '../services/workflowService';
import { executeWorkflow } from '../services/workflowExecutionService';
import { Execution } from '@prisma/client';
import prisma from '../services/prisma';

interface AuthRequest extends Request {
  user?: any;
}

export const workflowController = {
  // Get all workflows for the authenticated user
  getAllWorkflows: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const workflows = await workflowService.getAllWorkflows(req.user.id);
      
      res.json({
        workflows,
      });
    } catch (error) {
      console.error('Get all workflows error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get a specific workflow by ID
  getWorkflow: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const workflow = await workflowService.getWorkflowById(id, req.user.id);
      
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      
      res.json({
        workflow,
      });
    } catch (error) {
      console.error('Get workflow error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Create a new workflow
  createWorkflow: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { name, description, nodes, connections } = req.body;
      
      const workflow = await workflowService.createWorkflow({
        name,
        description,
        nodes,
        connections,
        userId: req.user.id,
      });
      
      res.status(201).json({
        message: 'Workflow created successfully',
        workflow,
      });
    } catch (error) {
      console.error('Create workflow error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Update an existing workflow
  updateWorkflow: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const { name, description, nodes, connections, status } = req.body;
      
      const updatedWorkflow = await workflowService.updateWorkflow(id, req.user.id, {
        name,
        description,
        nodes,
        connections,
        status,
      });
      
      if (!updatedWorkflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      
      res.json({
        message: 'Workflow updated successfully',
        workflow: updatedWorkflow,
      });
    } catch (error) {
      console.error('Update workflow error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Delete a workflow
  deleteWorkflow: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      
      const deletedWorkflow = await workflowService.deleteWorkflow(id, req.user.id);
      
      if (!deletedWorkflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      
      res.json({
        message: 'Workflow deleted successfully',
        workflow: deletedWorkflow,
      });
    } catch (error) {
      console.error('Delete workflow error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Execute a workflow
  executeWorkflow: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const { input } = req.body;
      
      // Get the workflow to execute
      const workflow = await workflowService.getWorkflowById(id, req.user.id);
      
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      
      if (workflow.status !== 'ACTIVE') {
        return res.status(400).json({ error: 'Workflow is not active and cannot be executed' });
      }

      // Execute the workflow
      const execution = await executeWorkflow(workflow, input);
      
      res.status(202).json({
        message: 'Workflow execution completed',
        execution,
      });
    } catch (error) {
      console.error('Execute workflow error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get execution history for a workflow
  getWorkflowExecutions: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      
      // Get executions for the workflow
      const executions = await prisma.execution.findMany({
        where: {
          workflowId: id,
          workflow: {
            userId: req.user.id
          }
        },
        orderBy: {
          startedAt: 'desc'
        },
        take: 50 // Limit to last 50 executions
      });
      
      res.json({
        executions,
      });
    } catch (error) {
      console.error('Get workflow executions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};