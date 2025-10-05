import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Workflow } from '../../../../shared/types';

interface WorkflowsState {
  items: Workflow[];
  currentWorkflow: Workflow | null;
  loading: boolean;
  error: string | null;
}

const initialState: WorkflowsState = {
  items: [],
  currentWorkflow: null,
  loading: false,
  error: null,
};

const workflowsSlice = createSlice({
  name: 'workflows',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setWorkflows: (state, action: PayloadAction<Workflow[]>) => {
      state.items = action.payload;
    },
    setCurrentWorkflow: (state, action: PayloadAction<Workflow | null>) => {
      state.currentWorkflow = action.payload;
    },
    addWorkflow: (state, action: PayloadAction<Workflow>) => {
      state.items.push(action.payload);
    },
    updateWorkflow: (state, action: PayloadAction<Workflow>) => {
      const index = state.items.findIndex(w => w.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
      if (state.currentWorkflow?.id === action.payload.id) {
        state.currentWorkflow = action.payload;
      }
    },
    deleteWorkflow: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(w => w.id !== action.payload);
      if (state.currentWorkflow?.id === action.payload) {
        state.currentWorkflow = null;
      }
    },
  },
});

export const {
  setLoading,
  setError,
  setWorkflows,
  setCurrentWorkflow,
  addWorkflow,
  updateWorkflow,
  deleteWorkflow,
} = workflowsSlice.actions;

export default workflowsSlice.reducer;