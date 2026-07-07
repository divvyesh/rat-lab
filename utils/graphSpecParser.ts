import { GraphSpec } from '../types';

/**
 * Parse and validate LLM-generated graph specifications
 * Convert to Recharts-compatible format
 */

export interface ParsedGraphSpec {
  type: 'bar' | 'line' | 'scatter' | 'heatmap' | 'radar' | 'pie';
  data: any[];
  config: {
    width?: number;
    height?: number;
    colors?: string[];
    showLegend?: boolean;
    showGrid?: boolean;
    xAxis?: string;
    yAxis?: string;
  };
  title: string;
  isValid: boolean;
  errors?: string[];
}

/**
 * Parse graph specification from LLM response
 */
export function parseGraphSpec(spec: GraphSpec): ParsedGraphSpec {
  const errors: string[] = [];
  
  // Validate type
  const validTypes = ['bar', 'line', 'scatter', 'heatmap', 'radar', 'pie'];
  if (!validTypes.includes(spec.type)) {
    errors.push(`Invalid graph type: ${spec.type}. Must be one of: ${validTypes.join(', ')}`);
  }
  
  // Validate data
  if (!Array.isArray(spec.data)) {
    errors.push('Data must be an array');
  }
  
  if (spec.data.length === 0) {
    errors.push('Data array is empty');
  }
  
  // Validate data structure based on type
  if (spec.type === 'bar' || spec.type === 'line') {
    const hasValidStructure = spec.data.every((item: any) => 
      typeof item === 'object' && 
      (item.name !== undefined || item.label !== undefined) &&
      (item.value !== undefined || item.values !== undefined)
    );
    
    if (!hasValidStructure) {
      errors.push('Bar/Line chart data must have name/label and value properties');
    }
  }
  
  if (spec.type === 'scatter') {
    const hasValidStructure = spec.data.every((item: any) => 
      typeof item === 'object' && 
      item.x !== undefined && 
      item.y !== undefined
    );
    
    if (!hasValidStructure) {
      errors.push('Scatter plot data must have x and y properties');
    }
  }
  
  return {
    type: spec.type,
    data: spec.data,
    config: {
      width: spec.config?.width || 800,
      height: spec.config?.height || 400,
      colors: spec.config?.colors || ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
      showLegend: spec.config?.showLegend !== false,
      showGrid: spec.config?.showGrid !== false,
      xAxis: spec.xAxis || spec.config?.xAxis,
      yAxis: spec.yAxis || spec.config?.yAxis
    },
    title: spec.title || 'Chart',
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Convert parsed spec to Recharts-compatible format
 */
export function toRechartsFormat(parsed: ParsedGraphSpec): any {
  if (!parsed.isValid) {
    throw new Error(`Invalid graph spec: ${parsed.errors?.join(', ')}`);
  }
  
  switch (parsed.type) {
    case 'bar':
      return {
        type: 'bar',
        data: parsed.data.map((item: any) => ({
          name: item.name || item.label || 'Unknown',
          value: item.value || item.values?.[0] || 0
        })),
        config: parsed.config
      };
    
    case 'line':
      return {
        type: 'line',
        data: parsed.data.map((item: any) => ({
          name: item.name || item.label || 'Unknown',
          value: item.value || item.values?.[0] || 0
        })),
        config: parsed.config
      };
    
    case 'scatter':
      return {
        type: 'scatter',
        data: parsed.data.map((item: any) => ({
          x: item.x,
          y: item.y,
          name: item.name || item.label
        })),
        config: parsed.config
      };
    
    case 'pie':
      return {
        type: 'pie',
        data: parsed.data.map((item: any) => ({
          name: item.name || item.label || 'Unknown',
          value: item.value || 0
        })),
        config: parsed.config
      };
    
    case 'radar':
      return {
        type: 'radar',
        data: parsed.data,
        config: parsed.config
      };
    
    case 'heatmap':
      return {
        type: 'heatmap',
        data: parsed.data,
        config: parsed.config
      };
    
    default:
      throw new Error(`Unsupported graph type: ${parsed.type}`);
  }
}

/**
 * Validate graph data structure
 */
export function validateGraphData(data: any[], type: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!Array.isArray(data)) {
    return { valid: false, errors: ['Data must be an array'] };
  }
  
  if (data.length === 0) {
    return { valid: false, errors: ['Data array is empty'] };
  }
  
  switch (type) {
    case 'bar':
    case 'line':
    case 'pie':
      data.forEach((item, index) => {
        if (typeof item !== 'object') {
          errors.push(`Item ${index} must be an object`);
        } else {
          if (!item.name && !item.label) {
            errors.push(`Item ${index} must have 'name' or 'label' property`);
          }
          if (item.value === undefined && !item.values) {
            errors.push(`Item ${index} must have 'value' property`);
          }
        }
      });
      break;
    
    case 'scatter':
      data.forEach((item, index) => {
        if (typeof item !== 'object') {
          errors.push(`Item ${index} must be an object`);
        } else {
          if (item.x === undefined) {
            errors.push(`Item ${index} must have 'x' property`);
          }
          if (item.y === undefined) {
            errors.push(`Item ${index} must have 'y' property`);
          }
        }
      });
      break;
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

