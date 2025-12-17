
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { 
  Persona, SimulationResult, StudyType, Question, 
  AnalysisReport, PersonaSegment, Asset, TrainingFile, 
  GroundingSource, QuestionType, HypothesisResult, CopilotLength, CopilotTone 
} from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * PHASE 1: Web Retrieval & Source Generation
 */
export const fetchGroundingSources = async (brief: string): Promise<GroundingSource[]> => {
  const modelId = 'gemini-3-pro-preview';
  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Perform a deep research search for: "${brief}". Find market facts, competitor claims, and category norms.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              url: { type: Type.STRING },
              snippet: { type: Type.STRING },
              relevance: { type: Type.INTEGER }
            },
            required: ["title", "url", "snippet", "relevance"]
          }
        }
      }
    });

    // Extracting URLs from groundingMetadata as per rule
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const searchSources: GroundingSource[] = groundingChunks.map((chunk: any, i: number) => ({
      id: `src_${i}`,
      title: chunk.web?.title || `Source ${i}`,
      url: chunk.web?.uri || "",
      snippet: chunk.web?.snippet || "",
      relevance: 100 - i
    })).filter(s => s.url);

    // Fallback if structured tool data isn't returned but text is
    if (searchSources.length === 0) {
       const parsed = JSON.parse(response.text || "[]");
       return parsed.map((p: any, i: number) => ({ id: `src_${i}`, ...p }));
    }

    return searchSources;
  } catch (error) {
    console.error("Grounding failed", error);
    return [];
  }
};

/**
 * PHASE 2: Grounded Persona Generation
 */
export const generatePersonasBatch = async (
  segment: PersonaSegment,
  context: string,
  files: TrainingFile[]
): Promise<Persona[]> => {
  const modelId = "gemini-3-pro-preview";
  
  const sourcesText = segment.grounding.sources?.map(s => `[${s.title}](${s.url}): ${s.snippet}`).join('\n') || "No web sources.";

  const prompt = `Generate ${segment.count} unique Behavioral Agents for the segment: '${segment.name}'.
    BRIEF: ${segment.description}
    BASE TRAITS: ${JSON.stringify(segment.traits)}
    WEB CONTEXT: ${sourcesText}
    PROJECT CONTEXT: ${context}
    
    For each agent, derive specific assumptions based on the web context.
    Return a JSON array of persona objects with: name, age, occupation, location, psychographics, spendingHabits, bio (3 sentences), avatarId (1-1000), and groundingAssumption.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          ...files.map(f => ({ inlineData: { mimeType: f.mimeType, data: f.content } })),
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              age: { type: Type.INTEGER },
              occupation: { type: Type.STRING },
              location: { type: Type.STRING },
              psychographics: { type: Type.STRING },
              spendingHabits: { type: Type.STRING },
              bio: { type: Type.STRING },
              avatarId: { type: Type.INTEGER },
              groundingAssumption: { type: Type.STRING }
            }
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || "[]");
    return (Array.isArray(parsed) ? parsed : []).map(p => ({
      ...p, 
      id: crypto.randomUUID(), 
      segmentId: segment.id, 
      traits: segment.traits 
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
};

/**
 * PHASE 3: Isolated Black-Box Survey Engine
 */
export const simulateParticipantSurvey = async (
  persona: Persona,
  studyType: StudyType,
  questions: Question[],
  context: string,
  stimuli: Asset[]
): Promise<SimulationResult> => {
  const modelId = "gemini-3-pro-preview";
  
  const systemInstruction = `
    ACT AS: ${persona.name}. 
    BIO: ${persona.bio}. 
    STABLE TRAITS: ${JSON.stringify(persona.traits)}.
    GROUNDING: ${persona.groundingAssumption}.
    
    MISSION: Complete this ${studyType} survey independently. Do not be influenced by other hypothetical users.
    RATIONALIZATION: Use your thinking budget to simulate a specific experience with the product.
  `;

  const prompt = `
    CONTEXT: ${context}
    SURVEY QUESTIONS: ${JSON.stringify(questions)}
    
    Respond in JSON format:
    {
      "thinkingLog": "Inner monologue simulating the experience",
      "confidence": number (0-100 indicating how consistent this response is with the persona's traits),
      "responses": [
        {
          "questionId": "ID",
          "questionText": "TEXT",
          "answer": "RAW RESPONSE",
          "numericValue": number (1-10 scale if applicable, else null),
          "sentiment": "Positive" | "Neutral" | "Negative",
          "rationale": "Why you chose this specific answer"
        }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          ...stimuli.map(s => ({ inlineData: { mimeType: 'image/png', data: s.data } })),
          { text: prompt }
        ]
      },
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 16000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            thinkingLog: { type: Type.STRING },
            confidence: { type: Type.NUMBER }, // Added confidence to schema
            responses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  questionId: { type: Type.STRING },
                  questionText: { type: Type.STRING },
                  answer: { type: Type.STRING },
                  numericValue: { type: Type.NUMBER },
                  sentiment: { type: Type.STRING },
                  rationale: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return {
      experimentId: "survey_" + Date.now(),
      personaId: persona.id,
      personaName: persona.name,
      segmentId: persona.segmentId,
      responses: parsed.responses || [],
      thinkingLog: parsed.thinkingLog || "",
      confidence: parsed.confidence || 100 // Default confidence if missing
    };
  } catch (error) {
    return {
      experimentId: "error",
      personaId: persona.id,
      personaName: persona.name,
      segmentId: persona.segmentId,
      responses: [],
      thinkingLog: "Simulation crashed.",
      confidence: 0
    };
  }
};

/**
 * PHASE 5: Advanced Statistical Analysis Engine
 */
export const performStatisticalAnalysis = async (results: SimulationResult[], segments: PersonaSegment[]): Promise<AnalysisReport> => {
  const modelId = "gemini-3-pro-preview";
  
  const prompt = `Perform advanced statistical GTM analysis on ${results.length} results across segments: ${JSON.stringify(segments.map(s => s.name))}.
    
    REQUIRED TASKS:
    1. Validate Hypotheses (Statement, p-value, effect size).
    2. Perform Regression (identify key trait-outcome correlations).
    3. Calculate Optimal Price Point and Conversion Probability.
    4. Calculate Market Resonance Score (0-100).
    5. Generate Segment-specific Lift/Resonance charts data.
    
    Data: ${JSON.stringify(results).substring(0, 30000)}`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 32000 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            hypotheses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  statement: { type: Type.STRING },
                  p_value: { type: Type.NUMBER },
                  validated: { type: Type.BOOLEAN },
                  effectSize: { type: Type.NUMBER },
                  interpretation: { type: Type.STRING }
                }
              }
            },
            regressionSummary: { type: Type.STRING },
            keyDifferentiators: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            reliabilityScore: { type: Type.INTEGER },
            optimalPricePoint: { type: Type.NUMBER },
            conversionProbability: { type: Type.NUMBER },
            marketResonance: { type: Type.NUMBER }, // Added marketResonance to schema
            sentimentBreakdown: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: {type: Type.STRING}, value: {type: Type.NUMBER}, color: {type: Type.STRING} } } },
            segmentPerformance: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { segment: {type: Type.STRING}, avgScore: {type: Type.NUMBER}, dominantTheme: {type: Type.STRING} } } },
            driversRadar: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { subject: {type: Type.STRING}, A: {type: Type.NUMBER}, B: {type: Type.NUMBER}, fullMark: {type: Type.NUMBER} } } },
            trendData: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: {type: Type.STRING}, uv: {type: Type.NUMBER}, pv: {type: Type.NUMBER} } } }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Analysis failed", error);
    return {
      summary: "Analysis failed.",
      hypotheses: [],
      regressionSummary: "",
      keyDifferentiators: [],
      recommendations: [],
      reliabilityScore: 0,
      conversionProbability: 0,
      marketResonance: 0,
      sentimentBreakdown: [],
      segmentPerformance: [],
      driversRadar: [],
      trendData: []
    };
  }
};

export const copilotChat = async (
  history: {role: string, content: string}[], 
  message: string, 
  context: string,
  length: CopilotLength = CopilotLength.DEFAULT,
  tone: CopilotTone = CopilotTone.INTELLECTUAL
) => {
  const modelId = "gemini-3-pro-preview";
  
  let toneInstruction = "You are 'RAT LAB Research Designer'.";
  if (tone === CopilotTone.INTELLECTUAL) {
    toneInstruction += " Respond in a highly intellectual, academic, and research-focused manner. Use terminology from behavioral economics and statistics.";
  } else if (tone === CopilotTone.FUN) {
    toneInstruction += " Respond in a fun, interesting, and engaging way. Use emojis and conversational language to make research exciting.";
  } else if (tone === CopilotTone.DETECTIVE) {
    toneInstruction += " Respond like a hard-boiled detective uncovering the hidden 'mysteries' of consumer behavior. Use noir metaphors and look for 'clues' in the data.";
  }

  let lengthInstruction = "";
  if (length === CopilotLength.SHORT) {
    lengthInstruction = " Be very concise and direct. Minimal fluff.";
  } else if (length === CopilotLength.LONG) {
    lengthInstruction = " Be exhaustive and detailed. Provide deep explanations for every point.";
  }

  const systemInstruction = `${toneInstruction}${lengthInstruction} Guide users through constructing study-types like Conjoint, Likert surveys, and Pricing tests. Context: ${context}`;
  
  const formattedHistory = history.map(h => ({
    role: h.role === 'user' ? 'user' : 'model',
    parts: [{ text: h.content }]
  }));

  try {
    const chat = ai.chats.create({
      model: modelId,
      history: formattedHistory,
      config: { systemInstruction: systemInstruction }
    });
    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (error) { return "I'm having trouble connecting to the strategy core."; }
};

export const generatePersonaVoice = async (persona: Persona) => { 
  const modelId = "gemini-2.5-flash-preview-tts";
  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [{ parts: [{ text: `I am ${persona.name}. ${persona.bio}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (error) { return ""; }
};

export const generateAudioReport = async (text: string) => {
  const modelId = "gemini-2.5-flash-preview-tts";
  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [{ parts: [{ text: `Strategy Executive Summary: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (error) { return ""; }
};

export const analyzeImageAssets = async (base64Image: string) => { 
  const modelId = "gemini-3-flash-preview";
  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64Image } },
          { text: "Identify conversion triggers and psychological hooks." }
        ]
      }
    });
    return response.text || "";
  } catch (error) { return ""; }
};
