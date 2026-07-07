import { User, Persona, PersonaSegment, SimulationResult, Question, PlanTier } from '../../types';

/**
 * Test utilities for creating mock data and testing scenarios
 */

export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'test-user-1',
  name: 'Test User',
  email: 'test@example.com',
  plan: PlanTier.PRO,
  avatar: 'https://example.com/avatar.jpg',
  tokens: 1000,
  ...overrides
});

export const createMockPersona = (overrides?: Partial<Persona>): Persona => ({
  id: 'persona-1',
  segmentId: 'segment-1',
  name: 'John Doe',
  age: 30,
  occupation: 'Software Engineer',
  location: 'San Francisco, CA',
  psychographics: 'Tech-savvy, early adopter',
  spendingHabits: 'High spending on tech products',
  bio: 'A software engineer who loves technology',
  traits: {
    riskAversion: 50,
    lossAversion: 50,
    priceSensitivity: 50,
    cognitiveReflection: 50,
    socialConformity: 50,
    noveltySeeking: 50
  },
  avatarId: 1,
  ...overrides
});

export const createMockSegment = (overrides?: Partial<PersonaSegment>): PersonaSegment => ({
  id: 'segment-1',
  name: 'Tech Enthusiasts',
  description: 'People who love technology',
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
  },
  ...overrides
});

export const createMockSimulationResult = (overrides?: Partial<SimulationResult>): SimulationResult => ({
  experimentId: 'exp-1',
  personaId: 'persona-1',
  personaName: 'John Doe',
  segmentId: 'segment-1',
  responses: [
    {
      questionId: 'q1',
      questionText: 'How much do you trust this product?',
      answer: 'I trust it a lot',
      sentiment: 'Positive',
      rationale: 'Based on my experience'
    }
  ],
  thinkingLog: 'Thinking about the question...',
  confidence: 0.85,
  ...overrides
});

export const createMockQuestion = (overrides?: Partial<Question>): Question => ({
  id: 'q1',
  type: 'SHORT_ANSWER' as any,
  text: 'How much do you trust this product?',
  order: 1,
  ...overrides
});

/**
 * Create a large dataset for testing performance
 */
export const createLargePersonaSet = (count: number): Persona[] => {
  return Array.from({ length: count }, (_, i) => 
    createMockPersona({
      id: `persona-${i}`,
      name: `Person ${i}`,
      segmentId: `segment-${Math.floor(i / 10)}`
    })
  );
};

export const createLargeSegmentSet = (count: number): PersonaSegment[] => {
  return Array.from({ length: count }, (_, i) => 
    createMockSegment({
      id: `segment-${i}`,
      name: `Segment ${i}`,
      count: 10
    })
  );
};

export const createLargeSimulationResultSet = (count: number): SimulationResult[] => {
  return Array.from({ length: count }, (_, i) => 
    createMockSimulationResult({
      experimentId: `exp-${i}`,
      personaId: `persona-${i}`,
      personaName: `Person ${i}`
    })
  );
};

/**
 * Mock fetch with configurable responses
 */
export const createMockFetch = (responses: Array<{
  url?: string | RegExp;
  response: any;
  status?: number;
  delay?: number;
  error?: Error;
}>) => {
  return async (url: string, options?: RequestInit) => {
    // Find matching response
    const match = responses.find(r => {
      if (r.url instanceof RegExp) {
        return r.url.test(url);
      }
      return r.url === undefined || url.includes(r.url);
    });

    if (!match) {
      throw new Error(`No mock response for URL: ${url}`);
    }

    // Simulate delay
    if (match.delay) {
      await new Promise(resolve => setTimeout(resolve, match.delay));
    }

    // Simulate error
    if (match.error) {
      throw match.error;
    }

    // Return response
    return {
      ok: (match.status || 200) < 400,
      status: match.status || 200,
      statusText: match.status === 200 ? 'OK' : 'Error',
      json: async () => match.response,
      text: async () => JSON.stringify(match.response),
      headers: new Headers(),
    } as Response;
  };
};

/**
 * Wait for a condition to be true
 */
export const waitFor = async (
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
};

/**
 * Simulate token usage event
 */
export const simulateTokenUsage = (tokens: number) => {
  const event = new CustomEvent('openai-token-usage', {
    detail: {
      prompt_tokens: Math.floor(tokens * 0.6),
      completion_tokens: Math.floor(tokens * 0.4),
      total_tokens: tokens
    }
  });
  window.dispatchEvent(event);
};

/**
 * Mock localStorage with persistence simulation
 */
export class MockLocalStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  get length(): number {
    return Object.keys(this.store).length;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}
