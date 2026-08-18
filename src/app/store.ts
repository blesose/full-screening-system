import { configureStore } from "@reduxjs/toolkit";

// A minimal reducer to satisfy Redux
const rootReducer = (state = {}) => state;

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;