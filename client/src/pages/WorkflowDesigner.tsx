import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  TextField, 
  Button, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemText, 
  Divider, 
  Tabs, 
  Tab,
  Chip,
  Collapse,
  ListItemIcon,
  ListItemButton,
  Alert,
  AlertTitle
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Settings as SettingsIcon, 
  Save as SaveIcon, 
  PlayArrow as PlayArrowIcon, 
  Search as SearchIcon,
  ExpandLess,
  ExpandMore
} from '@mui/icons-material';
import ReactFlow, { 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  BackgroundVariant,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  useReactFlow
} from 'react-flow-renderer';

import socketService from '../services/socketService';

// Types based on our shared types
interface WorkflowNode {
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

interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
}

interface Workflow {
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

interface ExecutionUpdate {
  executionId: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'ERROR';
  output?: any;
  error?: string;
}

interface ExecutionLog {
  executionId: string;
  nodeId: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'ERROR';
  input?: any;
  output?: any;
  error?: string;
}

// Mock data for node types based on the original FLX.html
const nodeTypes = [
  {
    category: 'Triggers',
    expanded: true,
    items: [
      { id: 'webhook-trigger', name: 'Webhook', description: 'Listen for HTTP requests', icon: '🌐', color: 'trigger-color', popular: true },
      { id: 'schedule-trigger', name: 'Schedule Trigger', description: 'Trigger on a schedule', icon: '⏰', color: 'trigger-color', popular: true },
      { id: 'manual-trigger', name: 'Manual Trigger', description: 'Start workflow manually', icon: '👆', color: 'trigger-color', popular: false },
      { id: 'email-trigger', name: 'Email Trigger', description: 'Trigger on email received', icon: '📧', color: 'trigger-color', popular: false },
      { id: 'file-trigger', name: 'File Trigger', description: 'Watch for file changes', icon: '📁', color: 'trigger-color', popular: false },
      { id: 'kafka-trigger', name: 'Kafka Trigger', description: 'Consume Kafka messages', icon: '🚀', color: 'trigger-color', popular: false },
    ]
  },
  {
    category: 'Core Actions',
    expanded: true,
    items: [
      { id: 'http-request', name: 'HTTP Request', description: 'Make HTTP requests', icon: '📡', color: 'action-color', popular: true },
      { id: 'code', name: 'Code', description: 'Execute JavaScript code', icon: '💻', color: 'transform-color', popular: true },
      { id: 'set', name: 'Set', description: 'Set data values', icon: '📝', color: 'transform-color', popular: true },
      { id: 'merge', name: 'Merge', description: 'Merge data from multiple inputs', icon: '🔀', color: 'transform-color', popular: false },
      { id: 'split-in-batches', name: 'Split In Batches', description: 'Process data in batches', icon: '📦', color: 'transform-color', popular: false },
      { id: 'item-lists', name: 'Item Lists', description: 'Work with arrays of data', icon: '📋', color: 'transform-color', popular: false },
    ]
  },
  {
    category: 'Flow Control',
    expanded: true,
    items: [
      { id: 'if', name: 'IF', description: 'Conditional routing', icon: '🔀', color: 'conditional-color', popular: true },
      { id: 'switch', name: 'Switch', description: 'Route to multiple paths', icon: '🔄', color: 'conditional-color', popular: false },
      { id: 'wait', name: 'Wait', description: 'Pause workflow execution', icon: '⏸️', color: 'conditional-color', popular: false },
      { id: 'stop-and-error', name: 'Stop and Error', description: 'Stop execution with error', icon: '🛑', color: 'conditional-color', popular: false },
      { id: 'no-op', name: 'No Operation', description: 'Do nothing (for testing)', icon: '⭕', color: 'conditional-color', popular: false },
      { id: 'execute-workflow', name: 'Execute Workflow', description: 'Run another workflow', icon: '🔗', color: 'conditional-color', popular: false },
    ]
  },
  {
    category: 'Communication',
    expanded: true,
    items: [
      { id: 'email-send', name: 'Email Send', description: 'Send emails via SMTP', icon: '📧', color: 'communication-color', popular: true },
      { id: 'slack', name: 'Slack', description: 'Send Slack messages', icon: '💬', color: 'communication-color', popular: true },
      { id: 'discord', name: 'Discord', description: 'Send Discord messages', icon: '🎮', color: 'communication-color', popular: false },
      { id: 'telegram', name: 'Telegram', description: 'Send Telegram messages', icon: '✈️', color: 'communication-color', popular: false },
      { id: 'whatsapp', name: 'WhatsApp', description: 'Send WhatsApp messages', icon: '📱', color: 'communication-color', popular: false },
      { id: 'sms', name: 'SMS', description: 'Send SMS messages', icon: '📲', color: 'communication-color', popular: false },
      { id: 'microsoft-teams', name: 'Microsoft Teams', description: 'Send Teams messages', icon: '👥', color: 'communication-color', popular: false },
    ]
  },
  {
    category: 'Database',
    expanded: true,
    items: [
      { id: 'postgres', name: 'Postgres', description: 'PostgreSQL database', icon: '🐘', color: 'database-color', popular: true },
      { id: 'mysql', name: 'MySQL', description: 'MySQL database', icon: '🐬', color: 'database-color', popular: true },
      { id: 'mongodb', name: 'MongoDB', description: 'MongoDB database', icon: '🍃', color: 'database-color', popular: false },
      { id: 'redis', name: 'Redis', description: 'Redis key-value store', icon: '🔴', color: 'database-color', popular: false },
      { id: 'sqlite', name: 'SQLite', description: 'SQLite database', icon: '🗃️', color: 'database-color', popular: false },
      { id: 'influxdb', name: 'InfluxDB', description: 'Time series database', icon: '📈', color: 'database-color', popular: false },
    ]
  },
  {
    category: 'Productivity',
    expanded: true,
    items: [
      { id: 'google-sheets', name: 'Google Sheets', description: 'Read/write spreadsheets', icon: '📊', color: 'productivity-color', popular: true },
      { id: 'google-drive', name: 'Google Drive', description: 'Manage Google Drive files', icon: '📁', color: 'productivity-color', popular: true },
      { id: 'gmail', name: 'Gmail', description: 'Send/receive Gmail', icon: '📬', color: 'productivity-color', popular: false },
      { id: 'notion', name: 'Notion', description: 'Manage Notion pages', icon: '📝', color: 'productivity-color', popular: false },
      { id: 'airtable', name: 'Airtable', description: 'Manage Airtable records', icon: '🏗️', color: 'productivity-color', popular: false },
      { id: 'trello', name: 'Trello', description: 'Manage Trello boards', icon: '📋', color: 'productivity-color', popular: false },
      { id: 'asana', name: 'Asana', description: 'Manage Asana tasks', icon: '✅', color: 'productivity-color', popular: false },
      { id: 'jira', name: 'Jira', description: 'Manage Jira issues', icon: '🎯', color: 'productivity-color', popular: false },
      { id: 'monday', name: 'Monday.com', description: 'Manage Monday boards', icon: '📅', color: 'productivity-color', popular: false },
      { id: 'microsoft-excel', name: 'Microsoft Excel', description: 'Read/write Excel files', icon: '📈', color: 'productivity-color', popular: false },
    ]
  },
  {
    category: 'AI & Machine Learning',
    expanded: true,
    items: [
      { id: 'openai', name: 'OpenAI', description: 'Use GPT and other models', icon: '🤖', color: 'ai-color', popular: true },
      { id: 'anthropic', name: 'Anthropic', description: 'Use Claude AI', icon: '🧠', color: 'ai-color', popular: false },
      { id: 'hugging-face', name: 'Hugging Face', description: 'ML models and datasets', icon: '🤗', color: 'ai-color', popular: false },
      { id: 'aws-comprehend', name: 'AWS Comprehend', description: 'Text analysis service', icon: '☁️', color: 'ai-color', popular: false },
      { id: 'google-translate', name: 'Google Translate', description: 'Translate text', icon: '🌍', color: 'ai-color', popular: false },
      { id: 'deepl', name: 'DeepL', description: 'Advanced translation', icon: '🔄', color: 'ai-color', popular: false },
    ]
  }
];

// Custom node component with status indicators
const CustomNode = ({ data, isConnectable }: any) => {
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  
  // Update status based on real-time updates
  useEffect(() => {
    // This would be updated based on real-time execution updates
    // For now, we'll just use the data passed in
  }, [data]);

  return (
    <div style={{
      padding: '14px 16px 12px',
      borderRadius: '12px',
      border: status === 'idle' ? '2px solid #e5e7eb' : 
               status === 'running' ? '2px solid #ea4b71' : 
               status === 'success' ? '2px solid #16a34a' : 
               '2px solid #dc2626',
      background: status === 'success' ? '#f0fdf4' : 
                  status === 'error' ? '#fef2f2' : 'white',
      minWidth: '220px',
      maxWidth: '300px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      position: 'relative',
      ...(status === 'running' && {
        animation: 'nodeExecuting 2s infinite',
      })
    }}>
      <style>{`
        @keyframes nodeExecuting {
          0%, 100% { box-shadow: 0 0 0 3px rgba(234, 75, 113, 0.3); }
          50% { box-shadow: 0 0 0 8px rgba(234, 75, 113, 0.1); }
        }
      `}</style>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <div style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          marginRight: '10px',
          background: status === 'idle' ? '#d1d5db' : 
                      status === 'running' ? '#ea4b71' : 
                      status === 'success' ? '#16a34a' : 
                      '#dc2626',
          flexShrink: 0,
          ...(status === 'running' && {
            animation: 'pulse 1.5s infinite',
          })
        }}></div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
        <div style={{
          width: '28px',
          height: '28px',
          marginRight: '10px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          background: '#ea4b71',
          color: 'white',
          flexShrink: 0
        }}>
          {data.icon}
        </div>
        <div style={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#374151'
          }}>
            {data.label}
          </div>
        </div>
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '20px',
          height: '20px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          opacity: 0,
          transition: 'all 0.2s ease',
          background: '#f3f4f6',
          color: '#6b7280'
        }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} 
           onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}>
          ⋮
        </div>
      </div>
      <div style={{
        padding: '0 16px'
      }}>
        <div style={{
          fontSize: '12px',
          color: '#6b7280',
          marginBottom: '10px',
          lineHeight: '1.4'
        }}>
          {data.description}
        </div>
      </div>
    </div>
  );
};

const nodeTypesMap = {
  customNode: CustomNode,
};

const WorkflowDesigner: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowName, setWorkflowName] = useState('My Workflow');
  const [workflowStatus, setWorkflowStatus] = useState<'draft' | 'active' | 'inactive'>('inactive');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = React.useState(0);
  const [nodeSearch, setNodeSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({});
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [executionMessage, setExecutionMessage] = useState('');
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [executionPanelOpen, setExecutionPanelOpen] = useState(false);
  const [activeExecutionTab, setActiveExecutionTab] = useState(0);
  
  const { fitView } = useReactFlow();

  // Initialize expanded categories
  useEffect(() => {
    const initialExpanded: {[key: string]: boolean} = {};
    nodeTypes.forEach(category => {
      initialExpanded[category.category] = category.expanded;
    });
    setExpandedCategories(initialExpanded);
  }, []);

  // Initialize with sample nodes
  useEffect(() => {
    const initialNodes: Node[] = [
      {
        id: '1',
        type: 'customNode',
        position: { x: 250, y: 0 },
        data: { 
          label: 'Webhook Trigger',
          icon: '🌐',
          color: 'trigger-color',
          description: 'Listen for HTTP requests'
        },
      },
      {
        id: '2',
        type: 'customNode',
        position: { x: 250, y: 200 },
        data: { 
          label: 'HTTP Request',
          icon: '📡',
          color: 'action-color',
          description: 'Make HTTP requests'
        },
      },
      {
        id: '3',
        type: 'customNode',
        position: { x: 250, y: 400 },
        data: { 
          label: 'Response',
          icon: '📤',
          color: 'action-color',
          description: 'Return response'
        },
      },
    ];

    const initialEdges: Edge[] = [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
    ];

    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [setNodes, setEdges]);

  // Setup socket listeners
  useEffect(() => {
    // Connect to socket
    const socket = socketService.connect();
    
    // Listen for execution updates
    const handleExecutionUpdate = (data: ExecutionUpdate) => {
      console.log('Execution update:', data);
      if (data.status === 'RUNNING') {
        setExecutionStatus('running');
        setExecutionMessage('Workflow is running...');
      } else if (data.status === 'SUCCESS') {
        setExecutionStatus('success');
        setExecutionMessage('Workflow executed successfully!');
      } else if (data.status === 'ERROR') {
        setExecutionStatus('error');
        setExecutionMessage(data.error || 'Workflow execution failed');
      }
    };

    // Listen for execution logs
    const handleExecutionLog = (data: ExecutionLog) => {
      console.log('Execution log:', data);
      setExecutionLogs(prev => [...prev, data]);
      
      // Update node status based on log
      setNodes(prevNodes => 
        prevNodes.map(node => 
          node.id === data.nodeId 
            ? { ...node, data: { ...node.data, status: data.status } } 
            : node
        )
      );
    };

    socketService.onExecutionUpdate(handleExecutionUpdate);
    socketService.onExecutionLog(handleExecutionLog);

    // Cleanup
    return () => {
      socketService.removeExecutionUpdateListener(handleExecutionUpdate);
      socketService.removeExecutionLogListener(handleExecutionLog);
      socketService.disconnect();
    };
  }, [setNodes]);

  const onConnect = (params: Connection) => setEdges((eds) => addEdge(params, eds));

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleSettings = () => {
    setSettingsOpen(!settingsOpen);
  };

  const toggleExecutionPanel = () => {
    setExecutionPanelOpen(!executionPanelOpen);
  };

  const executeWorkflow = async () => {
    setExecutionStatus('running');
    setExecutionMessage('Starting workflow execution...');
    setExecutionLogs([]);
    
    try {
      // In a real application, this would call the backend API
      console.log('Executing workflow...');
      
      // Simulate execution
      setTimeout(() => {
        setExecutionStatus('success');
        setExecutionMessage('Workflow executed successfully!');
      }, 2000);
    } catch (error) {
      setExecutionStatus('error');
      setExecutionMessage('Error executing workflow');
      console.error('Execution error:', error);
    }
  };

  const testWorkflow = () => {
    console.log('Testing workflow...');
    // In a real application, this would call the backend API for testing
  };

  const saveWorkflow = () => {
    console.log('Saving workflow...');
    // In a real application, this would save to the backend
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const filteredNodeTypes = nodeTypes.map(category => ({
    ...category,
    items: category.items.filter(item => 
      item.name.toLowerCase().includes(nodeSearch.toLowerCase()) || 
      item.description.toLowerCase().includes(nodeSearch.toLowerCase())
    )
  }));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1, 
          backgroundColor: 'white', 
          color: 'black', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          height: '65px'
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', height: '65px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Typography 
              variant="h5" 
              component="div" 
              sx={{ fontWeight: 'bold', color: '#ea4b71', textDecoration: 'none' }}
            >
              FLX
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <TextField
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                variant="outlined"
                size="small"
                sx={{ 
                  minWidth: 200,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      border: '1px solid transparent',
                    },
                    '&:hover fieldset': {
                      border: '1px solid #d1d5db',
                      backgroundColor: '#f9fafb'
                    },
                    '&.Mui-focused fieldset': {
                      border: '1px solid #ea4b71',
                      boxShadow: '0 0 0 3px rgba(234, 75, 113, 0.1)',
                      backgroundColor: 'white'
                    }
                  }
                }}
              />
              <Chip 
                label="Draft" 
                size="small"
                sx={{ 
                  backgroundColor: '#f3f4f6', 
                  color: '#6b7280',
                  fontSize: '0.75rem',
                  height: '24px'
                }} 
              />
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, padding: '6px 12px', backgroundColor: '#f3f4f6', borderRadius: '20px', fontSize: '0.875rem', color: '#6b7280' }}>
              <Box sx={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: workflowStatus === 'active' ? '#10b981' : '#d1d5db', animation: workflowStatus === 'active' ? 'pulse 2s infinite' : 'none' }} />
              <span>{workflowStatus === 'active' ? 'Active' : 'Inactive'}</span>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={toggleSettings} color="inherit" size="large" sx={{ color: '#6b7280' }}>
              <SettingsIcon />
            </IconButton>
            <IconButton onClick={toggleSidebar} color="inherit" size="large" sx={{ color: '#6b7280' }}>
              <MenuIcon />
            </IconButton>
            <Button 
              variant="outlined" 
              onClick={testWorkflow} 
              startIcon={<span>🧪</span>}
              sx={{ 
                textTransform: 'none',
                borderColor: '#d1d5db',
                color: '#374151',
                '&:hover': { 
                  backgroundColor: '#f9fafb',
                  borderColor: '#9ca3af'
                }
              }}
            >
              Test
            </Button>
            <Button 
              variant="outlined" 
              onClick={saveWorkflow} 
              startIcon={<SaveIcon />}
              sx={{ 
                textTransform: 'none',
                borderColor: '#d1d5db',
                color: '#374151',
                '&:hover': { 
                  backgroundColor: '#f9fafb',
                  borderColor: '#9ca3af'
                }
              }}
            >
              Save
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={executeWorkflow} 
              startIcon={executionStatus === 'running' ? <span>⏳</span> : <PlayArrowIcon />}
              disabled={executionStatus === 'running'}
              sx={{ 
                textTransform: 'none',
                backgroundColor: executionStatus === 'running' ? '#9ca3af' : '#ea4b71',
                '&:hover': executionStatus === 'running' ? {} : { 
                  backgroundColor: '#dc2657'
                }
              }}
            >
              {executionStatus === 'running' ? 'Running...' : 'Execute'}
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flexGrow: 1, pt: '65px' }}>
        {/* Sidebar */}
        <Drawer
          variant="persistent"
          anchor="left"
          open={sidebarOpen}
          sx={{
            width: 300,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 300,
              boxSizing: 'border-box',
              borderRight: '1px solid #e5e7eb',
              backgroundColor: 'white',
            },
          }}
        >
          <Toolbar />
          <Box sx={{ display: 'flex', gap: 1, padding: '20px 20px 16px' }}>
            <Tab 
              label="Nodes" 
              sx={{ 
                flex: 1, 
                fontSize: '0.875rem',
                fontWeight: 500,
                textTransform: 'none',
                color: activeTab === 0 ? 'black' : '#6b7280',
                backgroundColor: activeTab === 0 ? '#f3f4f6' : 'transparent',
                borderRadius: '6px',
                '&.Mui-selected': {
                  backgroundColor: '#ea4b71',
                  color: 'white'
                }
              }}
              onClick={() => setActiveTab(0)}
            />
            <Tab 
              label="Data" 
              sx={{ 
                flex: 1, 
                fontSize: '0.875rem',
                fontWeight: 500,
                textTransform: 'none',
                color: activeTab === 1 ? 'black' : '#6b7280',
                backgroundColor: activeTab === 1 ? '#f3f4f6' : 'transparent',
                borderRadius: '6px',
                '&.Mui-selected': {
                  backgroundColor: '#ea4b71',
                  color: 'white'
                }
              }}
              onClick={() => setActiveTab(1)}
            />
            <Tab 
              label="Settings" 
              sx={{ 
                flex: 1, 
                fontSize: '0.875rem',
                fontWeight: 500,
                textTransform: 'none',
                color: activeTab === 2 ? 'black' : '#6b7280',
                backgroundColor: activeTab === 2 ? '#f3f4f6' : 'transparent',
                borderRadius: '6px',
                '&.Mui-selected': {
                  backgroundColor: '#ea4b71',
                  color: 'white'
                }
              }}
              onClick={() => setActiveTab(2)}
            />
          </Box>
          
          <Divider />
          
          <Box sx={{ p: 2 }}>
            <Box sx={{ position: 'relative', mb: 2 }}>
              <SearchIcon sx={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '1rem' }} />
              <TextField
                fullWidth
                placeholder="Search nodes..."
                variant="outlined"
                size="small"
                value={nodeSearch}
                onChange={(e) => setNodeSearch(e.target.value)}
                InputProps={{
                  sx: { pl: 6, backgroundColor: '#f9fafb', '&:focus': { backgroundColor: 'white' } }
                }}
              />
            </Box>
          </Box>
          
          <Box sx={{ overflow: 'auto', height: 'calc(100% - 120px)' }}>
            {filteredNodeTypes.map((category) => (
              <div key={category.category}>
                <ListItemButton 
                  onClick={() => toggleCategory(category.category)}
                  sx={{ 
                    py: 1.5,
                    px: 2.5,
                    '&:hover': { backgroundColor: 'transparent' }
                  }}
                >
                  <ListItemText 
                    primary={category.category} 
                    primaryTypographyProps={{ 
                      fontSize: '0.8125rem', 
                      fontWeight: 600, 
                      color: '#374151',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                      {category.items.length}
                    </Typography>
                    {expandedCategories[category.category] ? <ExpandLess /> : <ExpandMore />}
                  </Box>
                </ListItemButton>
                
                <Collapse in={expandedCategories[category.category]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {category.items.map((item) => (
                      <ListItem 
                        key={item.id} 
                        draggable
                        sx={{ 
                          py: 1.25,
                          px: 3,
                          '&:hover': { bgcolor: '#f9fafb', borderColor: '#e5e7eb' },
                          border: '1px solid transparent',
                          borderRadius: 1,
                          mx: 1,
                          mb: 0.5,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Box sx={{ 
                          width: 36, 
                          height: 36, 
                          borderRadius: 1, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          mr: 1.5, 
                          bgcolor: '#ea4b71', 
                          color: 'white',
                          flexShrink: 0
                        }}>
                          {item.icon}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 600, 
                              color: '#374151',
                              display: 'flex',
                              justifyContent: 'space-between'
                            }}
                          >
                            {item.name}
                            {item.popular && <span>🔥</span>}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: '#6b7280',
                              lineHeight: '1.3',
                              display: 'block',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {item.description}
                          </Typography>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </div>
            ))}
          </Box>
        </Drawer>

        {/* Main Canvas Area */}
        <Box sx={{ flexGrow: 1, position: 'relative', backgroundColor: '#f9fafb' }}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypesMap}
              fitView
              style={{ backgroundColor: '#f9fafb' }}
              connectionLineStyle={{ stroke: '#9ca3af', strokeWidth: 2 }}
              snapToGrid={true}
              snapGrid={[15, 15]}
            >
              <Controls 
                style={{ 
                  left: 20,
                  top: 20,
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              />
              <Background 
                variant={BackgroundVariant.Dots} 
                gap={20} 
                size={1} 
                color="#d1d5db"
              />
            </ReactFlow>
          </ReactFlowProvider>
          
          {/* Canvas Toolbar */}
          <Box sx={{ 
            position: 'absolute', 
            top: 20, 
            left: 20, 
            zIndex: 100, 
            display: 'flex', 
            gap: 1, 
            backgroundColor: 'white', 
            p: 1, 
            borderRadius: 1, 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
          }}>
            <IconButton size="small" onClick={() => fitView()} sx={{ color: '#6b7280' }}>
              +
            </IconButton>
            <IconButton size="small" onClick={() => console.log('Zoom out')} sx={{ color: '#6b7280' }}>
              -
            </IconButton>
            <IconButton size="small" onClick={() => console.log('Fit to screen')} sx={{ color: '#6b7280' }}>
              🛞
            </IconButton>
            <IconButton size="small" onClick={() => console.log('Reset zoom')} sx={{ color: '#6b7280' }}>
              🎯
            </IconButton>
          </Box>
          
          {/* Canvas Controls */}
          <Box sx={{ 
            position: 'absolute', 
            top: 20, 
            right: 20, 
            zIndex: 100, 
            display: 'flex', 
            gap: 1 
          }}>
            <Button 
              variant="outlined" 
              size="small"
              onClick={toggleExecutionPanel}
              sx={{ 
                textTransform: 'none',
                borderColor: '#d1d5db',
                color: '#374151',
                '&:hover': { 
                  backgroundColor: '#f9fafb',
                  borderColor: '#9ca3af'
                }
              }}
            >
              📊 Executions
            </Button>
            <Button 
              variant="outlined" 
              size="small"
              sx={{ 
                textTransform: 'none',
                borderColor: '#d1d5db',
                color: '#374151',
                '&:hover': { 
                  backgroundColor: '#f9fafb',
                  borderColor: '#9ca3af'
                }
              }}
            >
              🗺️ Minimap
            </Button>
            <Button 
              variant="outlined" 
              size="small" 
              color="error"
              sx={{ 
                textTransform: 'none',
                borderColor: '#d1d5db',
                color: '#374151',
                '&:hover': { 
                  backgroundColor: '#fef2f2',
                  borderColor: '#f87171'
                }
              }}
            >
              🗑️ Clear
            </Button>
          </Box>
        </Box>
      </Box>
      
      {/* Execution Panel */}
      <Box 
        sx={{ 
          position: 'fixed',
          bottom: 0,
          left: sidebarOpen ? 300 : 0,
          right: 0,
          height: executionPanelOpen ? 300 : 0,
          backgroundColor: 'white',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          transform: executionPanelOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s ease, height 0.3s ease',
          zIndex: 50,
          boxShadow: '0 -4px 12px rgba(0,0,0,0.1)'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '12px 20px', 
          borderBottom: '1px solid #e5e7eb', 
          backgroundColor: '#fafbfc' 
        }}>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Box
              sx={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: activeExecutionTab === 0 ? '#ea4b71' : '#6b7280',
                cursor: 'pointer',
                paddingBottom: '8px',
                borderBottom: activeExecutionTab === 0 ? '2px solid #ea4b71' : '2px solid transparent',
              }}
              onClick={() => setActiveExecutionTab(0)}
            >
              Executions
            </Box>
            <Box
              sx={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: activeExecutionTab === 1 ? '#ea4b71' : '#6b7280',
                cursor: 'pointer',
                paddingBottom: '8px',
                borderBottom: activeExecutionTab === 1 ? '2px solid #ea4b71' : '2px solid transparent',
              }}
              onClick={() => setActiveExecutionTab(1)}
            >
              Logs
            </Box>
            <Box
              sx={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: activeExecutionTab === 2 ? '#ea4b71' : '#6b7280',
                cursor: 'pointer',
                paddingBottom: '8px',
                borderBottom: activeExecutionTab === 2 ? '2px solid #ea4b71' : '2px solid transparent',
              }}
              onClick={() => setActiveExecutionTab(2)}
            >
              Data
            </Box>
            <Box
              sx={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: activeExecutionTab === 3 ? '#ea4b71' : '#6b7280',
                cursor: 'pointer',
                paddingBottom: '8px',
                borderBottom: activeExecutionTab === 3 ? '2px solid #ea4b71' : '2px solid transparent',
              }}
              onClick={() => setActiveExecutionTab(3)}
            >
              Errors
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: '0.875rem', color: '#6b7280' }}>
            <span>Last execution: <strong>Just now</strong></span>
          </Box>
        </Box>
        
        <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex' }}>
          {activeExecutionTab === 0 && (
            <Box sx={{ flex: 1, padding: 2 }}>
              {executionStatus !== 'idle' && (
                <Alert 
                  severity={executionStatus === 'success' ? 'success' : executionStatus === 'error' ? 'error' : 'info'}
                  sx={{ marginBottom: 2 }}
                >
                  <AlertTitle>
                    {executionStatus === 'running' ? 'Running' : 
                     executionStatus === 'success' ? 'Success' : 
                     'Error'}
                  </AlertTitle>
                  {executionMessage}
                </Alert>
              )}
              <Typography variant="h6" gutterBottom>Recent Executions</Typography>
              <Box>No executions yet. Run your workflow to see execution history here.</Box>
            </Box>
          )}
          
          {activeExecutionTab === 1 && (
            <Box sx={{ flex: 1, padding: 2, fontFamily: 'monospace', fontSize: '0.75rem' }}>
              <Typography variant="h6" gutterBottom>Execution Logs</Typography>
              {executionLogs.length === 0 ? (
                <Box>No logs yet. Execute the workflow to see logs here.</Box>
              ) : (
                <Box>
                  {executionLogs.map((log, index) => (
                    <Box key={index} sx={{ marginBottom: 1, padding: 1, backgroundColor: '#fafbfc', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', gap: 2, color: '#9ca3af', fontSize: '0.7rem' }}>
                        <span>10:25:{String(30 + index).padStart(2, '0')}</span>
                        <span className={log.status === 'SUCCESS' ? 'success' : log.status === 'ERROR' ? 'error' : 'info'}>
                          {log.status}
                        </span>
                      </Box>
                      <Box>
                        Node <strong>{log.nodeId}</strong> {log.status === 'SUCCESS' ? 'completed' : log.status === 'ERROR' ? 'failed' : 'executing'}
                      </Box>
                      {log.output && (
                        <Box sx={{ marginTop: 1, backgroundColor: '#f3f4f6', padding: 1, borderRadius: 1, fontSize: '0.65rem' }}>
                          Output: {JSON.stringify(log.output, null, 2)}
                        </Box>
                      )}
                      {log.error && (
                        <Box sx={{ marginTop: 1, backgroundColor: '#fef2f2', padding: 1, borderRadius: 1, color: '#dc2626', fontSize: '0.65rem' }}>
                          Error: {log.error}
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
          
          {activeExecutionTab === 2 && (
            <Box sx={{ flex: 1, padding: 2 }}>
              <Typography variant="h6" gutterBottom>Execution Data</Typography>
              <Box>Workflow execution data will appear here.</Box>
            </Box>
          )}
          
          {activeExecutionTab === 3 && (
            <Box sx={{ flex: 1, padding: 2 }}>
              <Typography variant="h6" gutterBottom>Errors</Typography>
              <Box>No errors in the current execution.</Box>
            </Box>
          )}
        </Box>
      </Box>
      
      {/* Settings Panel */}
      <Drawer
        anchor="right"
        open={settingsOpen}
        onClose={toggleSettings}
        sx={{
          width: 350,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 350,
            boxSizing: 'border-box',
            borderLeft: '1px solid #e5e7eb',
            backgroundColor: 'white',
          },
        }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Settings</Typography>
          <IconButton onClick={toggleSettings} sx={{ color: '#6b7280' }}>×</IconButton>
        </Toolbar>
        <Divider />
        <Box sx={{ p: 2 }}>
          <Typography>Workflow settings will go here</Typography>
        </Box>
      </Drawer>
    </Box>
  );
};

export default WorkflowDesigner;