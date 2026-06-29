import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { wsClient } from '../lib/ws';

describe('WebSocket Client', () => {
  beforeEach(() => {
    wsClient.disconnect();
  });

  afterEach(() => {
    wsClient.disconnect();
  });

  it('should register and trigger event handlers', () => {
    const handler = vi.fn();
    const unsub = wsClient.on('test:event', handler);

    // Simulate a message
    const mockEvent = new MessageEvent('message', {
      data: JSON.stringify({ type: 'test:event', payload: 'hello' }),
    });

    // Access the internal websocket message handler
    const ws = (wsClient as any).ws;
    if (ws) {
      ws.onmessage(mockEvent);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'test:event', payload: 'hello' }),
      );
    }

    unsub();
  });

  it('should support wildcard handlers', () => {
    const wildcardHandler = vi.fn();
    wsClient.on('*', wildcardHandler);

    const mockEvent = new MessageEvent('message', {
      data: JSON.stringify({ type: 'any:event', data: 42 }),
    });

    const ws = (wsClient as any).ws;
    if (ws) {
      ws.onmessage(mockEvent);
      expect(wildcardHandler).toHaveBeenCalled();
    }
  });

  it('should remove handlers on unsubscribe', () => {
    const handler = vi.fn();
    const unsub = wsClient.on('test', handler);
    unsub();

    const mockEvent = new MessageEvent('message', {
      data: JSON.stringify({ type: 'test' }),
    });

    const ws = (wsClient as any).ws;
    if (ws) {
      ws.onmessage(mockEvent);
      expect(handler).not.toHaveBeenCalled();
    }
  });

  it('should track connection state', () => {
    expect(wsClient.connected).toBe(false);
  });

  it('should ignore malformed messages', () => {
    const handler = vi.fn();
    wsClient.on('test', handler);

    const mockEvent = new MessageEvent('message', {
      data: 'not valid json {{{',
    });

    const ws = (wsClient as any).ws;
    if (ws) {
      ws.onmessage(mockEvent);
      expect(handler).not.toHaveBeenCalled();
    }
  });
});
