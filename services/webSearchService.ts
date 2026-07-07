import { Persona } from '../types';

/**
 * Search web for personas matching description
 * In production, this would use a web search API
 */
export async function searchWebForPersonas(
  description: string,
  maxResults: number = 50
): Promise<Persona[]> {
  // Simulate web search delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock web search results - in production, would use actual web search API
  const personas: Persona[] = [];
  
  for (let i = 0; i < maxResults; i++) {
    personas.push({
      id: `web-persona-${i}-${Date.now()}`,
      segmentId: `web-segment-${i % 5}`,
      name: `Web Persona ${i + 1}`,
      age: 25 + Math.floor(Math.random() * 30),
      occupation: extractOccupationFromDescription(description) || 'Professional',
      location: extractLocationFromDescription(description) || 'San Francisco, CA',
      psychographics: 'Values innovation and professional growth',
      spendingHabits: 'Moderate spender, values quality',
      bio: `Professional found through web search matching: ${description.substring(0, 50)}...`,
      traits: {
        riskAversion: Math.floor(Math.random() * 100),
        lossAversion: Math.floor(Math.random() * 100),
        priceSensitivity: Math.floor(Math.random() * 100),
        cognitiveReflection: Math.floor(Math.random() * 100),
        socialConformity: Math.floor(Math.random() * 100),
        noveltySeeking: Math.floor(Math.random() * 100)
      },
      avatarId: Math.floor(Math.random() * 10)
    });
  }
  
  return personas;
}

/**
 * Extract occupation from description
 */
function extractOccupationFromDescription(description: string): string | null {
  const descriptionLower = description.toLowerCase();
  
  if (descriptionLower.includes('investor') || descriptionLower.includes('vc')) {
    return 'VC Partner';
  }
  if (descriptionLower.includes('founder')) {
    return 'Founder';
  }
  if (descriptionLower.includes('engineer')) {
    return 'Software Engineer';
  }
  if (descriptionLower.includes('manager')) {
    return 'Product Manager';
  }
  if (descriptionLower.includes('professional')) {
    return 'Professional';
  }
  
  return null;
}

/**
 * Extract location from description
 */
function extractLocationFromDescription(description: string): string | null {
  const descriptionLower = description.toLowerCase();
  
  if (descriptionLower.includes('sf') || descriptionLower.includes('san francisco')) {
    return 'San Francisco, CA';
  }
  if (descriptionLower.includes('nyc') || descriptionLower.includes('new york')) {
    return 'New York, NY';
  }
  if (descriptionLower.includes('london')) {
    return 'London, UK';
  }
  if (descriptionLower.includes('boston')) {
    return 'Boston, MA';
  }
  if (descriptionLower.includes('seattle')) {
    return 'Seattle, WA';
  }
  
  return null;
}


