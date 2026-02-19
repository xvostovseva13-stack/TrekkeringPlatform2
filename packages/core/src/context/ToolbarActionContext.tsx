import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ActionHandler = (color?: string) => void;

interface ToolbarActionContextType {
  onNoteClick: ActionHandler | null;
  setNoteAction: (handler: ActionHandler | null) => void;
}

const ToolbarActionContext = createContext<ToolbarActionContextType | undefined>(undefined);

export const ToolbarActionProvider = ({ children }: { children: ReactNode }) => {
  const [onNoteClick, setOnNoteClick] = useState<ActionHandler | null>(null);

  const setNoteAction = useCallback((handler: ActionHandler | null) => {
    setOnNoteClick(() => handler);
  }, []);

  return (
    <ToolbarActionContext.Provider value={{ onNoteClick, setNoteAction }}>
      {children}
    </ToolbarActionContext.Provider>
  );
};

export const useToolbarActions = () => {
  const context = useContext(ToolbarActionContext);
  if (!context) {
    throw new Error('useToolbarActions must be used within a ToolbarActionProvider');
  }
  return context;
};
