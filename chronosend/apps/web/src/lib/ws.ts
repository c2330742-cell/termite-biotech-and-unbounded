import { getAccessToken } from './auth';

type EventHandler = (data: Record<string, unknown>) => void;

class WsClient {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<EventHandler>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30000;
  private shouldReconnect = false;

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) return;
    this.isConnecting = true;
    this.shouldReconnect = true;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = import.meta.env.VITE_WS_URL || `${wsProtocol}//${window.location.host}/ws`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      const token = getAccessToken();
      if (token) {
        this.ws?.send(JSON.stringify({ type: 'auth', token }));
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const type = data.type as string;
        const typeHandlers = this.handlers.get(type);
        if (typeHandlers) {
          typeHandlers.forEach((handler) => handler(data));
        }
        const wildcardHandlers = this.handlers.get('*');
        if (wildcardHandlers) {
          wildcardHandlers.forEach((handler) => handler(data));
        }
      } catch {
        // Ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      this.isConnecting = false;
      this.ws = null;
      if (this.shouldReconnect) {
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), this.maxReconnectDelay);
        this.reconnectAttempts++;
        this.reconnectTimer = setTimeout(() => this.connect(), delay);
      }
    };

    this.ws.onerror = () => {
      this.isConnecting = false;
    };
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
    this.reconnectAttempts = 0;
  }

  on(event: string, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsClient = new WsClient();
