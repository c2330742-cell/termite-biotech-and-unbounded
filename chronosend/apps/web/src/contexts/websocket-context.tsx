import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { wsClient } from '../lib/ws';
import { useAuth } from './auth-context';
import { getAccessToken } from '../lib/auth';

interface WsContextType {
  on: (event: string, handler: (data: Record<string, unknown>) => void) => () => void;
  connected: boolean;
}

const WsContext = createContext<WsContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && getAccessToken()) {
      wsClient.connect();
    } else {
      wsClient.disconnect();
    }

    const interval = setInterval(() => {
      setConnected(wsClient.connected);
    }, 2000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const on = useCallback((event: string, handler: (data: Record<string, unknown>) => void) => {
    return wsClient.on(event, handler);
  }, []);

  return (
    <WsContext.Provider value={{ on, connected }}>
      {children}
    </WsContext.Provider>
  );
}

export function useWebSocket() {
  const ctx = useContext(WsContext);
  if (!ctx) throw new Error('useWebSocket must be used within WebSocketProvider');
  return ctx;
}
