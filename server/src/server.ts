import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import apiRoutes from './routes/api';
import healthRoutes from './routes/health';
import { setupSocketIO } from './services/socketService';
import { limiter, securityMiddleware } from './middleware/security';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Apply security middleware
app.use(securityMiddleware);
// Apply rate limiting
app.use(limiter);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route (public)
app.use('/api/health', healthRoutes);

// API routes
app.use('/api', apiRoutes);

// Serve static files (for production)
app.use(express.static(path.join(__dirname, '../../client/build')));

// Serve React app for any other routes (for production)
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../../client/build/index.html'));
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO
setupSocketIO(server);

// Start server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;