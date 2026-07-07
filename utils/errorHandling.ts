/**
 * Comprehensive Error Handling Utilities
 * Provides robust error handling, retry mechanisms, and graceful degradation
 */

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: ErrorContext,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Wraps async functions with error handling and retry logic
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    retryDelay?: number;
    context?: ErrorContext;
    onError?: (error: Error) => void;
  } = {}
): Promise<T> {
  const {
    retries = 3,
    retryDelay = 1000,
    context,
    onError
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Log error with context
      console.error('Error occurred:', {
        attempt: attempt + 1,
        error: error.message,
        context,
        stack: error.stack
      });

      // Call error handler if provided
      if (onError) {
        onError(error);
      }

      // Don't retry on last attempt or if error is not retryable
      if (attempt === retries || (error instanceof AppError && !error.retryable)) {
        break;
      }

      // Wait before retrying (exponential backoff)
      const delay = retryDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Throw user-friendly error
  throw createUserFriendlyError(lastError!, context);
}

/**
 * Creates user-friendly error messages
 */
export function createUserFriendlyError(error: Error, context?: ErrorContext): AppError {
  if (error instanceof AppError) return error;
  const errorMessage = error.message.toLowerCase();

  // API errors
  if (errorMessage.includes('api') || errorMessage.includes('network')) {
    return new AppError(
      'Unable to connect to the server. Please check your internet connection and try again.',
      'NETWORK_ERROR',
      context,
      true
    );
  }

  // Authentication errors
  if (errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
    return new AppError(
      'Your session has expired. Please sign in again.',
      'AUTH_ERROR',
      context,
      false
    );
  }

  // Validation errors
  if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
    return new AppError(
      'The information you entered is invalid. Please check and try again.',
      'VALIDATION_ERROR',
      context,
      false
    );
  }

  // Rate limiting
  if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
    return new AppError(
      'Too many requests. Please wait a moment and try again.',
      'RATE_LIMIT_ERROR',
      context,
      true
    );
  }

  // Token exhaustion / quota
  if (
    errorMessage.includes('token') && (errorMessage.includes('exhausted') || errorMessage.includes('quota') || errorMessage.includes('insufficient'))
  ) {
    return new AppError(
      'You’ve run out of tokens. Please upgrade your plan or try again later.',
      'TOKEN_EXHAUSTION_ERROR',
      context,
      false
    );
  }

  // Timeout
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out') || errorMessage.includes('deadline')) {
    return new AppError(
      'The operation took too long. Please try again.',
      'TIMEOUT_ERROR',
      context,
      true
    );
  }

  // API key / configuration
  if (
    errorMessage.includes('api_key') ||
    errorMessage.includes('apikey') ||
    errorMessage.includes('api key') ||
    errorMessage.includes('invalid api key') ||
    errorMessage.includes('authentication')
  ) {
    return new AppError(
      'API configuration issue. Please check your API key in settings.',
      'API_CONFIG_ERROR',
      context,
      false
    );
  }

  // Generic error
  return new AppError(
    'Something went wrong. Please try again or contact support if the problem persists.',
    'UNKNOWN_ERROR',
    context,
    true
  );
}

/**
 * Report an error: create user-friendly message, update UI state, and log.
 * Use with React setState for error display.
 */
export function reportError(
  error: unknown,
  setError: (message: string | null) => void,
  context?: ErrorContext
): void {
  const err = error instanceof Error ? error : new Error(String(error));
  const friendly = createUserFriendlyError(err, context);
  setError(friendly.message);
  logError(err, context);
}

/**
 * Error boundary helper for React components
 */
export function getErrorBoundaryFallback(error: Error, errorInfo: any) {
  return {
    title: 'Something went wrong',
    message: createUserFriendlyError(error).message,
    action: 'Try refreshing the page or contact support if the problem persists.',
    errorDetails: process.env.NODE_ENV === 'development' ? {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack
    } : undefined
  };
}

/**
 * Logs errors to console and optionally to external service
 */
export function logError(error: Error, context?: ErrorContext) {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    context: {
      ...context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }
  };

  console.error('Error logged:', errorLog);

  // In production, you could send this to an error tracking service
  // Example: Sentry.captureException(error, { extra: context });
}

/**
 * Handles Firebase errors specifically
 */
export function handleFirebaseError(error: any): AppError {
  const code = error.code || 'UNKNOWN';
  const message = error.message || 'Firebase operation failed';

  // Map Firebase error codes to user-friendly messages
  const errorMap: Record<string, string> = {
    'auth/user-not-found': 'User account not found. Please sign in again.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/weak-password': 'Password is too weak. Please use a stronger password.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'permission-denied': 'You don\'t have permission to perform this action.',
    'unavailable': 'Service temporarily unavailable. Please try again later.'
  };

  return new AppError(
    errorMap[code] || message,
    code,
    { action: 'firebase_operation' },
    code === 'unavailable' || code === 'network-request-failed'
  );
}

/**
 * Graceful degradation helper
 */
export function withGracefulDegradation<T, F>(
  primaryFn: () => Promise<T>,
  fallbackFn: () => Promise<F>,
  fallbackMessage?: string
): Promise<T | F> {
  return withErrorHandling(primaryFn, {
    retries: 1,
    onError: () => {
      console.warn(fallbackMessage || 'Primary operation failed, using fallback');
    }
  }).catch(() => {
    return fallbackFn();
  });
}



