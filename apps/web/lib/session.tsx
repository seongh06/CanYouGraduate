'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const SESSION_STORAGE_KEY = 'cyg_session_id';

interface SessionContextValue {
  sessionId: string | null;
  isReady: boolean;
  setSessionId: (id: string) => void;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionIdState] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setSessionIdState(localStorage.getItem(SESSION_STORAGE_KEY));
    setIsReady(true);
  }, []);

  const setSessionId = (id: string) => {
    localStorage.setItem(SESSION_STORAGE_KEY, id);
    setSessionIdState(id);
  };

  const clearSession = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setSessionIdState(null);
  };

  return (
    <SessionContext.Provider value={{ sessionId, isReady, setSessionId, clearSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
