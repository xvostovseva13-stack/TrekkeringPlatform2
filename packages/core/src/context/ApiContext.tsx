import { createContext, useContext, ReactNode } from 'react';
import { TrekkerAPI } from '../api/interface';
import { webAdapter } from '../api/web/adapter';
import { electronAdapter } from '../api/electron/adapter';

// Determine environment
const isElectron = 'electron' in window;

// Select adapter
const api = isElectron ? electronAdapter : webAdapter;

const ApiContext = createContext<TrekkerAPI>(api);

export const ApiProvider = ({ children }: { children: ReactNode }) => {
  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
};

export const useApi = () => useContext(ApiContext);
export const getApi = () => api; // For usage outside components
