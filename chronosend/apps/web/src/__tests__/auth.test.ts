import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import after mock
import { login, register, logout, setAuth, clearAuth, getAccessToken, getStoredUser } from '../lib/auth';

describe('Auth Library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAuth();
    sessionStorage.clear();
  });

  describe('setAuth / getAccessToken / getStoredUser', () => {
    it('should store and retrieve auth state', () => {
      setAuth({
        accessToken: 'test-token',
        user: { id: '1', email: 'test@test.com', role: 'user' },
      });

      expect(getAccessToken()).toBe('test-token');
      expect(getStoredUser()?.email).toBe('test@test.com');
    });

    it('should clear auth state', () => {
      setAuth({
        accessToken: 'test-token',
        user: { id: '1', email: 'test@test.com', role: 'user' },
      });
      clearAuth();

      expect(getAccessToken()).toBeNull();
      expect(getStoredUser()).toBeNull();
    });
  });

  describe('login', () => {
    it('should call the login API and store tokens on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            accessToken: 'new-token',
            user: { id: '1', email: 'test@test.com', role: 'user' },
          },
        }),
      });

      const result = await login('test@test.com', 'Password1!');

      expect(result.success).toBe(true);
      expect(getAccessToken()).toBe('new-token');
      expect(getStoredUser()?.email).toBe('test@test.com');
    });

    it('should handle login failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Invalid credentials',
        }),
      });

      const result = await login('test@test.com', 'wrong');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
      expect(getAccessToken()).toBeNull();
    });
  });

  describe('register', () => {
    it('should call register API and store tokens on success', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: true,
          data: {
            accessToken: 'reg-token',
            user: { id: '2', email: 'new@test.com', role: 'user' },
          },
        }),
      });

      const result = await register('new@test.com', 'NewPass1!');

      expect(result.success).toBe(true);
      expect(getAccessToken()).toBe('reg-token');
    });
  });

  describe('logout', () => {
    it('should call logout API and clear auth', async () => {
      setAuth({
        accessToken: 'test-token',
        user: { id: '1', email: 'test@test.com', role: 'user' },
      });

      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true }),
      });

      await logout();

      expect(getAccessToken()).toBeNull();
      expect(getStoredUser()).toBeNull();
    });
  });
});
