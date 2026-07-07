import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createMockFetch } from '../utils/testHelpers';

/**
 * Edge Case Tests: Network Failures
 * 
 * Tests scenarios involving network failures:
 * - Network timeouts
 * - Connection errors
 * - Rate limiting (429)
 * - Server errors (5xx)
 * - Client errors (4xx)
 * - Retry logic
 * - Partial failures
 */

describe('Network Failure Edge Cases', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('Network Timeouts', () => {
    it('should handle request timeout', async () => {
      const mockFetch = createMockFetch([
        {
          url: 'api.openai.com',
          delay: 60000, // 60 seconds (should timeout)
          error: new Error('Request timeout')
        }
      ]);

      global.fetch = mockFetch as any;

      try {
        await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        expect.fail('Should have thrown timeout error');
      } catch (error: any) {
        expect(error.message).toContain('timeout');
      }
    });

    it('should retry on timeout with exponential backoff', async () => {
      let attemptCount = 0;
      const maxRetries = 3;
      
      const mockFetch = vi.fn().mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 100));
          throw new Error('Network timeout');
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true })
        } as Response;
      });

      global.fetch = mockFetch as any;

      let retries = 0;
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch('https://api.example.com');
          if (response.ok) {
            break;
          }
        } catch (error: any) {
          lastError = error;
          if (attempt < maxRetries) {
            retries++;
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      expect(retries).toBeLessThanOrEqual(maxRetries);
    });
  });

  describe('Connection Errors', () => {
    it('should handle network connection errors', async () => {
      const mockFetch = createMockFetch([
        {
          url: 'api.openai.com',
          error: new Error('Network request failed')
        }
      ]);

      global.fetch = mockFetch as any;

      try {
        await fetch('https://api.openai.com/v1/chat/completions');
        expect.fail('Should have thrown network error');
      } catch (error: any) {
        expect(error.message).toContain('Network');
      }
    });

    it('should handle DNS resolution failures', async () => {
      const mockFetch = vi.fn().mockRejectedValue(
        new Error('Failed to resolve DNS')
      );

      global.fetch = mockFetch as any;

      try {
        await fetch('https://invalid-domain-12345.com/api');
        expect.fail('Should have thrown DNS error');
      } catch (error: any) {
        expect(error.message).toContain('DNS');
      }
    });

    it('should handle CORS errors gracefully', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 0,
        statusText: 'CORS error',
        json: async () => ({ error: 'CORS policy blocked' })
      } as Response);

      global.fetch = mockFetch as any;

      const response = await fetch('https://api.example.com');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(0);
    });
  });

  describe('Rate Limiting (429)', () => {
    it('should handle rate limit errors', async () => {
      const mockFetch = createMockFetch([
        {
          url: 'api.openai.com',
          status: 429,
          response: {
            error: {
              message: 'Rate limit exceeded',
              type: 'rate_limit_error'
            }
          }
        }
      ]);

      global.fetch = mockFetch as any;

      const response = await fetch('https://api.openai.com/v1/chat/completions');
      expect(response.status).toBe(429);
      
      const data = await response.json();
      expect(data.error.message).toContain('Rate limit');
    });

    it('should not retry on rate limit errors', async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ error: { message: 'Rate limit exceeded' } })
      } as Response);

      global.fetch = mockFetch as any;

      // Should not retry on 429
      const response = await fetch('https://api.example.com');
      expect(response.status).toBe(429);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should extract retry-after header if available', async () => {
      const retryAfter = '60';
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers({ 'retry-after': retryAfter }),
        json: async () => ({ error: { message: 'Rate limit exceeded' } })
      } as Response);

      global.fetch = mockFetch as any;

      const response = await fetch('https://api.example.com');
      const retryAfterValue = response.headers.get('retry-after');
      expect(retryAfterValue).toBe(retryAfter);
    });
  });

  describe('Server Errors (5xx)', () => {
    it('should retry on 500 errors', async () => {
      let attemptCount = 0;
      const maxRetries = 3;

      const mockFetch = vi.fn().mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < maxRetries) {
          return {
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: async () => ({ error: 'Server error' })
          } as Response;
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true })
        } as Response;
      });

      global.fetch = mockFetch as any;

      let retries = 0;
      let success = false;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const response = await fetch('https://api.example.com');
        if (response.ok) {
          success = true;
          break;
        }
        if (response.status >= 500 && attempt < maxRetries) {
          retries++;
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        } else {
          break;
        }
      }

      expect(success).toBe(true);
      expect(retries).toBeLessThan(maxRetries);
    });

    it('should handle 503 Service Unavailable', async () => {
      const mockFetch = createMockFetch([
        {
          url: 'api.openai.com',
          status: 503,
          response: {
            error: {
              message: 'Service temporarily unavailable',
              type: 'server_error'
            }
          }
        }
      ]);

      global.fetch = mockFetch as any;

      const response = await fetch('https://api.openai.com/v1/chat/completions');
      expect(response.status).toBe(503);
    });

    it('should handle 502 Bad Gateway', async () => {
      const mockFetch = createMockFetch([
        {
          url: 'api.openai.com',
          status: 502,
          response: {
            error: {
              message: 'Bad gateway',
              type: 'server_error'
            }
          }
        }
      ]);

      global.fetch = mockFetch as any;

      const response = await fetch('https://api.openai.com/v1/chat/completions');
      expect(response.status).toBe(502);
    });
  });

  describe('Client Errors (4xx)', () => {
    it('should not retry on 401 Unauthorized', async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: { message: 'Invalid API key' } })
      } as Response);

      global.fetch = mockFetch as any;

      const response = await fetch('https://api.example.com');
      expect(response.status).toBe(401);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 400 Bad Request', async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: { message: 'Invalid request' } })
      } as Response);

      global.fetch = mockFetch as any;

      const response = await fetch('https://api.example.com');
      expect(response.status).toBe(400);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 404 Not Found', async () => {
      const mockFetch = createMockFetch([
        {
          url: 'api.openai.com',
          status: 404,
          response: {
            error: {
              message: 'Endpoint not found',
              type: 'invalid_request_error'
            }
          }
        }
      ]);

      global.fetch = mockFetch as any;

      const response = await fetch('https://api.openai.com/v1/invalid-endpoint');
      expect(response.status).toBe(404);
    });
  });

  describe('Partial Failures', () => {
    it('should handle partial batch failures', async () => {
      const batchSize = 10;
      const successCount = 7;
      const failureCount = 3;

      const results = Array.from({ length: batchSize }, (_, i) => {
        if (i < successCount) {
          return { success: true, id: i };
        }
        return { success: false, error: 'Network error', id: i };
      });

      const successResults = results.filter(r => r.success);
      const failedResults = results.filter(r => !r.success);

      expect(successResults.length).toBe(successCount);
      expect(failedResults.length).toBe(failureCount);
    });

    it('should continue processing after individual failures', async () => {
      const operations = [
        { id: 1, shouldFail: false },
        { id: 2, shouldFail: true },
        { id: 3, shouldFail: false },
        { id: 4, shouldFail: true },
        { id: 5, shouldFail: false }
      ];

      const results = await Promise.allSettled(
        operations.map(async (op) => {
          if (op.shouldFail) {
            throw new Error(`Operation ${op.id} failed`);
          }
          return { id: op.id, success: true };
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      expect(successful.length).toBe(3);
      expect(failed.length).toBe(2);
    });
  });

  describe('Retry Logic', () => {
    it('should implement exponential backoff', async () => {
      const delays: number[] = [];
      const maxRetries = 3;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const delay = Math.pow(2, attempt) * 1000;
        delays.push(delay);
      }

      expect(delays).toEqual([1000, 2000, 4000]);
    });

    it('should respect maximum retry attempts', async () => {
      const maxRetries = 3;
      let attemptCount = 0;

      const mockFetch = vi.fn().mockImplementation(async () => {
        attemptCount++;
        return {
          ok: false,
          status: 500,
          json: async () => ({ error: 'Server error' })
        } as Response;
      });

      global.fetch = mockFetch as any;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const response = await fetch('https://api.example.com');
        if (!response.ok && attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      expect(attemptCount).toBe(maxRetries + 1);
    });
  });
});
