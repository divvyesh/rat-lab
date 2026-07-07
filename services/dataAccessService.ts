import { SimulationResult, PersonaSegment, Persona } from '../types';

/**
 * Data Access Service for Doc Rat Analytics
 * Provides access to individual and aggregated persona datasets
 */

export interface IndividualPersonaData {
  personaId: string;
  personaName: string;
  segmentId: string;
  segmentName: string;
  responses: {
    questionId: string;
    questionText: string;
    answer: string;
    numericValue?: number;
    sentiment: 'Positive' | 'Neutral' | 'Negative';
  }[];
  traits: {
    riskAversion: number;
    lossAversion: number;
    priceSensitivity: number;
    cognitiveReflection: number;
    socialConformity: number;
    noveltySeeking: number;
  };
  confidence: number;
}

export interface AggregatedData {
  totalPersonas: number;
  segments: SegmentAggregation[];
  overallStats: {
    averageScore: number;
    sentimentBreakdown: {
      positive: number;
      neutral: number;
      negative: number;
    };
    responseCount: number;
  };
}

export interface SegmentAggregation {
  segmentId: string;
  segmentName: string;
  personaCount: number;
  averageScore: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  traitAverages: {
    riskAversion: number;
    lossAversion: number;
    priceSensitivity: number;
    cognitiveReflection: number;
    socialConformity: number;
    noveltySeeking: number;
  };
}

/**
 * Get individual persona datasets
 */
export function getIndividualPersonaData(
  results: SimulationResult[],
  segments: PersonaSegment[],
  personas: Persona[] = []
): IndividualPersonaData[] {
  return results.map(result => {
    const segment = segments.find(s => s.id === result.segmentId);
    const persona = personas.find(p => p.id === result.personaId);
    
    return {
      personaId: result.personaId,
      personaName: result.personaName,
      segmentId: result.segmentId,
      segmentName: segment?.name || 'Unknown',
      responses: result.responses,
      traits: persona?.traits || {
        riskAversion: 50,
        lossAversion: 50,
        priceSensitivity: 50,
        cognitiveReflection: 50,
        socialConformity: 50,
        noveltySeeking: 50
      },
      confidence: result.confidence
    };
  });
}

/**
 * Get aggregated dataset
 */
export function getAggregatedData(
  results: SimulationResult[],
  segments: PersonaSegment[],
  personas: Persona[] = []
): AggregatedData {
  const segmentMap = new Map<string, SimulationResult[]>();
  
  // Group results by segment
  results.forEach(result => {
    const segmentResults = segmentMap.get(result.segmentId) || [];
    segmentResults.push(result);
    segmentMap.set(result.segmentId, segmentResults);
  });
  
  // Calculate segment aggregations
  const segmentAggregations: SegmentAggregation[] = Array.from(segmentMap.entries()).map(([segmentId, segmentResults]) => {
    const segment = segments.find(s => s.id === segmentId);
    const segmentPersonas = personas.filter(p => segmentResults.some(r => r.personaId === p.id));
    
    // Calculate numeric values
    const numericValues = segmentResults.flatMap(r => 
      r.responses
        .filter(resp => resp.numericValue !== undefined && resp.numericValue !== null)
        .map(resp => resp.numericValue!)
    );
    
    const averageScore = numericValues.length > 0
      ? numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
      : 0;
    
    // Calculate sentiment breakdown
    const sentiments = segmentResults.flatMap(r => r.responses.map(resp => resp.sentiment));
    const sentimentBreakdown = {
      positive: sentiments.filter(s => s === 'Positive').length,
      neutral: sentiments.filter(s => s === 'Neutral').length,
      negative: sentiments.filter(s => s === 'Negative').length
    };
    
    // Calculate trait averages
    const traitAverages = segmentPersonas.length > 0
      ? {
          riskAversion: segmentPersonas.reduce((sum, p) => sum + p.traits.riskAversion, 0) / segmentPersonas.length,
          lossAversion: segmentPersonas.reduce((sum, p) => sum + p.traits.lossAversion, 0) / segmentPersonas.length,
          priceSensitivity: segmentPersonas.reduce((sum, p) => sum + p.traits.priceSensitivity, 0) / segmentPersonas.length,
          cognitiveReflection: segmentPersonas.reduce((sum, p) => sum + p.traits.cognitiveReflection, 0) / segmentPersonas.length,
          socialConformity: segmentPersonas.reduce((sum, p) => sum + p.traits.socialConformity, 0) / segmentPersonas.length,
          noveltySeeking: segmentPersonas.reduce((sum, p) => sum + p.traits.noveltySeeking, 0) / segmentPersonas.length
        }
      : {
          riskAversion: 50,
          lossAversion: 50,
          priceSensitivity: 50,
          cognitiveReflection: 50,
          socialConformity: 50,
          noveltySeeking: 50
        };
    
    return {
      segmentId,
      segmentName: segment?.name || 'Unknown',
      personaCount: segmentResults.length,
      averageScore,
      sentimentBreakdown,
      traitAverages
    };
  });
  
  // Calculate overall stats
  const allNumericValues = results.flatMap(r => 
    r.responses
      .filter(resp => resp.numericValue !== undefined && resp.numericValue !== null)
      .map(resp => resp.numericValue!)
  );
  
  const overallAverageScore = allNumericValues.length > 0
    ? allNumericValues.reduce((sum, val) => sum + val, 0) / allNumericValues.length
    : 0;
  
  const allSentiments = results.flatMap(r => r.responses.map(resp => resp.sentiment));
  const overallSentimentBreakdown = {
    positive: allSentiments.filter(s => s === 'Positive').length,
    neutral: allSentiments.filter(s => s === 'Neutral').length,
    negative: allSentiments.filter(s => s === 'Negative').length
  };
  
  return {
    totalPersonas: results.length,
    segments: segmentAggregations,
    overallStats: {
      averageScore: overallAverageScore,
      sentimentBreakdown: overallSentimentBreakdown,
      responseCount: results.reduce((sum, r) => sum + r.responses.length, 0)
    }
  };
}

/**
 * Filter individual data by criteria
 */
export function filterIndividualData(
  data: IndividualPersonaData[],
  filters: {
    segmentIds?: string[];
    personaIds?: string[];
    minConfidence?: number;
    questionIds?: string[];
  }
): IndividualPersonaData[] {
  return data.filter(item => {
    if (filters.segmentIds && !filters.segmentIds.includes(item.segmentId)) {
      return false;
    }
    if (filters.personaIds && !filters.personaIds.includes(item.personaId)) {
      return false;
    }
    if (filters.minConfidence && item.confidence < filters.minConfidence) {
      return false;
    }
    if (filters.questionIds) {
      const hasQuestion = item.responses.some(r => filters.questionIds!.includes(r.questionId));
      if (!hasQuestion) return false;
    }
    return true;
  });
}

/**
 * Extract numeric values from responses
 */
export function extractNumericValues(data: IndividualPersonaData[]): number[] {
  return data.flatMap(item => 
    item.responses
      .filter(resp => resp.numericValue !== undefined && resp.numericValue !== null)
      .map(resp => resp.numericValue!)
  );
}

/**
 * Extract text responses
 */
export function extractTextResponses(data: IndividualPersonaData[]): string[] {
  return data.flatMap(item => 
    item.responses
      .map(resp => resp.answer)
      .filter(answer => answer.trim().length > 0)
  );
}

