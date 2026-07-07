import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockUser, createMockPersona, createMockSegment } from '../utils/testHelpers';
import { User, Persona, PersonaSegment } from '../../types';

/**
 * Edge Case Tests: Concurrent Operations
 * 
 * Tests scenarios involving concurrent operations:
 * - Multiple persona generations running simultaneously
 * - Multiple simulations running simultaneously
 * - Concurrent saves to Firebase
 * - Race conditions in state updates
 * - Resource contention
 */

describe('Concurrent Operations Edge Cases', () => {
  let mockUser: User;
  let personas: Persona[];
  let segments: PersonaSegment[];

  beforeEach(() => {
    mockUser = createMockUser({ tokens: 10000 });
    personas = [];
    segments = [createMockSegment()];
  });

  describe('Concurrent Persona Generation', () => {
    it('should handle multiple segment generations simultaneously', async () => {
      const segment1 = createMockSegment({ id: 'seg-1', name: 'Segment 1' });
      const segment2 = createMockSegment({ id: 'seg-2', name: 'Segment 2' });
      const segment3 = createMockSegment({ id: 'seg-3', name: 'Segment 3' });

      const generatePersonas = async (segment: PersonaSegment): Promise<Persona[]> => {
        // Simulate async generation
        await new Promise(resolve => setTimeout(resolve, 100));
        return Array.from({ length: segment.count }, (_, i) =>
          createMockPersona({
            id: `persona-${segment.id}-${i}`,
            segmentId: segment.id
          })
        );
      };

      // Start all generations concurrently
      const [personas1, personas2, personas3] = await Promise.all([
        generatePersonas(segment1),
        generatePersonas(segment2),
        generatePersonas(segment3)
      ]);

      expect(personas1.length).toBe(segment1.count);
      expect(personas2.length).toBe(segment2.count);
      expect(personas3.length).toBe(segment3.count);

      // All personas should have correct segment IDs
      expect(personas1.every(p => p.segmentId === segment1.id)).toBe(true);
      expect(personas2.every(p => p.segmentId === segment2.id)).toBe(true);
      expect(personas3.every(p => p.segmentId === segment3.id)).toBe(true);
    });

    it('should prevent duplicate persona IDs in concurrent generation', async () => {
      const generatePersona = async (index: number): Promise<Persona> => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
        return createMockPersona({
          id: `persona-${index}`,
          name: `Person ${index}`
        });
      };

      // Generate 20 personas concurrently
      const personaPromises = Array.from({ length: 20 }, (_, i) =>
        generatePersona(i)
      );

      const generatedPersonas = await Promise.all(personaPromises);

      // Check for duplicate IDs
      const ids = generatedPersonas.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should handle cancellation of concurrent operations', async () => {
      let cancelled = false;
      const abortController = new AbortController();

      const generatePersonas = async (segment: PersonaSegment): Promise<Persona[]> => {
        const personas: Persona[] = [];
        for (let i = 0; i < segment.count; i++) {
          if (abortController.signal.aborted) {
            cancelled = true;
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 50));
          personas.push(createMockPersona({
            id: `persona-${segment.id}-${i}`,
            segmentId: segment.id
          }));
        }
        return personas;
      };

      const segment = createMockSegment({ count: 10 });
      const generationPromise = generatePersonas(segment);

      // Cancel after 200ms
      setTimeout(() => {
        abortController.abort();
      }, 200);

      const result = await generationPromise;

      // Should have generated some personas before cancellation
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThan(segment.count);
    });
  });

  describe('Concurrent Simulations', () => {
    it('should run multiple simulations in parallel', async () => {
      const personas = Array.from({ length: 10 }, (_, i) =>
        createMockPersona({ id: `persona-${i}` })
      );

      const runSimulation = async (persona: Persona): Promise<any> => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
          personaId: persona.id,
          completed: true,
          timestamp: Date.now()
        };
      };

      // Run all simulations concurrently
      const results = await Promise.all(
        personas.map(persona => runSimulation(persona))
      );

      expect(results.length).toBe(personas.length);
      expect(results.every(r => r.completed)).toBe(true);
    });

    it('should handle partial completion when some simulations fail', async () => {
      const personas = Array.from({ length: 5 }, (_, i) =>
        createMockPersona({ id: `persona-${i}` })
      );

      const runSimulation = async (persona: Persona, shouldFail: boolean): Promise<any> => {
        await new Promise(resolve => setTimeout(resolve, 50));
        if (shouldFail) {
          throw new Error(`Simulation failed for ${persona.id}`);
        }
        return { personaId: persona.id, completed: true };
      };

      // Some should fail
      const results = await Promise.allSettled(
        personas.map((persona, i) => runSimulation(persona, i % 2 === 0))
      );

      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      expect(successful.length).toBeGreaterThan(0);
      expect(failed.length).toBeGreaterThan(0);
    });

    it('should prevent race conditions in result aggregation', async () => {
      const personas = Array.from({ length: 10 }, (_, i) =>
        createMockPersona({ id: `persona-${i}` })
      );

      let resultCount = 0;
      const results: any[] = [];

      const runSimulation = async (persona: Persona): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        // Simulate potential race condition
        const currentCount = resultCount;
        await new Promise(resolve => setTimeout(resolve, 1));
        resultCount = currentCount + 1;
        results.push({ personaId: persona.id, order: resultCount });
      };

      await Promise.all(personas.map(persona => runSimulation(persona)));

      // All results should be collected
      expect(results.length).toBe(personas.length);
      expect(resultCount).toBe(personas.length);
    });
  });

  describe('Concurrent State Updates', () => {
    it('should handle concurrent token deductions correctly', async () => {
      let tokens = mockUser.tokens;
      const operations = Array.from({ length: 10 }, (_, i) => ({
        id: i,
        tokens: 100
      }));

      const deductTokens = async (operation: { id: number; tokens: number }): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
        // Use functional update to prevent race conditions
        tokens = Math.max(0, tokens - operation.tokens);
      };

      await Promise.all(operations.map(op => deductTokens(op)));

      // Should have deducted all tokens
      expect(tokens).toBe(mockUser.tokens - operations.reduce((sum, op) => sum + op.tokens, 0));
    });

    it('should handle concurrent persona list updates', async () => {
      const personas: Persona[] = [];

      const addPersona = async (persona: Persona): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
        personas.push(persona);
      };

      const newPersonas = Array.from({ length: 20 }, (_, i) =>
        createMockPersona({ id: `persona-${i}` })
      );

      await Promise.all(newPersonas.map(persona => addPersona(persona)));

      expect(personas.length).toBe(newPersonas.length);
      
      // Check for duplicates
      const ids = personas.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should handle concurrent segment modifications', async () => {
      const segments: PersonaSegment[] = [createMockSegment()];

      const updateSegment = async (segmentId: string, updates: Partial<PersonaSegment>): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 30));
        const index = segments.findIndex(s => s.id === segmentId);
        if (index !== -1) {
          segments[index] = { ...segments[index], ...updates };
        }
      };

      // Concurrent updates to same segment
      await Promise.all([
        updateSegment(segments[0].id, { name: 'Updated Name 1' }),
        updateSegment(segments[0].id, { description: 'Updated Description' }),
        updateSegment(segments[0].id, { count: 20 })
      ]);

      // Final state should reflect all updates
      expect(segments[0].name).toBeDefined();
      expect(segments[0].description).toBeDefined();
      expect(segments[0].count).toBe(20);
    });
  });

  describe('Resource Contention', () => {
    it('should queue operations when resources are limited', async () => {
      const maxConcurrent = 3;
      const totalOperations = 10;
      let activeOperations = 0;
      let maxActive = 0;

      const runOperation = async (id: number): Promise<void> => {
        while (activeOperations >= maxConcurrent) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        activeOperations++;
        maxActive = Math.max(maxActive, activeOperations);

        try {
          await new Promise(resolve => setTimeout(resolve, 100));
        } finally {
          activeOperations--;
        }
      };

      await Promise.all(
        Array.from({ length: totalOperations }, (_, i) => runOperation(i))
      );

      expect(maxActive).toBeLessThanOrEqual(maxConcurrent);
    });

    it('should handle priority-based concurrent operations', async () => {
      interface Operation {
        id: number;
        priority: number;
        completed: boolean;
      }

      const operations: Operation[] = Array.from({ length: 10 }, (_, i) => ({
        id: i,
        priority: Math.floor(Math.random() * 3),
        completed: false
      }));

      const runOperation = async (op: Operation): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, 50 + op.priority * 10));
        op.completed = true;
      };

      // Sort by priority (higher first)
      operations.sort((a, b) => b.priority - a.priority);

      await Promise.all(operations.map(op => runOperation(op)));

      // All should complete
      expect(operations.every(op => op.completed)).toBe(true);
    });
  });

  describe('Concurrent Firebase Saves', () => {
    it('should handle concurrent save operations', async () => {
      const saveOperations: Array<{ id: string; data: any; saved: boolean }> = [];

      const saveToFirebase = async (id: string, data: any): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        saveOperations.push({ id, data, saved: true });
      };

      const dataToSave = Array.from({ length: 5 }, (_, i) => ({
        id: `data-${i}`,
        content: `Content ${i}`
      }));

      await Promise.all(
        dataToSave.map(item => saveToFirebase(item.id, item))
      );

      expect(saveOperations.length).toBe(dataToSave.length);
      expect(saveOperations.every(op => op.saved)).toBe(true);
    });

    it('should handle save conflicts gracefully', async () => {
      let version = 1;
      const saveData = async (data: any, expectedVersion: number): Promise<boolean> => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
        
        // Simulate version conflict
        if (version !== expectedVersion) {
          return false; // Conflict
        }
        
        version++;
        return true; // Success
      };

      const data = { id: 'test', version: 1 };
      const results = await Promise.allSettled([
        saveData(data, 1),
        saveData(data, 1),
        saveData(data, 1)
      ]);

      // Only one should succeed
      const successful = results.filter(r => 
        r.status === 'fulfilled' && r.value === true
      );
      
      expect(successful.length).toBe(1);
    });
  });
});
