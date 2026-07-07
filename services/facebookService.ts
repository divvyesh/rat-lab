import { PersonalSociety, AuthorProfile, NetworkNode, Persona } from '../types';
import { generateAuthorProfile } from './authorProfileService';
import { FacebookAPI, SocialMediaConnection, calculateMutualConnections } from './socialMediaApi';
import { generatePersonasFromSocialMedia } from './personaDatabase';

/**
 * Create a personal society from Facebook data
 */
export async function createFacebookSociety(
  accessToken: string,
  onProgress?: (progress: number, message: string) => void
): Promise<PersonalSociety> {
  try {
    onProgress?.(10, 'Fetching Facebook profile...');
    
    const profile = await FacebookAPI.getProfile({ accessToken });
    
    onProgress?.(30, 'Fetching people who engage with your posts...');
    
    const engagers = await FacebookAPI.getEngagers({ accessToken }, 100);
    
    onProgress?.(50, 'Fetching your recent posts...');
    
    const posts = await FacebookAPI.getPosts({ accessToken }, 20);
    
    onProgress?.(60, 'Generating author profile...');
    
    const authorProfile = await generateAuthorProfile({
      platform: 'facebook',
      posts: posts,
      interactions: engagers.map(e => ({
        userId: e.id,
        type: 'engagement',
        count: e.engagementCount || 1
      }))
    });
    
    authorProfile.name = profile.name;
    authorProfile.avatar = profile.avatar;
    authorProfile.bio = profile.bio;
    
    onProgress?.(70, 'Calculating mutual connections...');
    
    const mutuals = calculateMutualConnections(engagers);
    
    onProgress?.(80, 'Generating personas from connections...');
    
    const personas = await generatePersonasFromSocialMedia(engagers, 'facebook', mutuals);
    
    onProgress?.(90, 'Building network graph...');
    
    const network = buildNetworkFromConnections(engagers, personas, mutuals);
    
    onProgress?.(100, 'Complete!');
    
    const society: PersonalSociety = {
      id: `facebook-${Date.now()}`,
      type: 'facebook',
      status: 'ready',
      progress: 100,
      authorProfile,
      network,
      personaIds: personas.map(p => p.id),
      accessToken,
      createdAt: new Date().toISOString()
    };
    
    return { society, personas };
  } catch (error: any) {
    console.error('Error creating Facebook society:', error);
    throw new Error(`Failed to create Facebook society: ${error.message}`);
  }
}

function buildNetworkFromConnections(
  connections: SocialMediaConnection[],
  personas: Persona[],
  mutuals: Map<string, string[]>
): NetworkNode[] {
  const nodes: NetworkNode[] = [];
  const personaMap = new Map(personas.map(p => [p.id, p]));
  
  connections.forEach((conn) => {
    const persona = personaMap.get(conn.id);
    if (!persona) return;
    
    const mutualIds = mutuals.get(conn.id) || [];
    
    nodes.push({
      id: `node-${conn.id}`,
      personaId: persona.id,
      x: 0,
      y: 0,
      size: Math.min((conn.followerCount || 100) / 100, 100),
      color: '#1877F2', // Facebook blue
      connections: mutualIds,
      attentionScore: conn.engagementCount || 0,
      actionScore: (conn.engagementCount || 0) * 10
    });
  });
  
  return nodes;
}
