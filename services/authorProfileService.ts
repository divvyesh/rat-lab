import { AuthorProfile } from '../types';

interface ProfileGenerationInput {
  platform: 'linkedin' | 'twitter' | 'instagram' | 'facebook';
  posts: any[];
  interactions?: any[];
}

/**
 * Generate author profile from social media data
 */
export async function generateAuthorProfile(input: ProfileGenerationInput): Promise<AuthorProfile> {
  const { platform, posts, interactions } = input;
  
  // Analyze posts to extract tone of voice
  const toneOfVoice = analyzeToneOfVoice(posts);
  
  // Extract topics from posts
  const topics = extractTopics(posts);
  
  // Determine engagement style
  const engagementStyle = determineEngagementStyle(interactions || []);
  
  return {
    id: `author-${platform}-${Date.now()}`,
    userId: 'current-user', // Would be actual user ID in production
    platform,
    toneOfVoice,
    topics,
    engagementStyle,
    name: 'User', // Would be from profile data
    avatar: `https://ui-avatars.com/api/?name=User&background=6366f1&color=fff`
  };
}

/**
 * Analyze tone of voice from posts
 */
function analyzeToneOfVoice(posts: any[]): string {
  // Simple analysis - in production, would use NLP
  const allText = posts.map(p => p.text || '').join(' ');
  
  if (allText.includes('!') || allText.includes('🚀')) {
    return 'Enthusiastic and energetic';
  }
  if (allText.includes('?') || allText.toLowerCase().includes('think')) {
    return 'Thoughtful and questioning';
  }
  if (allText.toLowerCase().includes('excited') || allText.toLowerCase().includes('amazing')) {
    return 'Positive and optimistic';
  }
  
  return 'Professional and informative';
}

/**
 * Extract topics from posts
 */
function extractTopics(posts: any[]): string[] {
  const topics = new Set<string>();
  
  posts.forEach(post => {
    const text = (post.text || '').toLowerCase();
    
    if (text.includes('ai') || text.includes('artificial intelligence')) {
      topics.add('Artificial Intelligence');
    }
    if (text.includes('startup') || text.includes('entrepreneurship')) {
      topics.add('Startups');
    }
    if (text.includes('tech') || text.includes('technology')) {
      topics.add('Technology');
    }
    if (text.includes('product') || text.includes('development')) {
      topics.add('Product Development');
    }
    if (text.includes('design') || text.includes('ux')) {
      topics.add('Design');
    }
  });
  
  return Array.from(topics).slice(0, 5);
}

/**
 * Determine engagement style
 */
function determineEngagementStyle(interactions: any[]): string {
  if (interactions.length === 0) {
    return 'Low engagement';
  }
  
  const totalInteractions = interactions.reduce((sum, i) => sum + (i.count || 0), 0);
  
  if (totalInteractions > 100) {
    return 'Highly engaged community';
  }
  if (totalInteractions > 50) {
    return 'Moderately engaged';
  }
  
  return 'Selective engagement';
}


