/**
 * Direct REST API client for Google Gemini API
 * Replaces @google/genai SDK for full control and independence
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export interface GenerateContentRequest {
  contents: Array<{
    parts: Array<{
      text?: string;
      inlineData?: {
        mimeType: string;
        data: string;
      };
    }>;
    role?: 'user' | 'model';
  }>;
  systemInstruction?: string;
  tools?: Array<{ googleSearch?: {} }>;
  responseMimeType?: string;
  responseSchema?: {
    type: string;
    items?: any;
    properties?: any;
  };
  thinkingConfig?: {
    thinkingBudget?: number;
  };
  responseModalities?: string[];
  speechConfig?: {
    voiceConfig?: {
      prebuiltVoiceConfig?: {
        voiceName: string;
      };
    };
  };
}

export interface GenerateContentResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }>;
    };
    groundingMetadata?: {
      groundingChunks?: Array<{
        web?: {
          title?: string;
          uri?: string;
          snippet?: string;
        };
      }>;
    };
  }>;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface ChatRequest {
  history?: ChatMessage[];
  message: string;
  systemInstruction?: string;
}

/**
 * Get API key from environment
 */
const getApiKey = (): string => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY is not set. Please add it to your .env.local file.');
  }
  return apiKey;
};

/**
 * Make authenticated request to Gemini API with retry logic
 */
const makeRequest = async <T>(
  endpoint: string,
  method: string = 'POST',
  body?: any,
  retries: number = 2
): Promise<T> => {
  const apiKey = getApiKey();
  const url = `${GEMINI_API_BASE}${endpoint}?key=${apiKey}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: { 
            message: response.statusText,
            code: response.status 
          } 
        }));
        
        // Don't retry on client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          const errorMsg = errorData.error?.message || response.statusText;
          if (response.status === 401) {
            throw new Error(`Invalid API key. Please check your VITE_GEMINI_API_KEY in .env.local`);
          } else if (response.status === 429) {
            throw new Error(`Rate limit exceeded. Please try again later.`);
          }
          throw new Error(`Gemini API error: ${errorMsg} (${response.status})`);
        }
        
        // Retry on server errors (5xx) or network errors
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        
        throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText} (${response.status})`);
      }

      return response.json();
    } catch (error: any) {
      // If it's a network error and we have retries left, retry
      if (error.name === 'TypeError' && error.message.includes('fetch') && attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
      
      // Re-throw if it's not a network error or we're out of retries
      throw error;
    }
  }
  
  throw new Error('Request failed after retries');
};

/**
 * Generate content using Gemini API
 */
export const generateContent = async (
  model: string,
  request: GenerateContentRequest
): Promise<GenerateContentResponse> => {
  if (!model || !model.trim()) {
    throw new Error('Model name is required');
  }
  
  if (!request.contents || request.contents.length === 0) {
    throw new Error('At least one content item is required');
  }
  
  const endpoint = `/models/${model}:generateContent`;
  return makeRequest<GenerateContentResponse>(endpoint, 'POST', request);
};

/**
 * Create and send chat message
 */
export const sendChatMessage = async (
  model: string,
  request: ChatRequest
): Promise<string> => {
  if (!request.message || !request.message.trim()) {
    throw new Error('Message is required');
  }
  
  // Convert chat history format
  const contents = [
    ...(request.history || []).map(msg => ({
      role: msg.role,
      parts: msg.parts,
    })),
    {
      role: 'user' as const,
      parts: [{ text: request.message }],
    },
  ];

  const body: GenerateContentRequest = {
    contents: contents as any,
    systemInstruction: request.systemInstruction,
  };

  const response = await generateContent(model, body);
  
  if (!response.candidates || response.candidates.length === 0) {
    throw new Error('No candidates returned from Gemini API');
  }
  
  const text = response.candidates[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error('No text response from Gemini API');
  }

  return text;
};

/**
 * Generate audio (TTS) using Gemini API
 */
export const generateAudio = async (
  model: string,
  text: string,
  voiceName: string = 'Kore'
): Promise<string> => {
  if (!text || !text.trim()) {
    throw new Error('Text is required for audio generation');
  }
  
  const request: GenerateContentRequest = {
    contents: [{
      parts: [{ text }],
    }],
    responseModalities: ['AUDIO'],
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName,
        },
      },
    },
  };

  const response = await generateContent(model, request);
  
  if (!response.candidates || response.candidates.length === 0) {
    throw new Error('No candidates returned from Gemini API for audio generation');
  }
  
  const audioData = response.candidates[0]?.content?.parts?.[0]?.inlineData?.data;
  
  if (!audioData) {
    throw new Error('No audio data returned from Gemini API');
  }

  return audioData;
};

