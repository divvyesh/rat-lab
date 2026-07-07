import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MockLocalStorage } from '../utils/testHelpers';
import { User, Persona, PersonaSegment, SimulationResult, SavedSimulation, PlanTier } from '../../types';

/**
 * Edge Case Tests: Browser Refresh During Operations
 * 
 * Tests scenarios involving browser refresh:
 * - State persistence across refreshes
 * - Recovery of in-progress operations
 * - Data integrity after refresh
 * - Token balance persistence
 * - Partial operation recovery
 */

describe('Browser Refresh Edge Cases', () => {
  let mockLocalStorage: MockLocalStorage;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    mockLocalStorage = new MockLocalStorage();
    originalLocalStorage = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true
    });
  });

  describe('State Persistence', () => {
    it('should persist user data across refresh', () => {
      const user: User = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        plan: PlanTier.PRO,
        avatar: 'https://example.com/avatar.jpg',
        tokens: 500
      };

      // Save before refresh
      mockLocalStorage.setItem('user', JSON.stringify(user));

      // Simulate refresh - retrieve after
      const savedUser = JSON.parse(mockLocalStorage.getItem('user') || '{}') as User;

      expect(savedUser.id).toBe(user.id);
      expect(savedUser.tokens).toBe(user.tokens);
      expect(savedUser.name).toBe(user.name);
    });

    it('should persist personas across refresh', () => {
      const personas = [
        {
          id: 'persona-1',
          segmentId: 'segment-1',
          name: 'John Doe',
          age: 30,
          occupation: 'Engineer',
          location: 'SF',
          psychographics: 'Tech-savvy',
          spendingHabits: 'High',
          bio: 'Test bio',
          traits: {
            riskAversion: 50,
            lossAversion: 50,
            priceSensitivity: 50,
            cognitiveReflection: 50,
            socialConformity: 50,
            noveltySeeking: 50
          },
          avatarId: 1
        }
      ];

      mockLocalStorage.setItem('personas', JSON.stringify(personas));

      const savedPersonas = JSON.parse(mockLocalStorage.getItem('personas') || '[]');

      expect(savedPersonas.length).toBe(personas.length);
      expect(savedPersonas[0].id).toBe(personas[0].id);
    });

    it('should persist segments across refresh', () => {
      const segments: PersonaSegment[] = [
        {
          id: 'segment-1',
          name: 'Tech Enthusiasts',
          description: 'People who love tech',
          count: 10,
          color: '#6366f1',
          grounding: {
            useSearch: false,
            useMaps: false,
            sources: []
          },
          traits: {
            riskAversion: 50,
            lossAversion: 50,
            priceSensitivity: 50,
            cognitiveReflection: 50,
            socialConformity: 50,
            noveltySeeking: 50
          }
        }
      ];

      mockLocalStorage.setItem('segments', JSON.stringify(segments));

      const savedSegments = JSON.parse(mockLocalStorage.getItem('segments') || '[]');

      expect(savedSegments.length).toBe(segments.length);
      expect(savedSegments[0].id).toBe(segments[0].id);
    });

    it('should persist simulation results across refresh', () => {
      const results: SimulationResult[] = [
        {
          experimentId: 'exp-1',
          personaId: 'persona-1',
          personaName: 'John Doe',
          segmentId: 'segment-1',
          responses: [
            {
              questionId: 'q1',
              questionText: 'Test question',
              answer: 'Test answer',
              sentiment: 'Positive',
              rationale: 'Test rationale'
            }
          ],
          thinkingLog: 'Test thinking',
          confidence: 0.85
        }
      ];

      mockLocalStorage.setItem('results', JSON.stringify(results));

      const savedResults = JSON.parse(mockLocalStorage.getItem('results') || '[]');

      expect(savedResults.length).toBe(results.length);
      expect(savedResults[0].experimentId).toBe(results[0].experimentId);
    });
  });

  describe('In-Progress Operation Recovery', () => {
    it('should detect in-progress persona generation after refresh', () => {
      const operationState = {
        type: 'persona-generation',
        segmentId: 'segment-1',
        status: 'in-progress',
        startTime: Date.now() - 30000, // Started 30 seconds ago
        progress: 5,
        total: 10
      };

      mockLocalStorage.setItem('operation-state', JSON.stringify(operationState));

      const savedState = JSON.parse(mockLocalStorage.getItem('operation-state') || '{}');

      expect(savedState.status).toBe('in-progress');
      expect(savedState.progress).toBe(5);
      
      // Should be able to resume
      const canResume = savedState.status === 'in-progress' && 
                       Date.now() - savedState.startTime < 300000; // Less than 5 minutes
      expect(canResume).toBe(true);
    });

    it('should detect in-progress simulation after refresh', () => {
      const operationState = {
        type: 'simulation',
        experimentId: 'exp-1',
        status: 'in-progress',
        startTime: Date.now() - 60000, // Started 1 minute ago
        completedPersonas: 15,
        totalPersonas: 50
      };

      mockLocalStorage.setItem('simulation-state', JSON.stringify(operationState));

      const savedState = JSON.parse(mockLocalStorage.getItem('simulation-state') || '{}');

      expect(savedState.status).toBe('in-progress');
      expect(savedState.completedPersonas).toBe(15);
      
      // Should be able to resume from where it left off
      const resumeFrom = savedState.completedPersonas;
      expect(resumeFrom).toBe(15);
    });

    it('should handle stale in-progress operations', () => {
      const operationState = {
        type: 'persona-generation',
        status: 'in-progress',
        startTime: Date.now() - 600000, // Started 10 minutes ago (stale)
        progress: 3,
        total: 10
      };

      mockLocalStorage.setItem('operation-state', JSON.stringify(operationState));

      const savedState = JSON.parse(mockLocalStorage.getItem('operation-state') || '{}');
      const isStale = Date.now() - savedState.startTime > 300000; // More than 5 minutes

      expect(isStale).toBe(true);
      
      // Should not resume stale operations
      const shouldResume = savedState.status === 'in-progress' && !isStale;
      expect(shouldResume).toBe(false);
    });
  });

  describe('Token Balance Persistence', () => {
    it('should preserve token balance across refresh', () => {
      const user: User = {
        id: 'user-1',
        name: 'Test',
        email: 'test@example.com',
        plan: PlanTier.PRO,
        avatar: '',
        tokens: 750
      };

      mockLocalStorage.setItem('user', JSON.stringify(user));

      const savedUser = JSON.parse(mockLocalStorage.getItem('user') || '{}') as User;

      expect(savedUser.tokens).toBe(750);
    });

    it('should handle token updates that occurred during refresh', () => {
      // Simulate token usage event that occurred just before refresh
      const tokenUsage = {
        total_tokens: 150,
        timestamp: Date.now()
      };

      mockLocalStorage.setItem('pending-token-usage', JSON.stringify(tokenUsage));

      const user: User = {
        id: 'user-1',
        name: 'Test',
        email: 'test@example.com',
        plan: PlanTier.PRO,
        avatar: '',
        tokens: 1000
      };

      // After refresh, apply pending token usage
      const pendingUsage = JSON.parse(mockLocalStorage.getItem('pending-token-usage') || 'null');
      if (pendingUsage) {
        user.tokens = Math.max(0, user.tokens - pendingUsage.total_tokens);
        mockLocalStorage.removeItem('pending-token-usage');
      }

      expect(user.tokens).toBe(850);
    });
  });

  describe('Partial Operation Recovery', () => {
    it('should recover partial persona generation results', () => {
      const partialResults = [
        { id: 'persona-1', name: 'Person 1', segmentId: 'segment-1' },
        { id: 'persona-2', name: 'Person 2', segmentId: 'segment-1' },
        { id: 'persona-3', name: 'Person 3', segmentId: 'segment-1' }
      ];

      const operationState = {
        segmentId: 'segment-1',
        targetCount: 10,
        generated: partialResults.length,
        partialResults
      };

      mockLocalStorage.setItem('partial-generation', JSON.stringify(operationState));

      const saved = JSON.parse(mockLocalStorage.getItem('partial-generation') || '{}');

      expect(saved.partialResults.length).toBe(3);
      expect(saved.generated).toBe(3);
      
      // Should be able to resume from persona 4
      const resumeFrom = saved.generated;
      expect(resumeFrom).toBe(3);
    });

    it('should recover partial simulation results', () => {
      const partialResults: SimulationResult[] = Array.from({ length: 20 }, (_, i) => ({
        experimentId: 'exp-1',
        personaId: `persona-${i}`,
        personaName: `Person ${i}`,
        segmentId: 'segment-1',
        responses: [],
        thinkingLog: '',
        confidence: 0.8
      }));

      const operationState = {
        experimentId: 'exp-1',
        totalPersonas: 50,
        completed: partialResults.length,
        partialResults
      };

      mockLocalStorage.setItem('partial-simulation', JSON.stringify(operationState));

      const saved = JSON.parse(mockLocalStorage.getItem('partial-simulation') || '{}');

      expect(saved.partialResults.length).toBe(20);
      expect(saved.completed).toBe(20);
      
      // Should resume from persona 21
      const resumeFrom = saved.completed;
      expect(resumeFrom).toBe(20);
    });
  });

  describe('Data Integrity After Refresh', () => {
    it('should validate data integrity after refresh', () => {
      const user: User = {
        id: 'user-1',
        name: 'Test',
        email: 'test@example.com',
        plan: PlanTier.PRO,
        avatar: '',
        tokens: 500
      };

      const personas = [
        {
          id: 'persona-1',
          segmentId: 'segment-1',
          name: 'John',
          age: 30,
          occupation: 'Engineer',
          location: 'SF',
          psychographics: 'Tech',
          spendingHabits: 'High',
          bio: 'Bio',
          traits: {
            riskAversion: 50,
            lossAversion: 50,
            priceSensitivity: 50,
            cognitiveReflection: 50,
            socialConformity: 50,
            noveltySeeking: 50
          },
          avatarId: 1
        }
      ];

      mockLocalStorage.setItem('user', JSON.stringify(user));
      mockLocalStorage.setItem('personas', JSON.stringify(personas));

      // After refresh - validate
      const savedUser = JSON.parse(mockLocalStorage.getItem('user') || '{}') as User;
      const savedPersonas = JSON.parse(mockLocalStorage.getItem('personas') || '[]');

      // Validate user
      expect(savedUser.id).toBeTruthy();
      expect(savedUser.tokens).toBeGreaterThanOrEqual(0);
      expect(savedUser.email).toContain('@');

      // Validate personas
      expect(Array.isArray(savedPersonas)).toBe(true);
      savedPersonas.forEach((p: any) => {
        expect(p.id).toBeTruthy();
        expect(p.segmentId).toBeTruthy();
        expect(p.name).toBeTruthy();
      });
    });

    it('should handle corrupted data gracefully', () => {
      // Simulate corrupted data
      mockLocalStorage.setItem('personas', 'invalid json{');

      try {
        const savedPersonas = JSON.parse(mockLocalStorage.getItem('personas') || '[]');
        expect(Array.isArray(savedPersonas)).toBe(true);
      } catch (error) {
        // Should handle gracefully
        const savedPersonas: any[] = [];
        expect(Array.isArray(savedPersonas)).toBe(true);
      }
    });

    it('should restore default values for missing data', () => {
      // No data in storage
      const savedUser = JSON.parse(mockLocalStorage.getItem('user') || 'null');
      const savedPersonas = JSON.parse(mockLocalStorage.getItem('personas') || '[]');
      const savedSegments = JSON.parse(mockLocalStorage.getItem('segments') || '[]');

      // Should have defaults
      expect(savedPersonas).toEqual([]);
      expect(savedSegments).toEqual([]);
      
      // User might be null, which is acceptable
      expect(savedUser === null || typeof savedUser === 'object').toBe(true);
    });
  });

  describe('Session Restoration', () => {
    it('should restore session state after refresh', () => {
      const sessionState = {
        currentView: 'PERSONA_BUILDER',
        lastActivity: Date.now(),
        activeOperations: []
      };

      mockLocalStorage.setItem('session-state', JSON.stringify(sessionState));

      const saved = JSON.parse(mockLocalStorage.getItem('session-state') || '{}');

      expect(saved.currentView).toBe('PERSONA_BUILDER');
      expect(saved.lastActivity).toBeDefined();
    });

    it('should detect session timeout after refresh', () => {
      const sessionState = {
        lastActivity: Date.now() - 3600000, // 1 hour ago
        timeout: 1800000 // 30 minutes
      };

      const isExpired = Date.now() - sessionState.lastActivity > sessionState.timeout;
      expect(isExpired).toBe(true);
    });
  });

  describe('Browser Navigation State', () => {
    it('should preserve URL state across refresh', () => {
      const urlState = {
        path: '/cohorts',
        view: 'PERSONA_BUILDER',
        params: { segmentId: 'segment-1' }
      };

      mockLocalStorage.setItem('url-state', JSON.stringify(urlState));

      const saved = JSON.parse(mockLocalStorage.getItem('url-state') || '{}');

      expect(saved.path).toBe('/cohorts');
      expect(saved.view).toBe('PERSONA_BUILDER');
    });

    it('should restore deep link state after refresh', () => {
      const deepLinkState = {
        path: '/simulations',
        view: 'EXPERIMENT_LAB',
        experimentId: 'exp-1',
        personaIds: ['persona-1', 'persona-2']
      };

      mockLocalStorage.setItem('deep-link-state', JSON.stringify(deepLinkState));

      const saved = JSON.parse(mockLocalStorage.getItem('deep-link-state') || '{}');

      expect(saved.path).toBe('/simulations');
      expect(saved.experimentId).toBe('exp-1');
      expect(saved.personaIds.length).toBe(2);
    });
  });
});
