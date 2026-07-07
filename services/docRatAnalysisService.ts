import { SimulationResult, PersonaSegment, DocRatResponse, Formula, GraphSpec, StatisticalTest } from '../types';
import { generateText } from './openaiApi';
import { getIndividualPersonaData, getAggregatedData, IndividualPersonaData, AggregatedData } from './dataAccessService';
import { STATISTICAL_FORMULAS } from '../utils/statisticalFormulas';

const MODEL_ID = import.meta.env.VITE_MODEL_ANALYSIS || 'gpt-4-turbo-preview';

/**
 * Analyze data with Doc Rat - LLM-powered statistical analysis assistant
 */
export async function analyzeWithDocRat(
  query: string,
  results: SimulationResult[],
  segments: PersonaSegment[],
  personas: any[] = [],
  analysisType: 'individual' | 'aggregated' | 'both' = 'both'
): Promise<DocRatResponse> {
  // Get data based on analysis type
  const individualData = analysisType === 'individual' || analysisType === 'both'
    ? getIndividualPersonaData(results, segments, personas)
    : [];
  
  const aggregatedData = analysisType === 'aggregated' || analysisType === 'both'
    ? getAggregatedData(results, segments, personas)
    : null;
  
  // Prepare data summary for LLM
  const dataSummary = prepareDataSummary(individualData, aggregatedData, analysisType);
  
  // Create system prompt for Doc Rat
  const systemPrompt = `You are Doc Rat, a statistical analysis assistant for RAT LAB - a behavioral research platform.

Your role is to:
1. Perform statistical analysis on persona simulation data
2. Always show formulas when performing calculations (use LaTeX format)
3. Suggest appropriate visualizations for the data
4. Explain statistical concepts clearly
5. Provide actionable insights based on the analysis
6. Work with both individual persona datasets and aggregated data

FORMULA FORMATTING:
- Always use LaTeX format for formulas
- Common formulas available:
  - Mean: \\bar{x} = \\frac{1}{n}\\sum_{i=1}^{n}x_i
  - Standard Deviation: \\sigma = \\sqrt{\\frac{1}{n}\\sum_{i=1}^{n}(x_i - \\bar{x})^2}
  - Correlation: r = \\frac{\\sum(x_i - \\bar{x})(y_i - \\bar{y})}{\\sqrt{\\sum(x_i - \\bar{x})^2\\sum(y_i - \\bar{y})^2}}
  - T-test: t = \\frac{\\bar{x} - \\mu_0}{s/\\sqrt{n}}
  - Regression: y = b_0 + b_1x

GRAPH SUGGESTIONS:
- Bar charts for categorical comparisons
- Line charts for trends over time
- Scatter plots for correlations
- Heatmaps for multi-dimensional data
- Radar charts for multi-trait comparisons

When responding, structure your analysis with:
1. Statistical analysis with formulas
2. Suggested visualizations
3. Key insights
4. Statistical test results (if applicable)

Return your response in JSON format with this structure:
{
  "analysis": "Detailed analysis text",
  "formulas": [
    {
      "id": "formula-1",
      "latex": "\\bar{x} = \\frac{1}{n}\\sum_{i=1}^{n}x_i",
      "description": "Mean calculation",
      "variables": {"n": 30, "x_i": "response values"},
      "result": 7.5
    }
  ],
  "graphs": [
    {
      "type": "bar",
      "title": "Average Score by Segment",
      "data": [{"name": "Segment A", "value": 7.5}, {"name": "Segment B", "value": 8.2}],
      "xAxis": "Segment",
      "yAxis": "Average Score",
      "config": {"showLegend": true}
    }
  ],
  "statisticalTests": [
    {
      "name": "T-Test",
      "formula": "t = \\frac{\\bar{x}_1 - \\bar{x}_2}{s_{pooled}/\\sqrt{n}}",
      "result": 2.34,
      "pValue": 0.023,
      "interpretation": "Significant difference between groups",
      "significant": true
    }
  ],
  "insights": [
    "Key insight 1",
    "Key insight 2"
  ]
}`;
  
  const userPrompt = `User Query: ${query}

Available Data:
${dataSummary}

Perform the requested analysis and return structured results with formulas, graphs, and insights.`;
  
  try {
    const responseText = await generateText(
      MODEL_ID,
      userPrompt,
      systemPrompt,
      true, // JSON mode
      0.3 // Lower temperature for consistent analysis
    );
    
    // Parse response
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseError: any) {
      console.error('Failed to parse Doc Rat response:', parseError);
      // Fallback: return text-only response
      return {
        id: crypto.randomUUID(),
        query,
        timestamp: new Date().toISOString(),
        analysis: responseText,
        insights: [responseText],
        dataSource: analysisType
      };
    }
    
    // Structure response
    const response: DocRatResponse = {
      id: crypto.randomUUID(),
      query,
      timestamp: new Date().toISOString(),
      analysis: parsed.analysis || responseText,
      formulas: parsed.formulas?.map((f: any) => ({
        id: f.id || crypto.randomUUID(),
        latex: f.latex || '',
        description: f.description || '',
        variables: f.variables || {},
        result: f.result
      })) || [],
      graphs: parsed.graphs?.map((g: any) => ({
        type: g.type || 'bar',
        title: g.title || 'Chart',
        data: g.data || [],
        xAxis: g.xAxis,
        yAxis: g.yAxis,
        config: g.config || {}
      })) || [],
      statisticalTests: parsed.statisticalTests?.map((t: any) => ({
        name: t.name || 'Test',
        formula: t.formula || '',
        result: t.result || 0,
        pValue: t.pValue || 1,
        interpretation: t.interpretation || '',
        significant: t.significant || false
      })) || [],
      insights: parsed.insights || [parsed.analysis || responseText],
      dataSource: analysisType
    };
    
    return response;
  } catch (error: any) {
    console.error('Doc Rat analysis error:', error);
    return {
      id: crypto.randomUUID(),
      query,
      timestamp: new Date().toISOString(),
      analysis: `Error performing analysis: ${error.message || 'Unknown error'}`,
      insights: ['Analysis could not be completed. Please try again.'],
      dataSource: analysisType
    };
  }
}

/**
 * Prepare data summary for LLM
 */
function prepareDataSummary(
  individualData: IndividualPersonaData[],
  aggregatedData: AggregatedData | null,
  analysisType: 'individual' | 'aggregated' | 'both'
): string {
  let summary = '';
  
  if (analysisType === 'individual' || analysisType === 'both') {
    summary += `INDIVIDUAL PERSONA DATASETS (${individualData.length} personas):\n`;
    summary += `Sample of individual responses:\n`;
    summary += JSON.stringify(individualData.slice(0, 5).map(d => ({
      personaName: d.personaName,
      segment: d.segmentName,
      responses: d.responses.slice(0, 2),
      traits: d.traits
    })), null, 2);
    summary += '\n\n';
  }
  
  if (analysisType === 'aggregated' || analysisType === 'both') {
    if (aggregatedData) {
      summary += `AGGREGATED DATASETS:\n`;
      summary += `Total Personas: ${aggregatedData.totalPersonas}\n`;
      summary += `Overall Average Score: ${aggregatedData.overallStats.averageScore.toFixed(2)}\n`;
      summary += `Sentiment Breakdown: Positive: ${aggregatedData.overallStats.sentimentBreakdown.positive}, Neutral: ${aggregatedData.overallStats.sentimentBreakdown.neutral}, Negative: ${aggregatedData.overallStats.sentimentBreakdown.negative}\n`;
      summary += `\nSegment Breakdown:\n`;
      summary += JSON.stringify(aggregatedData.segments.map(s => ({
        segmentName: s.segmentName,
        personaCount: s.personaCount,
        averageScore: s.averageScore,
        sentimentBreakdown: s.sentimentBreakdown,
        traitAverages: s.traitAverages
      })), null, 2);
    }
  }
  
  return summary;
}

/**
 * Get quick analysis suggestions based on data
 */
export function getQuickAnalysisSuggestions(
  results: SimulationResult[],
  segments: PersonaSegment[]
): string[] {
  const suggestions: string[] = [];
  
  if (results.length > 0) {
    suggestions.push('What is the average response score for each segment?');
    suggestions.push('Perform a correlation analysis between risk aversion and purchase intent');
    suggestions.push('Show me a regression analysis of price sensitivity vs conversion');
    suggestions.push('Calculate the p-value for differences between segments');
    suggestions.push('Create a heatmap of responses by persona and question');
  }
  
  if (segments.length > 2) {
    suggestions.push('Perform ANOVA to compare means across all segments');
  }
  
  return suggestions;
}

