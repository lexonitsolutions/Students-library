import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { WORKSPACE_KEY } from './useAuth';

export type Workspace = 'admin' | 'student';

interface WorkspaceContextValue {
  readonly workspace: Workspace | null;
  readonly chooseWorkspace: (workspace: Workspace) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

function readStoredWorkspace(): Workspace | null {
  const stored = sessionStorage.getItem(WORKSPACE_KEY);
  return stored === 'admin' || stored === 'student' ? stored : null;
}

export function WorkspaceProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [workspace, setWorkspace] = useState<Workspace | null>(readStoredWorkspace);

  const chooseWorkspace = useCallback((next: Workspace) => {
    sessionStorage.setItem(WORKSPACE_KEY, next);
    setWorkspace(next);
  }, []);

  return <WorkspaceContext.Provider value={{ workspace, chooseWorkspace }}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}
