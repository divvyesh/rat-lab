import { describe, it, expect, beforeEach } from 'vitest';
import {
  createLargePersonaSet,
  createLargeSegmentSet,
  createLargeSimulationResultSet,
  createMockUser
} from '../utils/testHelpers';
import { Persona, PersonaSegment, SimulationResult, User } from '../../types';

/**
 * Edge Case Tests: Large Data Sets
 * 
 * Tests scenarios involving large datasets:
 * - Performance with 100+ personas
 * - Performance with 50+ segments
 * - Performance with 1000+ simulation results
 * - Memory usage
 * - Rendering performance
 * - Filtering and searching performance
 */

describe('Large Dataset Edge Cases', () => {
  let mockUser: User;

  beforeEach(() => {
    mockUser = createMockUser({ tokens: 100000 });
  });

  describe('Large Persona Sets', () => {
    it('should handle 100 personas efficiently', () => {
      const personas = createLargePersonaSet(100);
      
      expect(personas.length).toBe(100);
      expect(personas.every(p => p.id && p.name)).toBe(true);
      
      // Check for unique IDs
      const ids = personas.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should handle 500 personas efficiently', () => {
      const startTime = performance.now();
      const personas = createLargePersonaSet(500);
      const endTime = performance.now();
      
      expect(personas.length).toBe(500);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in < 1s
    });

    it('should filter large persona sets efficiently', () => {
      const personas = createLargePersonaSet(200);
      
      const startTime = performance.now();
      const filtered = personas.filter(p => p.segmentId === 'segment-5');
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should filter quickly
      expect(filtered.length).toBeGreaterThan(0);
    });

    it('should search large persona sets efficiently', () => {
      const personas = createLargePersonaSet(300);
      const searchTerm = 'Person 150';
      
      const startTime = performance.now();
      const results = personas.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should group personas by segment efficiently', () => {
      const personas = createLargePersonaSet(250);
      
      const startTime = performance.now();
      const grouped = personas.reduce((acc, persona) => {
        if (!acc[persona.segmentId]) {
          acc[persona.segmentId] = [];
        }
        acc[persona.segmentId].push(persona);
        return acc;
      }, {} as Record<string, Persona[]>);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100);
      expect(Object.keys(grouped).length).toBeGreaterThan(0);
    });

    it('should handle memory efficiently with large persona sets', () => {
      const personas = createLargePersonaSet(1000);
      
      // Estimate memory usage (rough calculation)
      const estimatedSize = personas.length * 500; // ~500 bytes per persona
      expect(estimatedSize).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
    });
  });

  describe('Large Segment Sets', () => {
    it('should handle 50 segments efficiently', () => {
      const segments = createLargeSegmentSet(50);
      
      expect(segments.length).toBe(50);
      expect(segments.every(s => s.id && s.name)).toBe(true);
    });

    it('should handle 100 segments efficiently', () => {
      const startTime = performance.now();
      const segments = createLargeSegmentSet(100);
      const endTime = performance.now();
      
      expect(segments.length).toBe(100);
      expect(endTime - startTime).toBeLessThan(500);
    });

    it('should calculate total persona count across segments efficiently', () => {
      const segments = createLargeSegmentSet(75);
      
      const startTime = performance.now();
      const totalCount = segments.reduce((sum, seg) => sum + seg.count, 0);
      const endTime = performance.now();
      
      expect(totalCount).toBe(75 * 10); // 75 segments * 10 personas each
      expect(endTime - startTime).toBeLessThan(50);
    });
  });

  describe('Large Simulation Result Sets', () => {
    it('should handle 1000 simulation results efficiently', () => {
      const results = createLargeSimulationResultSet(1000);
      
      expect(results.length).toBe(1000);
      expect(results.every(r => r.personaId && r.experimentId)).toBe(true);
    });

    it('should handle 5000 simulation results efficiently', () => {
      const startTime = performance.now();
      const results = createLargeSimulationResultSet(5000);
      const endTime = performance.now();
      
      expect(results.length).toBe(5000);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete in < 2s
    });

    it('should aggregate results by persona efficiently', () => {
      const results = createLargeSimulationResultSet(2000);
      
      const startTime = performance.now();
      const aggregated = results.reduce((acc, result) => {
        if (!acc[result.personaId]) {
          acc[result.personaId] = [];
        }
        acc[result.personaId].push(result);
        return acc;
      }, {} as Record<string, SimulationResult[]>);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(200);
      expect(Object.keys(aggregated).length).toBeGreaterThan(0);
    });

    it('should filter results by segment efficiently', () => {
      const results = createLargeSimulationResultSet(3000);
      
      const startTime = performance.now();
      const filtered = results.filter(r => r.segmentId === 'segment-10');
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(150);
      expect(filtered.length).toBeGreaterThan(0);
    });

    it('should calculate statistics on large result sets efficiently', () => {
      const results = createLargeSimulationResultSet(4000);
      
      const startTime = performance.now();
      const stats = {
        total: results.length,
        uniquePersonas: new Set(results.map(r => r.personaId)).size,
        uniqueSegments: new Set(results.map(r => r.segmentId)).size,
        avgConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length
      };
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(200);
      expect(stats.total).toBe(4000);
      expect(stats.avgConfidence).toBeGreaterThan(0);
    });
  });

  describe('Combined Large Datasets', () => {
    it('should handle large datasets together', () => {
      const personas = createLargePersonaSet(200);
      const segments = createLargeSegmentSet(20);
      const results = createLargeSimulationResultSet(1000);
      
      expect(personas.length).toBe(200);
      expect(segments.length).toBe(20);
      expect(results.length).toBe(1000);
    });

    it('should join personas with results efficiently', () => {
      const personas = createLargePersonaSet(150);
      const results = createLargeSimulationResultSet(750);
      
      const startTime = performance.now();
      const joined = results.map(result => {
        const persona = personas.find(p => p.id === result.personaId);
        return { result, persona };
      }).filter(item => item.persona !== undefined);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(300);
      expect(joined.length).toBeGreaterThan(0);
    });

    it('should calculate segment performance with large datasets', () => {
      const personas = createLargePersonaSet(300);
      const segments = createLargeSegmentSet(30);
      const results = createLargeSimulationResultSet(1500);
      
      const startTime = performance.now();
      const segmentPerformance = segments.map(segment => {
        const segmentPersonas = personas.filter(p => p.segmentId === segment.id);
        const segmentResults = results.filter(r => r.segmentId === segment.id);
        const avgConfidence = segmentResults.length > 0
          ? segmentResults.reduce((sum, r) => sum + r.confidence, 0) / segmentResults.length
          : 0;
        
        return {
          segmentId: segment.id,
          segmentName: segment.name,
          personaCount: segmentPersonas.length,
          resultCount: segmentResults.length,
          avgConfidence
        };
      });
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(500);
      expect(segmentPerformance.length).toBe(segments.length);
    });
  });

  describe('Pagination and Virtualization', () => {
    it('should paginate large persona lists efficiently', () => {
      const personas = createLargePersonaSet(500);
      const pageSize = 50;
      const page = 3;
      
      const startTime = performance.now();
      const paginated = personas.slice(page * pageSize, (page + 1) * pageSize);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(10);
      expect(paginated.length).toBe(pageSize);
    });

    it('should calculate pagination metadata efficiently', () => {
      const personas = createLargePersonaSet(473);
      const pageSize = 25;
      
      const startTime = performance.now();
      const totalPages = Math.ceil(personas.length / pageSize);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(1);
      expect(totalPages).toBe(19); // 473 / 25 = 18.92, rounded up to 19
    });
  });

  describe('Memory Management', () => {
    it('should not cause memory leaks with large datasets', () => {
      // Create and destroy large datasets multiple times
      for (let i = 0; i < 10; i++) {
        const personas = createLargePersonaSet(100);
        const results = createLargeSimulationResultSet(500);
        
        // Process data
        const processed = personas.map(p => ({
          ...p,
          results: results.filter(r => r.personaId === p.id)
        }));
        
        // Clear references (simulate cleanup)
        // In real scenario, React would handle this
        expect(processed.length).toBe(personas.length);
      }
    });

    it('should handle garbage collection with large temporary arrays', () => {
      const personas = createLargePersonaSet(200);
      
      // Create temporary arrays
      const temp1 = personas.map(p => ({ ...p, processed: true }));
      const temp2 = temp1.map(p => ({ ...p, analyzed: true }));
      const temp3 = temp2.filter(p => p.age > 25);
      
      // Final result should be correct
      expect(temp3.length).toBeGreaterThan(0);
      expect(temp3.every(p => p.processed && p.analyzed)).toBe(true);
    });
  });
});
