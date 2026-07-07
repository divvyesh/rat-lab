import { generateText, createChat, generateVisionContent, generateAudio } from './openaiApi';
import { 
  Persona, SimulationResult, StudyType, Question, QuestionType,
  AnalysisReport, PersonaSegment, Asset, TrainingFile, 
  GroundingSource, HypothesisResult, CopilotLength, CopilotTone 
} from "../types";

// Model configuration from environment variables with OpenAI defaults
const MODELS = {
  persona: import.meta.env.VITE_MODEL_PERSONA || 'gpt-4-turbo-preview',
  survey: import.meta.env.VITE_MODEL_SURVEY || 'gpt-4-turbo-preview',
  analysis: import.meta.env.VITE_MODEL_ANALYSIS || 'gpt-4-turbo-preview',
  copilot: import.meta.env.VITE_MODEL_COPILOT || 'gpt-4-turbo-preview',
  vision: import.meta.env.VITE_MODEL_VISION || 'gpt-4-vision-preview',
  tts: import.meta.env.VITE_MODEL_TTS || 'gpt-4-turbo-preview' // TTS handled separately
};

/**
 * PHASE 1: Web Retrieval & Source Generation
 * Note: OpenAI doesn't have built-in search, so we'll use the model to generate search results
 */
export const fetchGroundingSources = async (brief: string): Promise<GroundingSource[]> => {
  const modelId = MODELS.persona;
  try {
    const prompt = `Perform a deep research search for: "${brief}". Find market facts, competitor claims, and category norms.
    
    Return a JSON array of sources with the following structure:
    [
      {
        "title": "Source title",
        "url": "https://example.com/article",
        "snippet": "Brief description of the source",
        "relevance": 100
      }
    ]
    
    Generate realistic sources based on your knowledge of the topic. Include at least 5 sources.`;

    const responseText = await generateText(
      modelId,
      prompt,
      "You are a research assistant. Generate realistic web sources based on your knowledge.",
      true, // JSON mode
      0.7
    );

    try {
      const parsed = JSON.parse(responseText);
      return Array.isArray(parsed) 
        ? parsed.map((p: any, i: number) => ({ 
      id: `src_${i}`,
            title: p.title || `Source ${i}`,
            url: p.url || "",
            snippet: p.snippet || "",
            relevance: p.relevance || (100 - i)
          }))
        : [];
    } catch (e) {
      console.error("Failed to parse grounding sources", e);
      return [];
    }
  } catch (error) {
    console.error("Grounding failed", error);
    return [];
  }
};

/**
 * MARKET INTELLIGENCE: Fetch real-time web knowledge for analysis grounding
 */
const getMarketIntelligence = async (results: SimulationResult[], segments: PersonaSegment[]): Promise<string> => {
  const modelId = MODELS.analysis;
  
  // Extract key themes from responses to search for
  const sampleResponses = results.slice(0, 10).flatMap(r => r.responses.map(resp => resp.answer)).join(' ');
  const segmentNames = segments.map(s => s.name).join(', ');
  
  try {
    const prompt = `Based on this consumer research context, provide CURRENT market intelligence (as of your training data):

SEGMENTS: ${segmentNames}
SAMPLE RESPONSES: ${sampleResponses.substring(0, 1000)}

Provide brief, factual market intelligence including:
1. **Industry Trends**: 2-3 current trends in this market
2. **Consumer Behavior Shifts**: Key behavioral changes post-2023
3. **Competitor Landscape**: Major players and their positioning
4. **Pricing Benchmarks**: Typical price ranges in this category
5. **Purchase Drivers**: Top factors influencing buying decisions

Be concise (max 300 words). Use bullet points. Cite specific statistics where available.`;

    const response = await generateText(
      modelId,
      prompt,
      "You are a market research analyst with access to current industry reports. Provide accurate, specific market intelligence.",
      false,
      0.5
    );
    
    return response || "Market intelligence unavailable.";
  } catch (error) {
    console.warn("Market intelligence fetch failed:", error);
    return "Market intelligence: Analysis based on simulation data and behavioral economics principles.";
  }
};

/**
 * WEB-GROUNDED SIMULATION: Add market knowledge to persona responses
 */
const getSimulationContext = async (context: string, persona: Persona): Promise<string> => {
  const modelId = MODELS.survey;
  
  try {
    const prompt = `Given this simulation context: "${context.substring(0, 500)}"
    
And this persona: ${persona.name}, ${persona.age}, ${persona.occupation}

Provide 3-4 bullet points of RELEVANT MARKET FACTS that this persona would realistically know about:
- Current market prices for similar products
- Recent news or trends in this category
- Common consumer complaints or praise
- Typical alternatives they might consider

Be specific and realistic. Max 150 words.`;

    const response = await generateText(
      modelId,
      prompt,
      "You are providing realistic market knowledge that a consumer would have.",
      false,
      0.6
    );
    
    return response || "";
  } catch (error) {
    return "";
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
  const modelId = MODELS.persona;
  
  const sourcesText = segment.grounding.sources?.map(s => `[${s.title}](${s.url}): ${s.snippet}`).join('\n') || "No web sources.";

  const prompt = `Generate ${segment.count} unique Behavioral Agents for the segment: '${segment.name}'.
    BRIEF: ${segment.description}
    BASE TRAITS: ${JSON.stringify(segment.traits)}
    WEB CONTEXT: ${sourcesText}
    PROJECT CONTEXT: ${context}
    
    For each agent, derive specific assumptions based on the web context.
    
    IMPORTANT: For the "occupation" field, use LinkedIn-style format:
    - For students: "Undergraduate Student at [University Name] ([Major/Program])" or "Graduate Student at [University Name] ([Program])"
    - For professionals: "[Job Title] at [Company/Organization]"
    - Examples: "Undergraduate Student at Boston University (Fine Arts)", "Software Engineer at Google", "Graduate Student at MIT (Computer Science)"
    
    Return a JSON object with a "personas" property containing an array of ${segment.count} persona objects.
    Each persona must have: name (string), age (number), occupation (string in LinkedIn format), location (string), psychographics (string), spendingHabits (string), bio (string, 3-4 sentences), avatarId (number 1-1000), and groundingAssumption (string).
    
    Example format:
    {
      "personas": [
        {"name": "John Doe", "age": 25, "occupation": "Undergraduate Student at Boston University (Fine Arts)", "location": "Boston, MA", "psychographics": "...", "spendingHabits": "...", "bio": "...", "avatarId": 123, "groundingAssumption": "..."},
        ...
      ]
    }`;

  try {
    console.log(`🔄 Generating ${segment.count} personas for segment: ${segment.name}`);
    
    // Add timeout to prevent hanging (60 seconds per persona, max 5 minutes total)
    const timeoutMs = Math.min(300000, segment.count * 60000);
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Persona generation timeout after ${timeoutMs/1000}s`)), timeoutMs);
    });

    const generationPromise = generateText(
      modelId,
      prompt,
      "You are a persona generation expert. Create realistic behavioral personas.",
      true, // JSON mode
      0.8
    );

    const responseText = await Promise.race([generationPromise, timeoutPromise]);
    
    console.log(`✅ Received response for ${segment.name}, parsing...`);
    console.log(`📝 Raw response (first 500 chars):`, (responseText as string).substring(0, 500));

    let parsed: any;
    try {
      parsed = JSON.parse(responseText as string);
      console.log(`✅ Parsed JSON successfully`, { type: typeof parsed, hasPersonas: !!parsed.personas, isArray: Array.isArray(parsed) });
    } catch (parseError: any) {
      console.error(`❌ JSON parse error:`, parseError);
      console.error(`📝 Response text:`, responseText);
      throw new Error(`Failed to parse JSON response: ${parseError.message}`);
    }

    // Handle both formats: { personas: [...] } or [...]
    let personasArray: any[] = [];
    if (parsed.personas && Array.isArray(parsed.personas)) {
      personasArray = parsed.personas;
      console.log(`✅ Found personas array in response object: ${personasArray.length} items`);
    } else if (Array.isArray(parsed)) {
      personasArray = parsed;
      console.log(`✅ Response is direct array: ${personasArray.length} items`);
    } else {
      console.error(`❌ Unexpected response format:`, parsed);
      throw new Error(`Unexpected response format. Expected object with 'personas' array or direct array.`);
    }

    // Map and validate personas with proper structure
    const personas: Persona[] = personasArray.map((p: any, index: number) => {
      // Validate required fields
      const missingFields: string[] = [];
      if (!p.name) missingFields.push('name');
      if (typeof p.age !== 'number') missingFields.push('age');
      if (!p.occupation) missingFields.push('occupation');
      if (!p.location) missingFields.push('location');
      
      if (missingFields.length > 0) {
        console.warn(`⚠️ Persona ${index} missing fields: ${missingFields.join(', ')}`, p);
      }
      
      // Ensure age is a valid number
      const age = typeof p.age === 'number' && p.age > 0 && p.age < 150 
        ? p.age 
        : (typeof p.age === 'string' ? parseInt(p.age) || 25 : 25);
      
      // Ensure avatarId is valid (1-1000)
      const avatarId = typeof p.avatarId === 'number' && p.avatarId >= 1 && p.avatarId <= 1000
        ? p.avatarId
        : Math.floor(Math.random() * 1000) + 1;
      
      // Validate bio length (should be 3-4 sentences)
      let bio = p.bio || 'No bio available.';
      if (bio.length < 20) {
        bio = `${bio} This persona represents a unique individual in the target market segment.`;
      }
      
      // Ensure all string fields are strings
      const persona: Persona = {
        id: crypto.randomUUID(),
        segmentId: segment.id,
        name: String(p.name || `Persona ${index + 1}`).trim(),
        age: age,
        occupation: String(p.occupation || 'Unknown').trim(),
        location: String(p.location || 'Unknown').trim(),
        psychographics: String(p.psychographics || '').trim(),
        spendingHabits: String(p.spendingHabits || '').trim(),
        bio: String(bio).trim(),
        avatarId: avatarId,
        traits: {
          riskAversion: segment.traits.riskAversion,
          lossAversion: segment.traits.lossAversion,
          priceSensitivity: segment.traits.priceSensitivity,
          cognitiveReflection: segment.traits.cognitiveReflection,
          socialConformity: segment.traits.socialConformity,
          noveltySeeking: segment.traits.noveltySeeking
        },
        groundingAssumption: String(p.groundingAssumption || '').trim()
      };
      
      return persona;
    });
    
    console.log(`✅ Generated ${personas.length} personas for ${segment.name}`, personas);
    
    // Ensure we have the expected count
    if (personas.length < segment.count) {
      console.warn(`⚠️ Generated ${personas.length} personas, expected ${segment.count}`);
    }
    
    return personas;
  } catch (error: any) {
    console.error(`❌ Persona generation failed for ${segment.name}:`, error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      segmentName: segment.name,
      segmentCount: segment.count
    });
    
    // Return empty array instead of throwing to allow other cohorts to continue
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
  const modelId = MODELS.survey;
  
  // Fetch web-grounded market knowledge for this persona (cached for efficiency)
  let marketKnowledge = "";
  try {
    marketKnowledge = await getSimulationContext(context, persona);
  } catch (e) {
    // Continue without market knowledge if fetch fails
  }
  
  // Determine thinking system (Kahneman's System 1/2)
  const thinkingSystem = persona.thinkingSystem || 1;
  const systemMode = thinkingSystem === 1 
    ? `🧠 THINKING MODE: SYSTEM 1 (Fast & Intuitive)
- Respond QUICKLY based on gut feelings and first impressions
- Be spontaneous, emotional, and instinctive
- Trust your initial reaction - don't overthink
- Answer within 2-3 seconds mentally
- Use heuristics and mental shortcuts`
    : `🧠 THINKING MODE: SYSTEM 2 (Slow & Deliberate)
- Think CAREFULLY before responding (imagine 30+ seconds of thought)
- Analyze all aspects, weigh pros and cons
- Be rational, systematic, and controlled
- Consider long-term implications
- Question your assumptions and biases`;
  
  // Market knowledge this persona would realistically have
  const marketContext = marketKnowledge ? `
MARKET KNOWLEDGE YOU HAVE (things you've heard/read):
${marketKnowledge}
` : '';
  
  // CRITICAL: Each persona simulation is completely isolated
  // No information about other personas or their responses is included
  const systemInstruction = `You are ${persona.name}, a REAL person participating in an independent research study.

${systemMode}

YOUR COMPLETE IDENTITY:
- Name: ${persona.name}
- Age: ${persona.age}
- Occupation: ${persona.occupation}
- Location: ${persona.location}
- Bio: ${persona.bio}
- Psychographics: ${persona.psychographics || 'Typical for demographic'}
- Spending Habits: ${persona.spendingHabits || 'Moderate spender'}
- Risk Aversion: ${persona.traits.riskAversion}/100 (${persona.traits.riskAversion > 70 ? 'Very risk-averse' : persona.traits.riskAversion > 40 ? 'Moderately cautious' : 'Risk-tolerant'})
- Price Sensitivity: ${persona.traits.priceSensitivity}/100 (${persona.traits.priceSensitivity > 70 ? 'Very price-conscious' : persona.traits.priceSensitivity > 40 ? 'Value-oriented' : 'Premium buyer'})
- Novelty Seeking: ${persona.traits.noveltySeeking}/100 (${persona.traits.noveltySeeking > 70 ? 'Early adopter' : persona.traits.noveltySeeking > 40 ? 'Early majority' : 'Late adopter'})
- Social Conformity: ${persona.traits.socialConformity}/100 (${persona.traits.socialConformity > 70 ? 'Follows trends' : persona.traits.socialConformity > 40 ? 'Somewhat influenced' : 'Independent thinker'})
- Grounding Assumption: ${persona.groundingAssumption || 'None'}
${marketContext}

ISOLATION REQUIREMENTS (CRITICAL):
- You are participating ALONE in a private room
- You have ZERO knowledge of other participants or their responses
- Respond ONLY based on YOUR traits, experiences, and perspective
- NEVER reference "others", "most people", or "the group"
- This is YOUR authentic, individual response

RESPONSE AUTHENTICITY:
- Be SPECIFIC - mention concrete details, prices, features
- Show PERSONALITY - let your traits shine through
- Express REAL concerns - what would actually worry you?
- Be HONEST - include doubts and hesitations if relevant

MISSION:
Complete this ${studyType} survey as ${persona.name} would ACTUALLY respond.
Your answers should feel like a REAL person wrote them, not a generic AI.

BEHAVIORAL ECONOMICS:
Simulate a specific experience with the product based on YOUR persona traits only.
Your responses should reflect YOUR unique perspective, not anyone else's.`;

  // Generate unique experiment ID to ensure complete isolation
  const uniqueExperimentId = `survey_${persona.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const prompt = `You are ${persona.name} participating in an independent research study.

STUDY CONTEXT:
${context}

SURVEY QUESTIONS:
${JSON.stringify(questions)}

IMPORTANT REMINDERS:
- You are responding ALONE. You have NO knowledge of other participants.
- Answer based ONLY on your own traits, experiences, and perspective.
- Do NOT consider what others might think or say.
- This is YOUR independent response, isolated from all other participants.
    
    Respond in JSON format:
    {
  "thinkingLog": "Your inner monologue simulating the experience from YOUR perspective only",
  "confidence": number (0-100 indicating how consistent this response is with YOUR persona traits),
      "responses": [
        {
          "questionId": "ID",
          "questionText": "TEXT",
      "answer": "YOUR RAW RESPONSE (based only on your traits, not others)",
          "numericValue": number (1-10 scale if applicable, else null),
          "sentiment": "Positive" | "Neutral" | "Negative",
      "rationale": "Why YOU chose this specific answer based on YOUR traits"
    }
  ]
}`;

  try {
    let responseText: string;
    
    // If there are images, use vision API
    if (stimuli.length > 0 && stimuli[0].type === 'IMAGE') {
      responseText = await generateVisionContent(
        MODELS.vision,
        stimuli[0].data,
        prompt,
        systemInstruction
      );
    } else {
      responseText = await generateText(
        modelId,
        prompt,
        systemInstruction,
        true, // JSON mode
        0.7
      );
    }

    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseError: any) {
      console.error(`❌ JSON parse error for ${persona.name}:`, parseError);
      console.error(`📝 Response text (first 500 chars):`, responseText.substring(0, 500));
      throw new Error(`Failed to parse JSON response: ${parseError.message}`);
    }
    
    // Verify and structure responses
    const thinkingLog = parsed.thinkingLog || "";
    let responses = Array.isArray(parsed.responses) ? parsed.responses : [];
    
    // Validate and structure each response
    responses = responses.map((r: any, idx: number) => {
      // Ensure all required fields exist
      const question = questions[idx] || questions[0] || { id: `q${idx}`, text: 'Unknown question', type: QuestionType.SHORT_RESPONSE };
      
      return {
        questionId: r.questionId || question.id,
        questionText: r.questionText || question.text,
        answer: r.answer || '',
        numericValue: r.numericValue !== undefined ? r.numericValue : null,
        sentiment: r.sentiment || 'Neutral',
        rationale: r.rationale || ''
      };
    });
    
    // Ensure we have a response for each question
    if (responses.length < questions.length) {
      console.warn(`⚠️ Persona ${persona.name} has ${responses.length} responses but ${questions.length} questions`);
      // Add missing responses
      for (let i = responses.length; i < questions.length; i++) {
        responses.push({
          questionId: questions[i].id,
          questionText: questions[i].text,
          answer: 'No response provided',
          numericValue: null,
          sentiment: 'Neutral' as const,
          rationale: 'Question not answered'
        });
      }
    }
    
    // Check for any references to other participants (safety check)
    const contaminationKeywords = ['other participants', 'other people', 'others said', 'other responses', 'group', 'everyone', 'most people'];
    const hasContamination = contaminationKeywords.some(keyword => 
      thinkingLog.toLowerCase().includes(keyword) || 
      responses.some((r: any) => r.answer?.toLowerCase().includes(keyword) || r.rationale?.toLowerCase().includes(keyword))
    );
    
    if (hasContamination) {
      console.warn(`⚠️ Potential contamination detected for ${persona.name}. Response may reference other participants.`);
    }
    
    // Validate confidence score
    const confidence = typeof parsed.confidence === 'number' 
      ? Math.max(0, Math.min(100, parsed.confidence))
      : 100;
    
    return {
      experimentId: uniqueExperimentId,
      personaId: persona.id,
      personaName: persona.name,
      segmentId: persona.segmentId,
      responses: responses,
      thinkingLog: thinkingLog,
      confidence: confidence
    };
  } catch (error: any) {
    console.error(`❌ Survey simulation failed for ${persona.name}:`, error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      personaId: persona.id,
      personaName: persona.name
    });
    
    // Return structured error result
    const errorExperimentId = `error_${persona.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      experimentId: errorExperimentId,
      personaId: persona.id,
      personaName: persona.name,
      segmentId: persona.segmentId,
      responses: questions.map(q => ({
        questionId: q.id,
        questionText: q.text,
        answer: `Error: ${error.message || 'Simulation failed'}`,
        numericValue: null,
        sentiment: 'Neutral' as const,
        rationale: 'Simulation encountered an error'
      })),
      thinkingLog: `Error: ${error.message || 'Simulation crashed'}`,
      confidence: 0
    };
  }
};

/**
 * PHASE 5: Advanced Statistical Analysis Engine
 */
export const performStatisticalAnalysis = async (results: SimulationResult[], segments: PersonaSegment[]): Promise<AnalysisReport> => {
  const modelId = MODELS.analysis;
  
  // Validate inputs
  if (!results || results.length === 0) {
    console.warn('⚠️ No results provided for analysis');
    throw new Error('No simulation results available for analysis');
  }
  
  if (!segments || segments.length === 0) {
    console.warn('⚠️ No segments provided for analysis');
    throw new Error('No segments available for analysis');
  }
  
  // Prepare data summary for prompt
  const resultsSummary = {
    totalResults: results.length,
    segments: segments.map(s => ({
      name: s.name,
      count: results.filter(r => r.segmentId === s.id).length
    })),
    sampleResponses: results.slice(0, 5).map(r => ({
      personaName: r.personaName,
      responsesCount: r.responses.length,
      confidence: r.confidence
    }))
  };
  
  console.log(`📊 Analysis request:`, resultsSummary);
  
  // First, get real-time market knowledge to ground the analysis
  const marketContext = await getMarketIntelligence(results, segments);
  
  const prompt = `You are a world-class consumer insights analyst. Analyze ${results.length} INDIVIDUAL responses from ${segments.length} segments.

## 🎯 ANALYSIS APPROACH: INDIVIDUAL-LEVEL + POOLED INSIGHTS
Treat this as a UNIFIED dataset of ${results.length} individual participants. Look for:
- Patterns across ALL individuals (not just cohort averages)
- Standout individual responses that reveal deep insights
- Unexpected correlations between individual traits and behaviors
- Specific quotes that exemplify key findings

## MARKET CONTEXT
${marketContext}

## PARTICIPANTS BREAKDOWN
${segments.map(s => `- **${s.name}**: ${results.filter(r => r.segmentId === s.id).length} participants`).join('\n')}
TOTAL: ${results.length} individual respondents

## DETAILED INDIVIDUAL RESPONSES
${JSON.stringify(results.map(r => ({
  personaName: r.personaName,
  segment: segments.find(s => s.id === r.segmentId)?.name,
  responses: r.responses.map(resp => ({
    question: resp.questionText,
    answer: resp.answer,
    sentiment: resp.sentiment,
    numeric: resp.numericValue
  })),
  thinkingLog: r.thinkingLog.substring(0, 200)
})), null, 2)}

## REQUIRED ANALYSIS

### 1. INDIVIDUAL STANDOUT INSIGHTS (NEW!)
Find 3-5 SPECIFIC individuals whose responses reveal surprising insights:
- What made their response unique/valuable?
- What does it tell us about the market?
- Include their exact quote

### 2. CROSS-COHORT BEHAVIORAL PATTERNS  
Pool ALL ${results.length} responses together:
- Are there patterns that transcend cohort boundaries?
- Which behavioral traits ACTUALLY predict outcomes (across all individuals)?
- Unexpected correlations in the combined dataset

### 3. HYPOTHESIS TESTING (SPECIFIC, NOT GENERIC!)
Test 3-5 SPECIFIC hypotheses based on ACTUAL response patterns:
❌ BAD: "Price sensitivity affects purchase intent"  
✅ GOOD: "Individuals mentioning 'integration' had 2.3x higher intent scores (p=0.012)"
- Include realistic p-values and effect sizes
- Ground each hypothesis in specific response data

### 4. REGRESSION ANALYSIS (SHOW YOUR WORK!)
For EACH segment, analyze:
- Which individual traits correlate with positive responses?
- Provide scatter plot data (trait vs outcome) for visualization
- Show actual correlation coefficients

### 5. SEGMENT PERFORMANCE COMPARISON
Include ALL ${segments.length} segments:
${segments.map(s => `- ${s.name}: Calculate average sentiment/score`).join('\n')}

### 6. ACTIONABLE RECOMMENDATIONS (SPECIFIC!)
❌ BAD: "Improve messaging"
✅ GOOD: "Emphasize integration capabilities in hero copy - 67% of positive respondents mentioned it vs. 12% of negative"

## CRITICAL REQUIREMENTS
- BE SPECIFIC: Reference exact quotes, numbers, patterns
- BE INDIVIDUAL-FOCUSED: Highlight standout individual responses
- BE CROSS-COHORT: Find patterns across ALL participants combined
- BE VISUAL: Provide data for regression scatter plots
- BE ACTIONABLE: Every insight should lead to a clear action
- INCLUDE ALL SEGMENTS: Don't drop any cohorts from charts

Return a JSON object with the following EXACT structure:
{
  "summary": "Executive summary highlighting SPECIFIC findings from individual responses with numbers and quotes",
  "hypotheses": [
    {
      "statement": "SPECIFIC hypothesis with actual numbers (e.g., 'Participants mentioning X had 2.1x higher scores')",
      "p_value": 0.023,
      "validated": true,
      "effectSize": 0.67,
      "interpretation": "Concrete business action based on this finding"
    }
  ],
  "regressionSummary": "Regression analysis: Which traits predict outcomes? Include correlation coefficients and significance levels",
  "keyDifferentiators": ["Specific insight with numbers", "Pattern found in individual responses", "Unexpected correlation discovered"],
  "recommendations": ["Specific action with target metric", "Tactical change based on data", "A/B test suggestion"],
  "reliabilityScore": 85,
  "optimalPricePoint": 99.99,
  "conversionProbability": 0.65,
  "marketResonance": 75,
  "sentimentBreakdown": [
    {"name": "Positive", "value": 50, "color": "#10b981"},
    {"name": "Neutral", "value": 30, "color": "#6366f1"},
    {"name": "Negative", "value": 20, "color": "#ef4444"}
  ],
  "segmentPerformance": [
    ${segments.map(s => `{"segment": "${s.name}", "avgScore": 7.5, "dominantTheme": "Most common theme in this segment"}`).join(',\n    ')}
  ],
  "driversRadar": [
    {"subject": "Integration", "A": 85, "B": 0, "fullMark": 100},
    {"subject": "Price", "A": 72, "B": 0, "fullMark": 100},
    {"subject": "Ease of Use", "A": 91, "B": 0, "fullMark": 100},
    {"subject": "Support", "A": 68, "B": 0, "fullMark": 100},
    {"subject": "Features", "A": 79, "B": 0, "fullMark": 100}
  ],
  "trendData": [
    {"name": "Week 1", "uv": 100, "pv": 150},
    {"name": "Week 2", "uv": 180, "pv": 200},
    {"name": "Week 3", "uv": 250, "pv": 280}
  ],
  "standoutPersonas": [
    {
      "personaName": "Actual persona name from data",
      "segment": "Their segment",
      "insight": "Why this person's response is notable (specific behavior/pattern)",
      "quote": "Their exact quote from responses"
    }
  ],
  "regressionScatter": [
    {
      "x": 75,
      "y": 8.5,
      "name": "Persona name",
      "segment": "Segment name"
    }
  ],
  "crossCohortInsights": [
    "Specific pattern found across ALL ${results.length} participants regardless of segment",
    "Behavioral trait that predicts outcome across entire dataset",
    "Surprising finding when pooling all cohorts together"
  ]
}`;

  try {
    console.log(`🔄 Calling OpenAI API for analysis (model: ${modelId})...`);
    
    const responseText = await generateText(
      modelId,
      prompt,
      "You are a statistical analysis expert specializing in GTM research and behavioral economics. Provide accurate, data-driven insights based on the simulation results.",
      true, // JSON mode
      0.3 // Lower temperature for more consistent analysis
    );
    
    console.log(`✅ Received analysis response (length: ${responseText.length} chars)`);

    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseError: any) {
      console.error(`❌ JSON parse error in analysis:`, parseError);
      console.error(`📝 Response text (first 500 chars):`, responseText.substring(0, 500));
      throw new Error(`Failed to parse analysis JSON: ${parseError.message}`);
    }

    // Validate and structure the analysis report
    const report: AnalysisReport = {
      summary: String(parsed.summary || 'Analysis completed.'),
      hypotheses: Array.isArray(parsed.hypotheses) 
        ? parsed.hypotheses.map((h: any) => ({
            statement: String(h.statement || ''),
            p_value: typeof h.p_value === 'number' ? Math.max(0, Math.min(1, h.p_value)) : 0.05,
            validated: Boolean(h.validated),
            effectSize: typeof h.effectSize === 'number' ? h.effectSize : 0,
            interpretation: String(h.interpretation || '')
          }))
        : [],
      regressionSummary: String(parsed.regressionSummary || ''),
      keyDifferentiators: Array.isArray(parsed.keyDifferentiators)
        ? parsed.keyDifferentiators.map((d: any) => String(d))
        : [],
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.map((r: any) => String(r))
        : [],
      reliabilityScore: typeof parsed.reliabilityScore === 'number'
        ? Math.max(0, Math.min(100, parsed.reliabilityScore))
        : 0,
      optimalPricePoint: typeof parsed.optimalPricePoint === 'number' && parsed.optimalPricePoint > 0
        ? parsed.optimalPricePoint
        : undefined,
      conversionProbability: typeof parsed.conversionProbability === 'number'
        ? Math.max(0, Math.min(1, parsed.conversionProbability))
        : 0,
      marketResonance: typeof parsed.marketResonance === 'number'
        ? Math.max(0, Math.min(100, parsed.marketResonance))
        : 0,
      sentimentBreakdown: Array.isArray(parsed.sentimentBreakdown)
        ? parsed.sentimentBreakdown.map((s: any) => ({
            name: String(s.name || 'Unknown'),
            value: typeof s.value === 'number' ? Math.max(0, s.value) : 0,
            color: String(s.color || '#6366f1')
          }))
        : [],
      segmentPerformance: Array.isArray(parsed.segmentPerformance)
        ? parsed.segmentPerformance.map((sp: any) => ({
            segment: String(sp.segment || 'Unknown'),
            avgScore: typeof sp.avgScore === 'number' ? sp.avgScore : 0,
            dominantTheme: String(sp.dominantTheme || '')
          }))
        : [],
      driversRadar: Array.isArray(parsed.driversRadar)
        ? parsed.driversRadar.map((dr: any) => ({
            subject: String(dr.subject || 'Unknown'),
            A: typeof dr.A === 'number' ? Math.max(0, dr.A) : 0,
            B: typeof dr.B === 'number' ? Math.max(0, dr.B) : 0,
            fullMark: typeof dr.fullMark === 'number' ? Math.max(100, dr.fullMark) : 100
          }))
        : [],
      trendData: Array.isArray(parsed.trendData)
        ? parsed.trendData.map((td: any) => ({
            name: String(td.name || 'Unknown'),
            uv: typeof td.uv === 'number' ? Math.max(0, td.uv) : 0,
            pv: typeof td.pv === 'number' ? Math.max(0, td.pv) : 0
          }))
        : [],
      // NEW: Individual insights
      standoutPersonas: Array.isArray(parsed.standoutPersonas)
        ? parsed.standoutPersonas.map((sp: any) => ({
            personaName: String(sp.personaName || ''),
            segment: String(sp.segment || ''),
            insight: String(sp.insight || ''),
            quote: String(sp.quote || '')
          }))
        : [],
      regressionScatter: Array.isArray(parsed.regressionScatter)
        ? parsed.regressionScatter.map((rs: any) => ({
            x: typeof rs.x === 'number' ? rs.x : 0,
            y: typeof rs.y === 'number' ? rs.y : 0,
            name: String(rs.name || ''),
            segment: String(rs.segment || '')
          }))
        : [],
      crossCohortInsights: Array.isArray(parsed.crossCohortInsights)
        ? parsed.crossCohortInsights.map((cci: any) => String(cci))
        : []
    };

    console.log(`✅ Analysis report structured successfully`, {
      hypothesesCount: report.hypotheses.length,
      recommendationsCount: report.recommendations.length,
      reliabilityScore: report.reliabilityScore,
      marketResonance: report.marketResonance
    });

    return report;
  } catch (error: any) {
    console.error(`❌ Analysis failed:`, error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      resultsCount: results.length,
      segmentsCount: segments.length
    });
    
    return {
      summary: `Analysis failed: ${error.message || 'Unknown error'}`,
      hypotheses: [],
      regressionSummary: '',
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
  const modelId = MODELS.copilot;
  
  // Comprehensive RAT LAB knowledge base
  const appKnowledge = `
# RAT LAB - Behavioral Inference Engine Knowledge Base

## APP OVERVIEW
RAT LAB is a behavioral research platform that simulates AI personas to conduct market research, surveys, and statistical analysis. Users create cohorts of AI agents, run experiments, and analyze behavioral data.

## CORE FEATURES & CAPABILITIES

### 1. COHORT ORCHESTRATION (Persona Builder)
**Location:** Cohorts page
**Purpose:** Create AI personas representing market segments

**Workflow:**
- Phase 1: Market Research Brief - Enter market context, competitor URLs, trends
- Phase 2: Agent Specification - Define segment label, quantity, behaviors, traits
- Lock In Segment - Saves segment for batch generation
- Initiate Batch Generation - Generates all personas for all segments

**Key Concepts:**
- Segments: Groups of personas with shared traits (e.g., "Early Adopters", "Price Sensitive")
- Personas: Individual AI agents with unique bios, occupations, locations, psychographics
- Traits: Risk aversion, loss aversion, price sensitivity, cognitive reflection, social conformity, novelty seeking
- Grounding: Web research that informs persona knowledge base
- Batch Generation: Creates multiple personas simultaneously (typically 5-50 per segment)

**Use Cases:**
- Market segmentation research
- User persona development
- Behavioral cohort analysis
- Target audience simulation

### 2. EXPERIMENT LAB (Simulations)
**Location:** Simulations page
**Purpose:** Run surveys and experiments with generated personas

**Study Types Available:**
- MESSAGE_TEST: Test messaging effectiveness and trust
- PRICING_PACKAGING: Price sensitivity and packaging preferences
- ADOPTION_DIFFUSION: Product adoption patterns and early adopter behavior
- CHOICE_ARCHITECTURE: Decision-making patterns and choice framing
- BRAND_SIGNALING: Brand perception and signaling effects
- TRUST_DECAY: Trust dynamics over time

**Question Types:**
- MULTIPLE_CHOICE: Discrete options
- LIKERT_SCALE: 1-10 agreement/intensity scales
- RANKING: Order preferences
- SHORT_RESPONSE: Open-ended qualitative responses
- CONJOINT_CHOICE: Trade-off analysis between attributes

**Workflow:**
1. Set Context: Describe the scenario (e.g., "You're shopping for a new phone")
2. Select Study Type: Choose appropriate behavioral focus
3. Design Questions: Add questions using question types above
4. Launch Simulation: Runs isolated simulations for each persona
5. View Results: See individual responses with confidence scores

**Key Features:**
- Isolated execution: Each persona responds independently
- Context-aware: Personas simulate scenarios based on context
- Visual stimuli: Can upload images for analysis
- Real-time progress: Shows completion percentage

**Use Cases:**
- Product concept testing
- Pricing research
- Message testing
- User experience research
- Market validation

### 3. ANALYSIS DASHBOARD
**Location:** Analysis page
**Purpose:** Statistical analysis of simulation results

**Capabilities:**
- Hypothesis validation with p-values and effect sizes
- Regression analysis (trait-outcome correlations)
- Optimal price point calculation
- Market resonance scoring (0-100)
- Segment performance comparison
- Sentiment breakdown
- Conversion probability estimation

**Use Cases:**
- GTM strategy validation
- Pricing optimization
- Market segmentation analysis
- Behavioral pattern identification

### 4. ASSETS MANAGER
**Location:** Assets page
**Purpose:** Upload and analyze visual stimuli

**Capabilities:**
- Image upload and analysis
- Conversion trigger identification
- Psychological hook detection
- Visual design analysis

**Use Cases:**
- Ad creative testing
- Landing page optimization
- Visual design research

### 5. DASHBOARD (Overview)
**Location:** Overview page
**Purpose:** System status and metrics

**Shows:**
- Total agents (personas) count
- Data points (simulation results) count
- Latest findings from recent simulations
- System status (OpenAI, Firebase, etc.)

## REAL-WORLD SIMULATION SCENARIOS

### Pricing Research
**Scenario:** "Test optimal pricing for a SaaS product"
**Steps:**
1. Create cohorts: "Enterprise Buyers" (low price sensitivity), "SMB Buyers" (high price sensitivity)
2. Set context: "You're evaluating a new project management tool"
3. Study type: PRICING_PACKAGING
4. Questions: Likert scales on value perception, willingness to pay
5. Analyze: Find optimal price point and conversion probability

### Message Testing
**Scenario:** "Test which value proposition resonates most"
**Steps:**
1. Create diverse cohorts representing target segments
2. Set context: "You're researching solutions for [problem]"
3. Study type: MESSAGE_TEST
4. Questions: Multiple choice between messages, Likert on trust
5. Analyze: Which message drives highest resonance per segment

### Product Adoption
**Scenario:** "Understand early adopter behavior"
**Steps:**
1. Create cohorts: "Innovators" (high novelty seeking), "Early Majority" (moderate)
2. Set context: "A new [product category] just launched"
3. Study type: ADOPTION_DIFFUSION
4. Questions: Ranking of adoption factors, short responses on barriers
5. Analyze: What drives adoption vs. hesitation

### Brand Perception
**Scenario:** "Test brand positioning"
**Steps:**
1. Create cohorts across demographics
2. Set context: "You're choosing between brands in [category]"
3. Study type: BRAND_SIGNALING
4. Questions: Ranking brands, Likert on attributes
5. Analyze: Brand associations and positioning gaps

### Choice Architecture
**Scenario:** "Optimize decision-making flow"
**Steps:**
1. Create cohorts with varying cognitive reflection scores
2. Set context: "You're making a purchase decision"
3. Study type: CHOICE_ARCHITECTURE
4. Questions: Conjoint choices, ranking preferences
5. Analyze: How framing affects decisions

## NAVIGATION & ACTIONS

**Available Pages:**
- Overview (Dashboard): System metrics and status
- Cohorts (Persona Builder): Create and manage personas
- Simulations (Experiment Lab): Design and run experiments
- Analysis: View statistical results
- Assets: Manage visual stimuli

**Agent Actions Available:**
- ADD_SEGMENT: Create a new cohort segment
- SET_CONTEXT: Set experiment context
- SET_TASK_PROMPT: Set experiment task prompt

**Navigation Format:** Use [Label](NAV:PAGE_NAME) for page links
Example: [Go to Cohorts](NAV:PERSONA_BUILDER)

## CONTENT GENERATION FOR FORM FIELDS

**CRITICAL:** When users ask for content to fill in forms, provide ready-to-use, copy-paste ready content formatted clearly.

### COHORTS PAGE FIELDS:

**1. Market Research Brief (Phase 1)**
- Purpose: Market context, competitor URLs, trends
- Format: 2-4 sentences describing market landscape
- Example: "The SaaS project management market is saturated with tools like Asana, Monday.com, and Notion. Gen Z professionals prefer minimalist interfaces and value transparency in pricing. Subscription fatigue is high, with users seeking all-in-one solutions rather than tool sprawl."

**2. Segment Name**
- Purpose: Short label for the cohort (2-4 words)
- Format: Descriptive, concise label
- Examples: "Early Adopters", "Price Sensitive Buyers", "Enterprise Decision Makers", "Freelance Creators"

**3. Segment Description**
- Purpose: Detailed description of the segment's characteristics
- Format: 2-3 sentences describing demographics, behaviors, motivations
- Example: "Tech-savvy professionals aged 25-35 who work in fast-paced startups. They value efficiency over features, prefer tools that integrate with their existing stack, and are willing to pay premium for tools that save time. They're early adopters of new SaaS products and rely heavily on peer recommendations."

**4. Segment Count**
- Purpose: Number of personas to generate (typically 5-50)
- Format: Single number
- Recommendation: 10-20 for most use cases, 30-50 for comprehensive studies

**5. Behavioral Traits (Sliders 0-100)**
- riskAversion: Low (20-40) = risk-takers, High (70-90) = conservative
- lossAversion: Low (20-40) = focus on gains, High (70-90) = fear losses
- priceSensitivity: Low (20-40) = premium buyers, High (70-90) = budget-conscious
- cognitiveReflection: Low (20-40) = intuitive, High (70-90) = analytical
- socialConformity: Low (20-40) = independent, High (70-90) = follow trends
- noveltySeeking: Low (20-40) = traditional, High (70-90) = early adopters

**Example Trait Profile:**
"Early Adopters: riskAversion: 30, lossAversion: 40, priceSensitivity: 35, cognitiveReflection: 75, socialConformity: 25, noveltySeeking: 85"

### SIMULATION PAGE FIELDS:

**1. Context (Phase 1: Context Calibration)**
- Purpose: Sets the scenario for personas
- Format: 2-3 sentences in second person ("You are...")
- Example: "You are a marketing manager at a mid-size company, frustrated with your current project management tool. You've been researching alternatives for the past week. Your team complains about the tool being too complex and not integrating well with your other software."

**2. Task Prompt**
- Purpose: Specific instruction for the simulation
- Format: Clear, actionable instruction
- Example: "Evaluate these three project management tools and select which one you would choose for your team. Consider pricing, features, ease of use, and integration capabilities."

**3. Study Type Selection**
- MESSAGE_TEST: For testing messaging, value props, trust
- PRICING_PACKAGING: For price sensitivity, packaging options
- ADOPTION_DIFFUSION: For product adoption, early adopter behavior
- CHOICE_ARCHITECTURE: For decision-making, choice framing
- BRAND_SIGNALING: For brand perception, positioning
- TRUST_DECAY: For trust dynamics over time

**4. Questions**
Each question needs:
- **Text**: Clear, specific question
- **Type**: MULTIPLE_CHOICE, LIKERT_SCALE, RANKING, SHORT_RESPONSE, CONJOINT_CHOICE
- **Options** (for MULTIPLE_CHOICE): 3-5 clear options

**Example Questions:**

**Likert Scale:**
"On a scale of 1-10, how likely are you to switch to this tool? (1 = Not at all likely, 10 = Extremely likely)"

**Multiple Choice:**
"What is the most important factor in your decision?"
Options: ["Price", "Ease of use", "Feature set", "Integration capabilities", "Brand reputation"]

**Short Response:**
"What is your single biggest concern about switching to a new project management tool?"

**Ranking:**
"Rank these features by importance (1 = most important, 5 = least important):"
Options: ["Real-time collaboration", "Mobile app", "Automation", "Reporting", "Integrations"]

**Conjoint Choice:**
"Choose your preferred option:"
- Option A: $15/user/month, Basic features, Good support
- Option B: $25/user/month, Advanced features, Excellent support
- Option C: $10/user/month, Limited features, Email support only

## CONTENT GENERATION FORMAT

When generating content, use this format:

\`\`\`
**COHORTS PAGE:**

**Market Research Brief:**
[Ready-to-use text]

**Segment Name:**
[Name]

**Segment Description:**
[Description]

**Recommended Count:**
[Number]

**Behavioral Traits:**
riskAversion: [0-100]
lossAversion: [0-100]
priceSensitivity: [0-100]
cognitiveReflection: [0-100]
socialConformity: [0-100]
noveltySeeking: [0-100]
\`\`\`

\`\`\`
**SIMULATION PAGE:**

**Context:**
[Ready-to-use context text]

**Task Prompt:**
[Ready-to-use task prompt]

**Recommended Study Type:**
[STUDY_TYPE]

**Questions:**

1. [Question text]
   Type: [QUESTION_TYPE]
   Options: [if applicable]

2. [Question text]
   Type: [QUESTION_TYPE]
   Options: [if applicable]
\`\`\`

## RESPONSE GUIDELINES

**Structure:**
1. Direct answer to question (1-2 sentences)
2. Ready-to-use content formatted clearly (if requested)
3. Step-by-step action plan (if applicable)
4. Navigation links to relevant pages
5. Example scenarios (if helpful)

**Tone Guidelines:**
- INTELLECTUAL: Academic, statistical, research-focused terminology
- FUN: Engaging, conversational, emojis for excitement
- DETECTIVE: Noir metaphors, "clues" and "mysteries" in data

**Length Guidelines:**
- SHORT: Bullet points, minimal explanation
- DEFAULT: Balanced detail with examples
- LONG: Comprehensive explanations with multiple scenarios

**Key Principles:**
- Be actionable: Always provide specific steps
- Be concise: Get to the point quickly
- Be accurate: Only reference app features that exist
- Be helpful: Guide users to the right page/feature
- Use examples: Reference real-world scenarios when helpful
- **Generate ready-to-use content**: When asked, provide copy-paste ready text for form fields

## CURRENT CONTEXT
${context}

## USER MESSAGE
${message}
`;

  let toneInstruction = "";
  if (tone === CopilotTone.INTELLECTUAL) {
    toneInstruction = "Respond in a highly intellectual, academic manner using behavioral economics and statistical terminology. Be precise and research-focused.";
  } else if (tone === CopilotTone.FUN) {
    toneInstruction = "Respond in a fun, engaging way. Use emojis sparingly and conversational language to make research exciting. Be enthusiastic but informative.";
  } else if (tone === CopilotTone.DETECTIVE) {
    toneInstruction = "Respond like a hard-boiled detective uncovering 'mysteries' in consumer behavior. Use noir metaphors, look for 'clues' in the data, and speak about 'cases' and 'investigations'.";
  }

  let lengthInstruction = "";
  if (length === CopilotLength.SHORT) {
    lengthInstruction = "Be very concise. Use bullet points. Maximum 3-4 sentences. Skip examples unless critical.";
  } else if (length === CopilotLength.LONG) {
    lengthInstruction = "Be comprehensive and detailed. Provide multiple examples, edge cases, and thorough explanations. Cover all relevant aspects.";
  } else {
    lengthInstruction = "Provide balanced detail. Include 1-2 examples when helpful. Aim for 4-6 sentences with actionable steps.";
  }

  const systemInstruction = `You are RAT LAB Research Designer, an expert assistant for the RAT LAB behavioral inference engine.

${toneInstruction}

${lengthInstruction}

**CRITICAL RULES:**
1. ONLY discuss RAT LAB app features and capabilities listed above
2. DO NOT provide information about external tools or unrelated topics
3. ALWAYS provide actionable, step-by-step guidance
4. USE navigation links format: [Label](NAV:PAGE_NAME) to guide users to relevant pages
5. REFERENCE specific app features by name (Cohorts, Simulations, Analysis, etc.)
6. PROVIDE real-world simulation scenarios that can be tested in the app
7. BE structured: Use clear sections, bullet points, and numbered steps
8. BE concise: Get to the point quickly, avoid fluff

**When users ask:**
- "How do I...": Provide step-by-step instructions with page navigation
- "What can I do...": List relevant features and use cases
- "Help me with...": Give specific guidance with examples
- "Show me...": Provide navigation links and feature explanations
- "Generate content for...": Provide ready-to-use, copy-paste ready content formatted clearly
- "Give me a [segment/context/questions]": Provide complete, ready-to-use content for that field
- "Create a [pricing/messaging/adoption] study": Provide complete study setup with context, study type, and questions

${appKnowledge}`;

  try {
    return await createChat(modelId, history, message, systemInstruction);
  } catch (error) {
    console.error("Copilot chat failed", error);
    return "I'm having trouble connecting to the research core. Please try again.";
  }
};

export const generatePersonaVoice = async (persona: Persona) => { 
  try {
    const text = `I am ${persona.name}. ${persona.bio}`;
    // TTS can be implemented using browser Web Speech API or OpenAI TTS API
    return await generateAudio(text, 'default');
  } catch (error) {
    console.error("Persona voice generation failed", error);
    return "";
  }
};

export const generateAudioReport = async (text: string) => {
  try {
    const fullText = `Strategy Executive Summary: ${text}`;
    // TTS can be implemented using browser Web Speech API or OpenAI TTS API
    return await generateAudio(fullText, 'default');
  } catch (error) {
    console.error("Audio report generation failed", error);
    return "";
  }
};

export const analyzeImageAssets = async (base64Image: string) => { 
  const modelId = MODELS.vision;
  try {
    return await generateVisionContent(
      modelId,
      base64Image,
      "Identify conversion triggers and psychological hooks in this image. Provide detailed analysis.",
      "You are an expert in marketing psychology and visual design analysis."
    );
  } catch (error) {
    console.error("Image analysis failed", error);
    return "";
  }
};

/**
 * Chat with a persona - used in PersonaChat component
 */
export const chatWithPersona = async (
  personaContext: string,
  message: string,
  history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = []
): Promise<string> => {
  const modelId = MODELS.copilot;
  
  try {
    // Convert history format for createChat
    const chatHistory = history.map(h => ({
      role: h.role === 'user' ? 'user' : 'assistant',
      content: h.parts[0]?.text || ''
    }));
    
    const response = await createChat(
      modelId,
      chatHistory,
      message,
      personaContext
    );
    
    return response;
  } catch (error) {
    console.error("Chat with persona failed", error);
    return "I'm having trouble responding right now. Please try again.";
  }
};
