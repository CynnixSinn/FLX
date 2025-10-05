import Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details.map(detail => detail.message) 
      });
    }
    next();
  };
};

// User validation schemas
export const userSchemas = {
  createUser: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().max(100),
  }),
  
  updateUser: Joi.object({
    name: Joi.string().max(100),
    email: Joi.string().email(),
  }),
  
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),
};

// Workflow validation schemas
export const workflowSchemas = {
  createWorkflow: Joi.object({
    name: Joi.string().max(255).required(),
    description: Joi.string().max(1000),
    nodes: Joi.array().items(Joi.object()).required(),
    connections: Joi.array().items(Joi.object()),
  }),
  
  updateWorkflow: Joi.object({
    name: Joi.string().max(255),
    description: Joi.string().max(1000),
    nodes: Joi.array().items(Joi.object()),
    connections: Joi.array().items(Joi.object()),
    status: Joi.string().valid('DRAFT', 'ACTIVE', 'INACTIVE'),
  }),
  
  executeWorkflow: Joi.object({
    input: Joi.object(),
  }),
};