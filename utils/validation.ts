/**
 * Data Validation Utilities
 * Provides comprehensive input validation, type checking, and business rule validation
 */

import { Persona, PersonaSegment, Question, SimulationResult, BehavioralTraits } from '../types';

/**
 * Validates behavioral traits (0-100 range)
 */
export function validateTraits(traits: Partial<BehavioralTraits>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const traitNames: (keyof BehavioralTraits)[] = [
    'riskAversion',
    'lossAversion',
    'priceSensitivity',
    'cognitiveReflection',
    'socialConformity',
    'noveltySeeking'
  ];

  traitNames.forEach(trait => {
    if (traits[trait] !== undefined) {
      const value = traits[trait]!;
      if (typeof value !== 'number' || value < 0 || value > 100) {
        errors.push(`${trait} must be a number between 0 and 100`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates persona data
 */
export function validatePersona(persona: Partial<Persona>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!persona.name || persona.name.trim().length === 0) {
    errors.push('Persona name is required');
  }

  if (persona.age !== undefined) {
    if (typeof persona.age !== 'number' || persona.age < 18 || persona.age > 100) {
      errors.push('Age must be a number between 18 and 100');
    }
  }

  if (!persona.occupation || persona.occupation.trim().length === 0) {
    errors.push('Occupation is required');
  }

  if (!persona.location || persona.location.trim().length === 0) {
    errors.push('Location is required');
  }

  if (persona.traits) {
    const traitValidation = validateTraits(persona.traits);
    if (!traitValidation.valid) {
      errors.push(...traitValidation.errors);
    }
  }

  if (persona.avatarId !== undefined) {
    if (typeof persona.avatarId !== 'number' || persona.avatarId < 1 || persona.avatarId > 1000) {
      errors.push('Avatar ID must be between 1 and 1000');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates persona segment
 */
export function validateSegment(segment: Partial<PersonaSegment>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!segment.name || segment.name.trim().length === 0) {
    errors.push('Segment name is required');
  }

  if (segment.count !== undefined) {
    if (typeof segment.count !== 'number' || segment.count < 1 || segment.count > 1000) {
      errors.push('Persona count must be between 1 and 1000');
    }
  }

  if (!segment.description || segment.description.trim().length === 0) {
    errors.push('Segment description is required');
  }

  if (segment.traits) {
    const traitValidation = validateTraits(segment.traits);
    if (!traitValidation.valid) {
      errors.push(...traitValidation.errors);
    }
  }

  if (segment.color && !/^#[0-9A-F]{6}$/i.test(segment.color)) {
    errors.push('Color must be a valid hex color code');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates question data
 */
export function validateQuestion(question: Partial<Question>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!question.text || question.text.trim().length === 0) {
    errors.push('Question text is required');
  }

  if (question.type) {
    // Validate options for multiple choice questions
    if (
      ['MULTIPLE_CHOICE', 'CHECKBOXES', 'DROPDOWN'].includes(question.type) &&
      (!question.options || question.options.length === 0)
    ) {
      errors.push(`${question.type} questions require at least one option`);
    }

    // Validate scale ranges
    if (question.type === 'LINEAR_SCALE') {
      if (question.scaleMin !== undefined && question.scaleMax !== undefined) {
        if (question.scaleMin >= question.scaleMax) {
          errors.push('Scale minimum must be less than maximum');
        }
        if (question.scaleMin < 0 || question.scaleMax > 100) {
          errors.push('Scale values must be between 0 and 100');
        }
      }
    }

    // Validate rating max
    if (question.type === 'RATING' && question.ratingMax !== undefined) {
      if (question.ratingMax < 1 || question.ratingMax > 10) {
        errors.push('Rating maximum must be between 1 and 10');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates simulation result
 */
export function validateSimulationResult(result: Partial<SimulationResult>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!result.personaId) {
    errors.push('Persona ID is required');
  }

  if (!result.personaName) {
    errors.push('Persona name is required');
  }

  if (!result.segmentId) {
    errors.push('Segment ID is required');
  }

  if (!result.responses || result.responses.length === 0) {
    errors.push('At least one response is required');
  }

  if (result.confidence !== undefined) {
    if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 100) {
      errors.push('Confidence must be between 0 and 100');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates URL format
 */
export function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates UUID format
 */
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitizes string input (removes dangerous characters)
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Remove potential HTML tags
}

/**
 * Validates and sanitizes user input
 */
export function validateAndSanitizeInput(
  input: string,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  } = {}
): { valid: boolean; sanitized: string; error?: string } {
  const { required = false, minLength, maxLength, pattern } = options;

  if (required && (!input || input.trim().length === 0)) {
    return {
      valid: false,
      sanitized: '',
      error: 'This field is required'
    };
  }

  const sanitized = sanitizeString(input, maxLength);

  if (minLength && sanitized.length < minLength) {
    return {
      valid: false,
      sanitized,
      error: `Must be at least ${minLength} characters`
    };
  }

  if (maxLength && sanitized.length > maxLength) {
    return {
      valid: false,
      sanitized,
      error: `Must be no more than ${maxLength} characters`
    };
  }

  if (pattern && !pattern.test(sanitized)) {
    return {
      valid: false,
      sanitized,
      error: 'Invalid format'
    };
  }

  return {
    valid: true,
    sanitized
  };
}

/**
 * Type guard for Persona
 */
export function isPersona(obj: any): obj is Persona {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.age === 'number' &&
    typeof obj.occupation === 'string' &&
    typeof obj.location === 'string' &&
    obj.traits &&
    typeof obj.traits.riskAversion === 'number'
  );
}

/**
 * Type guard for PersonaSegment
 */
export function isPersonaSegment(obj: any): obj is PersonaSegment {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.count === 'number' &&
    obj.traits &&
    typeof obj.traits.riskAversion === 'number'
  );
}

/**
 * Type guard for Question
 */
export function isQuestion(obj: any): obj is Question {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.text === 'string'
  );
}

/**
 * Validates array of items
 */
export function validateArray<T>(
  items: T[],
  validator: (item: T) => { valid: boolean; errors: string[] },
  options: { minLength?: number; maxLength?: number } = {}
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const { minLength, maxLength } = options;

  if (minLength !== undefined && items.length < minLength) {
    errors.push(`At least ${minLength} item(s) required`);
  }

  if (maxLength !== undefined && items.length > maxLength) {
    errors.push(`Maximum ${maxLength} item(s) allowed`);
  }

  items.forEach((item, index) => {
    const validation = validator(item);
    if (!validation.valid) {
      validation.errors.forEach(error => {
        errors.push(`Item ${index + 1}: ${error}`);
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}



