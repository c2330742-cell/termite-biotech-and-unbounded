import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { verifyAccessToken } from './auth';
import { WS_EVENTS } from '@chronosend/shared';

interface AuthenticatedSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

export class WsManager {
  private wss: WebSocketServer;
  // Map of userId -> Set of sockets (user may have multiple tabs)
  private userSockets = new Map<string, Set<AuthenticatedSocket>>();
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setup();
  }

  private setup(): void {
    this.wss.on('connection', (ws: AuthenticatedSocket, req) => {
      ws.isAlive = true;

      // Client must authenticate within 10 seconds
      const authTimeout = setTimeout(() => {
        if (!ws.userId) {
          ws.close(4001, 'Authentication timeout');
        }
      }, 10000);

      ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.type === 'auth' && msg.token) {
            try {
              const payload = verifyAccessToken(msg.token);
              ws.userId = payload.userId;
              clearTimeout(authTimeout);

              // Add to user's socket set
              if (!this.userSockets.has(payload.userId)) {
                this.userSockets.set(payload.userId, new Set());
              }
              this.userSockets.get(payload.userId)!.add(ws);

              ws.send(JSON.stringify({ type: 'auth:ok', userId: payload.userId }));
            } catch {
              ws.close(4001, 'Invalid token');
            }
          }
        } catch {
          // Ignore malformed messages
        }
      });

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('close', () => {
        if (ws.userId) {
          const sockets = this.userSockets.get(ws.userId);
          if (sockets) {
            sockets.delete(ws);
            if (sockets.size === 0) {
              this.userSockets.delete(ws.userId);
            }
          }
        }
      });
    });

    // Ping/pong keep-alive every 30 seconds
    this.pingInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        const client = ws as AuthenticatedSocket;
        if (client.isAlive === false) {
          return client.terminate();
        }
        client.isAlive = false;
        client.ping();
      });
    }, 30000);

    this.wss.on('close', () => {
      if (this.pingInterval) clearInterval(this.pingInterval);
    });
  }

  sendToUser(userId: string, event: Record<string, unknown>): void {
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;
    const payload = JSON.stringify(event);
    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }

  sendMessageSent(userId: string, messageId: string, platform: string, recipient: string): void {
    this.sendToUser(userId, {
      type: WS_EVENTS.MESSAGE_SENT,
      messageId,
      platform,
      recipient,
      sentAt: new Date().toISOString(),
    });
  }

  sendMessageFailed(userId: string, messageId: string, platform: string, reason: string): void {
    this.sendToUser(userId, {
      type: WS_EVENTS.MESSAGE_FAILED,
      messageId,
      platform,
      reason,
    });
  }

  sendMessageMissed(userId: string, messageId: string, scheduledAt: string): void {
    this.sendToUser(userId, {
      type: WS_EVENTS.MESSAGE_MISSED,
      messageId,
      scheduledAt,
    });
  }

  sendQueueUpdated(userId: string, pending: number): void {
    this.sendToUser(userId, {
      type: WS_EVENTS.QUEUE_UPDATED,
      pending,
    });
  }

  broadcast(event: Record<string, unknown>): void {
    const payload = JSON.stringify(event);
    this.wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    });
  }

  get connectedClients(): number {
    return this.wss.clients.size;
  }
}

let wsManagerInstance: WsManager | null = null;

export function initWsManager(server: HttpServer): WsManager {
  wsManagerInstance = new WsManager(server);
  return wsManagerInstance;
}

export function getWsManager(): WsManager {
  if (!wsManagerInstance) {
    throw new Error('WebSocket manager not initialized');
  }
  return wsManagerInstance;
}
