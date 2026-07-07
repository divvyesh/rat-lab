import { TargetSociety, Persona } from '../types';
import { searchPersonaDatabase } from './personaDatabase';
import { searchWebForPersonas } from './webSearchService';

/**
 * Create a target society from description
 */
export async function createTargetSociety(description: string): Promise<TargetSociety> {
  // Step 1: Search persona database
  const databaseMatches = await searchPersonaDatabase(description);
  
  // Step 2: If needed, search web for more personas
  let allPersonas = [...databaseMatches.personas];
  if (databaseMatches.personas.length < 50) {
    const webMatches = await searchWebForPersonas(description, 50 - databaseMatches.personas.length);
    allPersonas = [...allPersonas, ...webMatches];
  }
  
  // Step 3: Rank by suitability
  const rankedPersonas = rankPersonasBySuitability(allPersonas, description);
  
  // Step 4: Anonymize persona data
  const anonymizedPersonas = anonymizePersonas(rankedPersonas);
  
  // Step 5: Create society
  const name = extractNameFromDescription(description);
  
  return {
    id: `target-${Date.now()}`,
    name,
    description,
    isPrebuilt: false,
    personaIds: anonymizedPersonas.map(p => p.id),
    suitabilityScores: rankedPersonas.reduce((acc, p, index) => {
      acc[p.id] = 100 - index; // Higher score = better match
      return acc;
    }, {} as Record<string, number>),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Search personas for an existing society
 */
export async function searchPersonasForSociety(description: string): Promise<{ personaIds: string[] }> {
  const society = await createTargetSociety(description);
  return { personaIds: society.personaIds };
}

/**
 * Rank personas by suitability to description
 */
function rankPersonasBySuitability(personas: Persona[], description: string): Persona[] {
  const descriptionLower = description.toLowerCase();
  
  return personas.sort((a, b) => {
    const scoreA = calculateSuitabilityScore(a, descriptionLower);
    const scoreB = calculateSuitabilityScore(b, descriptionLower);
    return scoreB - scoreA; // Higher score first
  });
}

/**
 * Calculate suitability score for a persona
 */
function calculateSuitabilityScore(persona: Persona, description: string): number {
  let score = 0;
  
  // Check occupation match
  if (description.includes(persona.occupation.toLowerCase())) {
    score += 30;
  }
  
  // Check location match
  if (description.includes(persona.location.toLowerCase())) {
    score += 20;
  }
  
  // Check age-related keywords
  const ageKeywords = ['young', 'professional', 'experienced', 'senior'];
  ageKeywords.forEach(keyword => {
    if (description.includes(keyword)) {
      if (keyword === 'young' && persona.age < 35) score += 15;
      if (keyword === 'professional' && persona.age >= 25 && persona.age <= 45) score += 15;
      if (keyword === 'experienced' && persona.age > 40) score += 15;
      if (keyword === 'senior' && persona.age > 50) score += 15;
    }
  });
  
  // Check bio/psychographics match
  const bioLower = persona.bio.toLowerCase();
  const keywords = description.split(' ').filter(w => w.length > 4);
  keywords.forEach(keyword => {
    if (bioLower.includes(keyword.toLowerCase())) {
      score += 5;
    }
  });
  
  return score;
}

/**
 * Anonymize persona data for privacy
 */
function anonymizePersonas(personas: Persona[]): Persona[] {
  return personas.map((persona, index) => ({
    ...persona,
    id: `anon-${index}-${Date.now()}`,
    name: `Persona ${index + 1}`,
    // Keep other attributes but remove any identifying information
  }));
}

/**
 * Extract name from description
 */
function extractNameFromDescription(description: string): string {
  // Try to extract a meaningful name
  const words = description.split(' ');
  if (words.length >= 2) {
    return words.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  return 'Custom Sample Population';
}


