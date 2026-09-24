import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface SignupRedirectContextValue {
  readonly redirectPath: string | null;
  readonly setRedirectPath: (path: string) => void;
  readonly clearRedirectPath: () => void;
  readonly getAndClearRedirectPath: () => string | null;
  readonly isSignupModalOpen: boolean;
  readonly openSignupModal: (targetPath?: string) => void;
  readonly closeSignupModal: () => void;
}

const SignupRedirectContext = createContext<SignupRedirectContextValue | undefined>(undefined);

const REDIRECT_KEY = 'quicklearnit.redirectAfterSignup';

export function SignupRedirectProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [redirectPath, setRedirectPathState] = useState<string | null>(() => {
    return sessionStorage.getItem(REDIRECT_KEY);
  });
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  const setRedirectPath = (path: string) => {
    sessionStorage.setItem(REDIRECT_KEY, path);
    setRedirectPathState(path);
  };

  const clearRedirectPath = () => {
    sessionStorage.removeItem(REDIRECT_KEY);
    setRedirectPathState(null);
  };

  const getAndClearRedirectPath = () => {
    const path = sessionStorage.getItem(REDIRECT_KEY);
    sessionStorage.removeItem(REDIRECT_KEY);
    setRedirectPathState(null);
    return path;
  };

  const openSignupModal = (targetPath?: string) => {
    if (targetPath) {
      setRedirectPath(targetPath);
    }
    setIsSignupModalOpen(true);
  };

  const closeSignupModal = () => {
    setIsSignupModalOpen(false);
  };

  const value = useMemo<SignupRedirectContextValue>(
    () => ({
      redirectPath,
      setRedirectPath,
      clearRedirectPath,
      getAndClearRedirectPath,
      isSignupModalOpen,
      openSignupModal,
      closeSignupModal,
    }),
    [redirectPath, isSignupModalOpen],
  );

  return (
    <SignupRedirectContext.Provider value={value}>
      {children}
    </SignupRedirectContext.Provider>
  );
}

export function useSignupRedirect(): SignupRedirectContextValue {
  const ctx = useContext(SignupRedirectContext);
  if (!ctx) {
    throw new Error('useSignupRedirect must be used within SignupRedirectProvider');
  }
  return ctx;
}
