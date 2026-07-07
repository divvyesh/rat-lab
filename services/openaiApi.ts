/**
 * Direct REST API client for OpenAI API
 * Replaces Gemini API for OpenAI integration
 */

const OPENAI_API_BASE = 'https://api.openai.com/v1';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: { url: string };
  }>;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  response_format?: { type: 'json_object' | 'text' };
  temperature?: number;
  max_tokens?: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Get API key from environment
 */
const getApiKey = (): string => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_OPENAI_API_KEY is not set. Please add it to your .env.local file.');
  }
  return apiKey;
};

/**
 * Make authenticated request to OpenAI API with retry logic
 */
const makeRequest = async <T>(
  endpoint: string,
  method: string = 'POST',
  body?: any,
  retries: number = 2
): Promise<T> => {
  const apiKey = getApiKey();
  const url = `${OPENAI_API_BASE}${endpoint}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
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
            throw new Error(`Invalid API key. Please check your VITE_OPENAI_API_KEY in .env.local`);
          } else if (response.status === 429) {
            throw new Error(`Rate limit exceeded. Please try again later.`);
          }
          throw new Error(`OpenAI API error: ${errorMsg} (${response.status})`);
        }
        
        // Retry on server errors (5xx) or network errors
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText} (${response.status})`);
      }

      return response.json();
    } catch (error: any) {
      // If it's a network error and we have retries left, retry
      if ((error.name === 'TypeError' || error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) && attempt < retries) {
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
 * Generate chat completion using OpenAI API
 */
export const createChatCompletion = async (
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> => {
  if (!request.model || !request.model.trim()) {
    throw new Error('Model name is required');
  }
  
  if (!request.messages || request.messages.length === 0) {
    throw new Error('At least one message is required');
  }
  
  const endpoint = '/chat/completions';
  return makeRequest<ChatCompletionResponse>(endpoint, 'POST', request);
};

/**
 * Generate text content with optional JSON mode
 */
export const generateText = async (
  model: string,
  prompt: string,
  systemInstruction?: string,
  jsonMode: boolean = false,
  temperature: number = 0.7,
  maxTokens?: number
): Promise<string> => {
  const messages: ChatMessage[] = [];
  
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  
  messages.push({ role: 'user', content: prompt });

  const request: ChatCompletionRequest = {
    model,
    messages,
    temperature,
    ...(maxTokens && { max_tokens: maxTokens }),
    ...(jsonMode && { response_format: { type: 'json_object' } }),
  };

  console.log(`🔵 OpenAI API Request:`, { 
    model, 
    jsonMode, 
    messageCount: messages.length,
    promptLength: prompt.length 
  });

  try {
    const response = await createChatCompletion(request);
    
    console.log(`🟢 OpenAI API Response received:`, {
      hasChoices: !!response.choices,
      choiceCount: response.choices?.length || 0,
      finishReason: response.choices?.[0]?.finish_reason
    });
    
    if (!response.choices || response.choices.length === 0) {
      throw new Error('No choices returned from OpenAI API');
    }
    
    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content returned from OpenAI API');
    }

    console.log(`✅ OpenAI API Content received (length: ${content.length})`);
    
    // Track token usage
    if (response.usage) {
      const tokenUsage = {
        prompt_tokens: response.usage.prompt_tokens || 0,
        completion_tokens: response.usage.completion_tokens || 0,
        total_tokens: response.usage.total_tokens || 0
      };
      console.log(`📊 Token usage:`, tokenUsage);
      
      // Store token usage in a custom event for tracking
      window.dispatchEvent(new CustomEvent('openai-token-usage', { 
        detail: tokenUsage 
      }));
    }
    
    return content;
  } catch (error: any) {
    console.error(`❌ OpenAI API Error:`, {
      message: error.message,
      stack: error.stack,
      model,
      jsonMode
    });
    throw error;
  }
};

/**
 * Generate chat completion with history
 */
export const createChat = async (
  model: string,
  history: Array<{role: string, content: string}>,
  message: string,
  systemInstruction?: string
): Promise<string> => {
  const messages: ChatMessage[] = [];
  
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  
  // Convert history format
  history.forEach(msg => {
    const role = msg.role === 'user' ? 'user' : msg.role === 'model' || msg.role === 'assistant' ? 'assistant' : 'user';
    messages.push({ role: role as 'user' | 'assistant', content: msg.content });
  });
  
  messages.push({ role: 'user', content: message });

  const request: ChatCompletionRequest = {
    model,
    messages,
  };

  const response = await createChatCompletion(request);
  const content = response.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content returned from OpenAI API');
  }

  return content;
};

/**
 * Generate content with vision (image analysis)
 */
export const generateVisionContent = async (
  model: string,
  imageBase64: string,
  prompt: string,
  systemInstruction?: string
): Promise<string> => {
  const messages: ChatMessage[] = [];
  
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  
  messages.push({
    role: 'user',
    content: [
      {
        type: 'image_url',
        image_url: {
          url: `data:image/png;base64,${imageBase64}`
        }
      },
      {
        type: 'text',
        text: prompt
      }
    ]
  });

  const request: ChatCompletionRequest = {
    model,
    messages,
  };

  const response = await createChatCompletion(request);
  const content = response.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content returned from OpenAI Vision API');
  }

  return content;
};

/**
 * Generate audio using browser Web Speech API
 * Note: This uses the browser's built-in TTS, which is free and client-side
 */
export const generateAudio = async (
  text: string,
  voiceName: string = 'default'
): Promise<string> => {
  // Check if browser supports Web Speech API
  if (!('speechSynthesis' in window)) {
    console.warn('Browser does not support Web Speech API');
    throw new Error('Text-to-speech not supported in this browser. Please use a modern browser.');
  }
  
  return new Promise((resolve, reject) => {
    try {
      // Create speech synthesis utterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure voice settings
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Try to select a good voice
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Prefer English voices, fallback to first available
        const preferredVoice = voices.find(v => 
          v.lang.startsWith('en') && v.name.includes('Female')
        ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
        
        utterance.voice = preferredVoice;
      }
      
      // Handle completion
      utterance.onend = () => {
        console.log('✅ Speech synthesis completed');
        resolve('completed'); // Return success indicator
      };
      
      utterance.onerror = (error) => {
        console.error('❌ Speech synthesis error:', error);
        reject(new Error('Speech synthesis failed'));
      };
      
      // Start speaking
      speechSynthesis.speak(utterance);
      
      // Return immediately - speech happens asynchronously
      resolve('speaking');
    } catch (error: any) {
      console.error('❌ TTS error:', error);
      reject(error);
    }
  });
};

