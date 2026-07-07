import React, { ReactNode } from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

export type ErrorDisplayVariant = 'banner' | 'compact' | 'inline';

export interface ErrorDisplayProps {
  /** User-facing error message */
  message: string;
  /** Optional title; default "Error" for banner/compact */
  title?: string;
  /** Visual variant */
  variant?: ErrorDisplayVariant;
  /** Whether to show a dismiss button */
  dismissible?: boolean;
  /** Called when user dismisses */
  onDismiss: () => void;
  /** Show retry button; typically when error is retryable */
  onRetry?: () => void;
  /** Optional extra content (e.g. setup instructions, technical details) */
  details?: ReactNode;
  /** Additional CSS classes for the root element */
  className?: string;
}

/**
 * Consistent error display used across PersonaBuilder, ExperimentLab, Login,
 * APIPlayground, and other surfaces. Supports banner, compact, and inline variants.
 */
const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  message,
  title = 'Error',
  variant = 'banner',
  dismissible = true,
  onDismiss,
  onRetry,
  details,
  className = ''
}) => {
  const baseClasses = 'flex items-start gap-3';
  const variantClasses = {
    banner:
      'bg-red-500/10 border border-red-500/20 rounded-2xl p-4 animate-in fade-in',
    compact:
      'bg-red-500/10 border-b border-red-500/20 p-4',
    inline: 'text-red-400 text-sm'
  };
  const rootClassName = `${baseClasses} ${variantClasses[variant]} ${className}`.trim();

  if (variant === 'inline') {
    return (
      <div className={rootClassName}>
        <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={14} />
        <span>{message}</span>
        {dismissible && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-red-400 hover:text-red-300 transition-colors ml-1"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        )}
      </div>
    );
  }

  const iconSize = variant === 'compact' ? 18 : 20;

  return (
    <div className={rootClassName}>
      <AlertCircle
        className="text-red-400 flex-shrink-0 mt-0.5"
        size={iconSize}
        aria-hidden
      />
      <div className="flex-1 min-w-0">
        {title ? <div className="text-sm font-bold text-red-400 mb-1">{title}</div> : null}
        <div className="text-sm text-red-300">{message}</div>
        {details && (
          <div className="mt-3 text-xs text-zinc-500">{details}</div>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <RefreshCw size={14} /> Retry
          </button>
        )}
        {dismissible && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-red-400 hover:text-red-300 transition-colors p-1"
            aria-label="Dismiss"
          >
            <X size={iconSize} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;
