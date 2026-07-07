import { PersonalSociety, AuthorProfile, NetworkNode, Persona } from '../types';
import { generateAuthorProfile } from './authorProfileService';
import { TwitterAPI, SocialMediaConnection, calculateMutualConnections } from './socialMediaApi';
import { generatePersonasFromSocialMedia } from './personaDatabase';

export interface CreateSocietyResult {
  society: PersonalSociety;
  personas: Persona[];
}

/**
 * Create a personal society from Twitter/X data
 * This function fetches real Twitter data and generates personas
 */
export async function createTwitterSociety(
  accessToken: string,
  onProgress?: (progress: number, message: string) => void
): Promise<CreateSocietyResult> {
  try {
    onProgress?.(10, 'Fetching Twitter profile...');
    
    // Step 1: Fetch user's Twitter profile
    const profile = await TwitterAPI.getProfile({ accessToken });
    
    onProgress?.(30, 'Fetching people who engage with your tweets...');
    
    // Step 2: Fetch people who engage with user's tweets (likes, retweets, replies)
    const engagers = await TwitterAPI.getEngagers({ accessToken }, 100);
    
    // If engagers are limited, also get followers
    if (engagers.length < 50) {
      onProgress?.(40, 'Fetching your followers...');
      const followers = await TwitterAPI.getFollowers({ accessToken }, 100);
      // Merge followers with engagers, prioritizing engagers
      const engagerIds = new Set(engagers.map(e => e.id));
      followers.forEach(f => {
        if (!engagerIds.has(f.id)) {
          engagers.push(f);
        }
      });
    }
    
    onProgress?.(50, 'Fetching your recent tweets...');
    
    // Step 3: Get user's recent tweets for author profile
    const tweets = await TwitterAPI.getTweets({ accessToken }, 20);
    
    onProgress?.(60, 'Generating author profile...');
    
    // Step 4: Generate author profile
    const authorProfile = await generateAuthorProfile({
      platform: 'twitter',
      posts: tweets,
      interactions: engagers.map(e => ({
        userId: e.id,
        type: 'engagement',
        count: e.engagementCount || 1
      }))
    });
    
    // Update author profile with real data
    authorProfile.name = profile.name;
    authorProfile.username = profile.username;
    authorProfile.avatar = profile.avatar;
    authorProfile.bio = profile.bio;
    authorProfile.followerCount = profile.followerCount;
    authorProfile.followingCount = profile.followingCount;
    authorProfile.postCount = profile.postCount;
    
    onProgress?.(70, 'Calculating mutual connections...');
    
    // Step 5: Calculate mutual connections (people who follow each other)
    const mutuals = calculateMutualConnections(engagers);
    
    onProgress?.(80, 'Generating personas from connections...');
    
    // Step 6: Generate personas from real social media data
    const personas = await generatePersonasFromSocialMedia(engagers, 'twitter', mutuals);
    
    onProgress?.(90, 'Building network graph...');
    
    // Step 7: Build network nodes
    const network = buildNetworkFromConnections(engagers, personas, mutuals);
    
    onProgress?.(100, 'Complete!');
    
    const society: PersonalSociety = {
      id: `twitter-${Date.now()}`,
      type: 'twitter',
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
    console.error('Error creating Twitter society:', error);
    throw new Error(`Failed to create Twitter society: ${error.message}`);
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
  
  connections.forEach((conn) => {
    const persona = personaMap.get(conn.id);
    if (!persona) return;
    
    // Get mutual connections for this node
    const mutualIds = mutuals.get(conn.id) || [];
    
    nodes.push({
      id: `node-${conn.id}`,
      personaId: persona.id,
      x: 0, // Will be calculated by D3.js layout
      y: 0, // Will be calculated by D3.js layout
      size: Math.min((conn.followerCount || 100) / 100, 100),
      color: '#1da1f2', // Twitter blue
      connections: mutualIds,
      attentionScore: conn.engagementCount || 0,
      actionScore: (conn.engagementCount || 0) * 10
    });
  });
  
  return nodes;
}


