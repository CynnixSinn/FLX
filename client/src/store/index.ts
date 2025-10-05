import { configureStore } from '@reduxjs/toolkit';
import workflowsReducer from './features/workflows/workflowsSlice';

export const store = configureStore({
  reducer: {
    workflows: workflowsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;