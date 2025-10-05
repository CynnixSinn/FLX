![1000042233](https://github.com/user-attachments/assets/0dc96f68-7b36-4f73-b51e-233cc36c04f4)
# FLX - Workflow Automation

FLX is a full-stack workflow automation platform that allows users to create, manage, and execute complex workflows through an intuitive visual interface. Built with React/TypeScript on the frontend and Node.js/Express on the backend, FLX provides a comprehensive solution for automating business processes.

## Features

- Visual workflow designer with drag-and-drop interface
- Multiple node types for different operations (API calls, database operations, AI services, etc.)
- Real-time execution tracking and monitoring
- User authentication and authorization
- Workflow versioning and deployment
- Comprehensive logging and error handling

## Tech Stack

### Frontend
- React 18 with TypeScript
- Material-UI for UI components
- React Flow for the workflow canvas
- Redux Toolkit for state management
- Socket.io-client for real-time updates

### Backend
- Node.js with Express.js
- TypeScript
- PostgreSQL with Prisma ORM
- Redis for caching and session management
- Socket.io for real-time communication
- JWT for authentication

## Project Structure

```
FLX/
├── client/                 # React frontend application
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # App pages
│   │   ├── hooks/          # Custom hooks
│   │   ├── store/          # Redux store
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript definitions
│   │   └── utils/          # Utility functions
│   └── package.json
├── server/                 # Express backend application
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── routes/         # API routes
│   │   ├── models/         # Database models
│   │   ├── middleware/     # Express middleware
│   │   ├── services/       # Business logic
│   │   ├── workers/        # Workflow execution workers
│   │   ├── utils/          # Utility functions
│   │   └── types/          # TypeScript definitions
│   ├── prisma/             # Prisma schema
│   └── package.json
├── shared/                 # Shared types between client and server
└── docker-compose.yml      # Docker configuration
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL database
- Redis server

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd flx-workflow-automation
```

2. Install dependencies:
```bash
npm install
cd client && npm install
cd ../server && npm install
```

3. Set up environment variables:
```bash
# In the server directory, create a .env file with the following:
DATABASE_URL="postgresql://username:password@localhost:5432/flx"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-jwt-secret-key"
PORT=5000
```

4. Set up the database:
```bash
cd server
npx prisma db push
npx prisma generate
```

5. Start the development servers:
```bash
npm run dev
```

The client will be available at `http://localhost:3000` and the server at `http://localhost:5000`.

## API Endpoints

- `GET /api/workflows` - Get all workflows
- `GET /api/workflows/:id` - Get a specific workflow
- `POST /api/workflows` - Create a new workflow
- `PUT /api/workflows/:id` - Update a workflow
- `DELETE /api/workflows/:id` - Delete a workflow
- `POST /api/workflows/:id/execute` - Execute a workflow
- `GET /api/workflows/:id/executions` - Get execution history for a workflow

## Running Tests

```bash
# Client tests
cd client && npm test

# Server tests
cd server && npm test
```

## Deployment

Detailed deployment instructions will be provided in the future.

## Contributing

We welcome contributions to FLX! Please read our contributing guidelines for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions, please file an issue on the GitHub repository.
