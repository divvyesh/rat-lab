import { PersonalSociety, AuthorProfile, NetworkNode, Persona } from '../types';
import { generateAuthorProfile } from './authorProfileService';
import { LinkedInAPI, SocialMediaConnection, calculateMutualConnections } from './socialMediaApi';
import { generatePersonasFromSocialMedia } from './personaDatabase';

export interface CreateSocietyResult {
  society: PersonalSociety;
  personas: Persona[];
}

/**
 * Create a personal society from LinkedIn data
 * This function fetches real LinkedIn data and generates personas
 */
export async function createPersonalSociety(
  accessToken: string,
  onProgress?: (progress: number, message: string) => void
): Promise<CreateSocietyResult> {
  try {
    onProgress?.(10, 'Fetching LinkedIn profile...');
    
    // Step 1: Fetch user's LinkedIn profile
    const profile = await LinkedInAPI.getProfile({ accessToken });
    
    onProgress?.(30, 'Fetching people who engage with your posts...');
    
    // Step 2: Fetch people who engage with user's posts (likes, comments, shares)
    const engagers = await LinkedInAPI.getEngagers({ accessToken }, 100);
    
    onProgress?.(50, 'Fetching your recent posts...');
    
    // Step 3: Get user's recent posts for author profile
    const posts = await LinkedInAPI.getPosts({ accessToken }, 20);
    
    onProgress?.(60, 'Generating author profile...');
    
    // Step 4: Generate author profile from posts and engagement
    const authorProfile = await generateAuthorProfile({
      platform: 'linkedin',
      posts: posts,
      interactions: engagers.map(e => ({
        userId: e.id,
        type: 'engagement',
        count: e.engagementCount || 1
      }))
    });
    
    // Update author profile with real data
    authorProfile.name = profile.name;
    authorProfile.avatar = profile.avatar;
    authorProfile.bio = profile.bio;
    authorProfile.followerCount = profile.followerCount;
    
    onProgress?.(70, 'Calculating mutual connections...');
    
    // Step 5: Calculate mutual connections
    const mutuals = calculateMutualConnections(engagers);
    
    onProgress?.(80, 'Generating personas from connections...');
    
    // Step 6: Generate personas from real social media data
    const personas = await generatePersonasFromSocialMedia(engagers, 'linkedin', mutuals);
    
    onProgress?.(90, 'Building network graph...');
    
    // Step 7: Build network nodes with positions for visualization
    const network = buildNetworkFromConnections(engagers, personas, mutuals);
    
    onProgress?.(100, 'Complete!');
    
    const society: PersonalSociety = {
      id: `linkedin-${Date.now()}`,
      type: 'linkedin',
      status: 'ready',
      progress: 100,
      authorProfile,
      network,
      personaIds: personas.map(p => p.id),
      accessToken, // Store for future API calls
      createdAt: new Date().toISOString()
    };
    
    return { society, personas };
  } catch (error: any) {
    console.error('Error creating LinkedIn society:', error);
    throw new Error(`Failed to create LinkedIn society: ${error.message}`);
  }
}

/**
 * Build network nodes from connections with mutual relationship data
 */
function buildNetworkFromConnections(
  connections: SocialMediaConnection[],
  personas: Persona[],
  mutuals: Map<string, string[]>
): NetworkNode[] {
  const nodes: NetworkNode[] = [];
  const personaMap = new Map(personas.map(p => [p.id, p]));
  
  connections.forEach((conn, index) => {
    const persona = personaMap.get(conn.id);
    if (!persona) return;
    
    // Get mutual connections for this node
    const mutualIds = mutuals.get(conn.id) || [];
    
    nodes.push({
      id: `node-${conn.id}`,
      personaId: persona.id,
      x: 0, // Will be calculated by D3.js layout
      y: 0, // Will be calculated by D3.js layout
      size: Math.min((conn.followerCount || 100) / 100, 100), // Normalize size
      color: '#0077b5', // LinkedIn blue
      connections: mutualIds, // Connections based on mutuals
      attentionScore: conn.engagementCount || 0,
      actionScore: (conn.engagementCount || 0) * 10
    });
  });
  
  return nodes;
}


