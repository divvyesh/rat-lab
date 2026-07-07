import { PersonalSociety, AuthorProfile, NetworkNode, Persona } from '../types';
import { generateAuthorProfile } from './authorProfileService';
import { InstagramAPI, SocialMediaConnection, calculateMutualConnections } from './socialMediaApi';
import { generatePersonasFromSocialMedia } from './personaDatabase';

/**
 * Create a personal society from Instagram data
 */
export async function createInstagramSociety(
  accessToken: string,
  onProgress?: (progress: number, message: string) => void
): Promise<PersonalSociety> {
  try {
    onProgress?.(10, 'Fetching Instagram profile...');
    
    const profile = await InstagramAPI.getProfile({ accessToken });
    
    onProgress?.(30, 'Fetching people who engage with your posts...');
    
    const engagers = await InstagramAPI.getEngagers({ accessToken }, 100);
    
    onProgress?.(50, 'Fetching your recent posts...');
    
    const posts = await InstagramAPI.getPosts({ accessToken }, 20);
    
    onProgress?.(60, 'Generating author profile...');
    
    const authorProfile = await generateAuthorProfile({
      platform: 'instagram',
      posts: posts,
      interactions: engagers.map(e => ({
        userId: e.id,
        type: 'engagement',
        count: e.engagementCount || 1
      }))
    });
    
    authorProfile.name = profile.name;
    authorProfile.username = profile.username;
    authorProfile.avatar = profile.avatar;
    authorProfile.postCount = profile.postCount;
    
    onProgress?.(70, 'Calculating mutual connections...');
    
    const mutuals = calculateMutualConnections(engagers);
    
    onProgress?.(80, 'Generating personas from connections...');
    
    const personas = await generatePersonasFromSocialMedia(engagers, 'instagram', mutuals);
    
    onProgress?.(90, 'Building network graph...');
    
    const network = buildNetworkFromConnections(engagers, personas, mutuals);
    
    onProgress?.(100, 'Complete!');
    
    const society: PersonalSociety = {
      id: `instagram-${Date.now()}`,
      type: 'instagram',
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
    console.error('Error creating Instagram society:', error);
    throw new Error(`Failed to create Instagram society: ${error.message}`);
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
      color: '#E4405F', // Instagram gradient color
      connections: mutualIds,
      attentionScore: conn.engagementCount || 0,
      actionScore: (conn.engagementCount || 0) * 10
    });
  });
  
  return nodes;
}
