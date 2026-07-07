import { Persona, NetworkNode } from '../types';

/**
 * Search persona database (mock implementation)
 * In production, this would query a real database of 1M+ personas
 */
export async function searchPersonaDatabase(description: string): Promise<{ personas: Persona[] }> {
  // Simulate database search delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock personas - in production, this would query a real database
  const mockPersonas: Persona[] = generateMockPersonas(description, 100);
  
  return { personas: mockPersonas };
}

import { Persona } from '../types';
import { SocialMediaConnection } from './socialMediaApi';
import { generateText } from './openaiApi';

/**
 * Create personas from network nodes (legacy - kept for backward compatibility)
 */
export async function createPersonasFromNetwork(
  network: NetworkNode[],
  source: 'linkedin' | 'twitter'
): Promise<Persona[]> {
  return network.map((node, index) => ({
    id: node.personaId,
    segmentId: `segment-${source}`,
    name: `Persona ${index + 1}`,
    age: 25 + Math.floor(Math.random() * 30),
    occupation: getRandomOccupation(),
    location: getRandomLocation(),
    psychographics: getRandomPsychographics(),
    spendingHabits: getRandomSpendingHabits(),
    bio: `A ${source === 'linkedin' ? 'professional' : 'social media'} user with interests in technology and innovation.`,
    traits: {
      riskAversion: Math.floor(Math.random() * 100),
      lossAversion: Math.floor(Math.random() * 100),
      priceSensitivity: Math.floor(Math.random() * 100),
      cognitiveReflection: Math.floor(Math.random() * 100),
      socialConformity: Math.floor(Math.random() * 100),
      noveltySeeking: Math.floor(Math.random() * 100)
    },
    avatarId: Math.floor(Math.random() * 10)
  }));
}

/**
 * Generate personas from real social media connections
 * Uses AI to extract persona details from bio, engagement patterns, etc.
 */
export async function generatePersonasFromSocialMedia(
  connections: SocialMediaConnection[],
  platform: 'linkedin' | 'twitter' | 'instagram' | 'facebook',
  mutuals: Map<string, string[]>
): Promise<Persona[]> {
  const personas: Persona[] = [];
  
  // Process in batches to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < connections.length; i += batchSize) {
    const batch = connections.slice(i, i + batchSize);
    
    // Generate personas for this batch
    const batchPersonas = await Promise.all(
      batch.map(conn => generatePersonaFromConnection(conn, platform, mutuals))
    );
    
    personas.push(...batchPersonas);
  }
  
  return personas;
}

/**
 * Generate a single persona from a social media connection
 */
async function generatePersonaFromConnection(
  connection: SocialMediaConnection,
  platform: string,
  mutuals: Map<string, string[]>
): Promise<Persona> {
  try {
    // Use AI to extract persona details from bio and profile data
    const prompt = `Based on this ${platform} profile, create a detailed persona:

Name: ${connection.name}
Username: ${connection.username || 'N/A'}
Bio: ${connection.bio || 'No bio available'}
Location: ${connection.location || 'Unknown'}
Occupation: ${connection.occupation || 'Unknown'}
Follower Count: ${connection.followerCount || 0}
Engagement Count: ${connection.engagementCount || 0}
Mutual Connections: ${(mutuals.get(connection.id) || []).length}

Generate a realistic persona with:
- Age (estimate from bio/occupation)
- Detailed occupation (extract from bio if available)
- Location (use provided or infer from bio)
- Psychographics (personality traits based on bio)
- Spending habits (infer from follower count and engagement)
- Bio (expand the provided bio into 3-4 sentences)
- Behavioral traits (risk aversion, loss aversion, price sensitivity, cognitive reflection, social conformity, novelty seeking) - estimate 0-100 for each

Return JSON:
{
  "age": number,
  "occupation": "string",
  "location": "string",
  "psychographics": "string",
  "spendingHabits": "string",
  "bio": "string (3-4 sentences)",
  "traits": {
    "riskAversion": number (0-100),
    "lossAversion": number (0-100),
    "priceSensitivity": number (0-100),
    "cognitiveReflection": number (0-100),
    "socialConformity": number (0-100),
    "noveltySeeking": number (0-100)
  }
}`;

    const response = await generateText(
      'gpt-4-turbo-preview',
      prompt,
      'You are a behavioral researcher creating personas from social media profiles. Be realistic and data-driven.',
      true, // JSON mode
      0.7
    );

    const parsed = JSON.parse(response);
    
    return {
      id: connection.id,
      segmentId: `segment-${platform}`,
      name: connection.name,
      age: parsed.age || 30,
      occupation: parsed.occupation || connection.occupation || getRandomOccupation(),
      location: parsed.location || connection.location || getRandomLocation(),
      psychographics: parsed.psychographics || getRandomPsychographics(),
      spendingHabits: parsed.spendingHabits || getRandomSpendingHabits(),
      bio: parsed.bio || connection.bio || `A ${platform} user with interests in technology and innovation.`,
      traits: parsed.traits || {
        riskAversion: Math.floor(Math.random() * 100),
        lossAversion: Math.floor(Math.random() * 100),
        priceSensitivity: Math.floor(Math.random() * 100),
        cognitiveReflection: Math.floor(Math.random() * 100),
        socialConformity: Math.floor(Math.random() * 100),
        noveltySeeking: Math.floor(Math.random() * 100)
      },
      avatarId: Math.floor(Math.random() * 1000),
      groundingAssumption: `Based on ${platform} profile: ${connection.bio || 'No bio available'}`
    };
  } catch (error) {
    console.warn(`Failed to generate persona from ${connection.name}, using fallback:`, error);
    
    // Fallback: Create basic persona from available data
    return {
      id: connection.id,
      segmentId: `segment-${platform}`,
      name: connection.name,
      age: 25 + Math.floor(Math.random() * 30),
      occupation: connection.occupation || getRandomOccupation(),
      location: connection.location || getRandomLocation(),
      psychographics: getRandomPsychographics(),
      spendingHabits: getRandomSpendingHabits(),
      bio: connection.bio || `A ${platform} user with interests in technology and innovation.`,
      traits: {
        riskAversion: Math.floor(Math.random() * 100),
        lossAversion: Math.floor(Math.random() * 100),
        priceSensitivity: Math.floor(Math.random() * 100),
        cognitiveReflection: Math.floor(Math.random() * 100),
        socialConformity: Math.floor(Math.random() * 100),
        noveltySeeking: Math.floor(Math.random() * 100)
      },
      avatarId: Math.floor(Math.random() * 1000)
    };
  }
}

/**
 * Generate mock personas based on description
 */
function generateMockPersonas(description: string, count: number): Persona[] {
  const personas: Persona[] = [];
  const descriptionLower = description.toLowerCase();
  
  // Determine persona characteristics based on description
  const isInvestor = descriptionLower.includes('investor') || descriptionLower.includes('vc');
  const isFounder = descriptionLower.includes('founder') || descriptionLower.includes('startup');
  const isProfessional = descriptionLower.includes('professional');
  const isTech = descriptionLower.includes('tech') || descriptionLower.includes('software');
  
  for (let i = 0; i < count; i++) {
    const age = isInvestor ? 35 + Math.floor(Math.random() * 20) : 25 + Math.floor(Math.random() * 30);
    
    personas.push({
      id: `persona-${i}-${Date.now()}`,
      segmentId: `segment-${i % 5}`,
      name: `Persona ${i + 1}`,
      age,
      occupation: isInvestor 
        ? getRandomInvestorRole()
        : isFounder 
        ? getRandomFounderRole()
        : isTech
        ? getRandomTechRole()
        : getRandomOccupation(),
      location: getLocationFromDescription(description),
      psychographics: getRandomPsychographics(),
      spendingHabits: getRandomSpendingHabits(),
      bio: generateBio(isInvestor, isFounder, isTech),
      traits: {
        riskAversion: isInvestor ? 30 + Math.floor(Math.random() * 40) : Math.floor(Math.random() * 100),
        lossAversion: Math.floor(Math.random() * 100),
        priceSensitivity: Math.floor(Math.random() * 100),
        cognitiveReflection: isInvestor ? 60 + Math.floor(Math.random() * 30) : Math.floor(Math.random() * 100),
        socialConformity: Math.floor(Math.random() * 100),
        noveltySeeking: isFounder ? 60 + Math.floor(Math.random() * 30) : Math.floor(Math.random() * 100)
      },
      avatarId: Math.floor(Math.random() * 10)
    });
  }
  
  return personas;
}

function getRandomOccupation(): string {
  const occupations = [
    'Software Engineer',
    'Product Manager',
    'Designer',
    'Marketing Manager',
    'Sales Representative',
    'Data Analyst',
    'Business Analyst',
    'Consultant'
  ];
  return occupations[Math.floor(Math.random() * occupations.length)];
}

function getRandomInvestorRole(): string {
  const roles = ['VC Partner', 'Principal', 'Associate', 'Angel Investor'];
  return roles[Math.floor(Math.random() * roles.length)];
}

function getRandomFounderRole(): string {
  const roles = ['CEO', 'CTO', 'Founder', 'Co-Founder'];
  return roles[Math.floor(Math.random() * roles.length)];
}

function getRandomTechRole(): string {
  const roles = ['Software Engineer', 'Product Manager', 'Engineering Manager', 'Tech Lead'];
  return roles[Math.floor(Math.random() * roles.length)];
}

function getRandomLocation(): string {
  const locations = [
    'San Francisco, CA',
    'New York, NY',
    'London, UK',
    'Boston, MA',
    'Seattle, WA',
    'Austin, TX',
    'Los Angeles, CA'
  ];
  return locations[Math.floor(Math.random() * locations.length)];
}

function getLocationFromDescription(description: string): string {
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
  return getRandomLocation();
}

function getRandomPsychographics(): string {
  const psychographics = [
    'Values innovation and efficiency',
    'Prioritizes work-life balance',
    'Driven by career advancement',
    'Seeks meaningful connections',
    'Values authenticity and transparency'
  ];
  return psychographics[Math.floor(Math.random() * psychographics.length)];
}

function getRandomSpendingHabits(): string {
  const habits = [
    'Moderate spender, values quality over quantity',
    'Selective spender, invests in premium products',
    'Budget-conscious, looks for deals',
    'Luxury-oriented, prefers high-end brands'
  ];
  return habits[Math.floor(Math.random() * habits.length)];
}

function generateBio(isInvestor: boolean, isFounder: boolean, isTech: boolean): string {
  if (isInvestor) {
    return 'Experienced investor focused on early-stage startups in technology and innovation.';
  }
  if (isFounder) {
    return 'Entrepreneur building innovative solutions in the tech space.';
  }
  if (isTech) {
    return 'Technology professional passionate about building great products.';
  }
  return 'Professional with diverse interests and experiences.';
}


