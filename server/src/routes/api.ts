import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { validate, userSchemas, workflowSchemas } from '../middleware/validation';
import { authController } from '../controllers/authController';
import { workflowController } from '../controllers/workflowController';

const router = express.Router();

// Public routes
router.post('/auth/register', validate(userSchemas.createUser), authController.register);
router.post('/auth/login', validate(userSchemas.login), authController.login);
router.post('/auth/refresh', authController.refreshToken);

// Protected routes
router.use(authenticateToken);

// User routes
router.get('/auth/profile', authController.getProfile);
router.put('/auth/profile', validate(userSchemas.updateUser), authController.updateProfile);

// Workflow routes
router.get('/workflows', workflowController.getAllWorkflows);
router.get('/workflows/:id', workflowController.getWorkflow);
router.post('/workflows', validate(workflowSchemas.createWorkflow), workflowController.createWorkflow);
router.put('/workflows/:id', validate(workflowSchemas.updateWorkflow), workflowController.updateWorkflow);
router.delete('/workflows/:id', workflowController.deleteWorkflow);
router.post('/workflows/:id/execute', validate(workflowSchemas.executeWorkflow), workflowController.executeWorkflow);
router.get('/workflows/:id/executions', workflowController.getWorkflowExecutions);

export default router;