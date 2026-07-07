/**
 * Performance Optimization Utilities
 * Provides code splitting, lazy loading, memoization, and performance monitoring
 */

/**
 * Debounce function to limit function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Memoize function results
 */
export function memoize<Args extends any[], Return>(
  fn: (...args: Args) => Return,
  getKey?: (...args: Args) => string
): (...args: Args) => Return {
  const cache = new Map<string, Return>();

  return (...args: Args): Return => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Lazy load a component (requires React.lazy in component file)
 * This is a helper function - use React.lazy directly in components
 */
export function createLazyComponent<T>(
  importFunc: () => Promise<{ default: T }>
): () => Promise<{ default: T }> {
  return importFunc;
}

/**
 * Performance monitor
 */
export class PerformanceMonitor {
  private static marks: Map<string, number> = new Map();
  private static measures: Map<string, number> = new Map();

  static mark(name: string): void {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name);
    }
    this.marks.set(name, Date.now());
  }

  static measure(name: string, startMark: string, endMark: string): number {
    if (typeof performance !== 'undefined' && performance.measure) {
      performance.measure(name, startMark, endMark);
    }

    const start = this.marks.get(startMark);
    const end = this.marks.get(endMark);

    if (start && end) {
      const duration = end - start;
      this.measures.set(name, duration);
      return duration;
    }

    return 0;
  }

  static getMeasure(name: string): number | undefined {
    return this.measures.get(name);
  }

  static getAllMeasures(): Record<string, number> {
    return Object.fromEntries(this.measures);
  }

  static clear(): void {
    this.marks.clear();
    this.measures.clear();
  }
}

/**
 * Measure async function performance
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  PerformanceMonitor.mark(`${name}-start`);
  try {
    const result = await fn();
    PerformanceMonitor.mark(`${name}-end`);
    PerformanceMonitor.measure(name, `${name}-start`, `${name}-end`);
    return result;
  } catch (error) {
    PerformanceMonitor.mark(`${name}-end`);
    PerformanceMonitor.measure(name, `${name}-start`, `${name}-end`);
    throw error;
  }
}

/**
 * Batch operations for better performance
 */
export function batchOperations<T, R>(
  items: T[],
  batchSize: number,
  operation: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  return Promise.all(batches.map(operation)).then(results => results.flat());
}

/**
 * Optimize re-renders with requestAnimationFrame
 */
export function scheduleUpdate(callback: () => void): void {
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(callback);
  } else {
    setTimeout(callback, 0);
  }
}

/**
 * Check if component should update (shallow comparison)
 */
export function shouldUpdate<T extends Record<string, any>>(
  prevProps: T,
  nextProps: T,
  keys?: (keyof T)[]
): boolean {
  const keysToCheck = keys || Object.keys(nextProps) as (keyof T)[];

  return keysToCheck.some(key => {
    return prevProps[key] !== nextProps[key];
  });
}

/**
 * Virtual scrolling helper
 */
export function getVisibleRange(
  scrollTop: number,
  itemHeight: number,
  containerHeight: number,
  totalItems: number
): { start: number; end: number } {
  const start = Math.floor(scrollTop / itemHeight);
  const end = Math.min(
    start + Math.ceil(containerHeight / itemHeight) + 1,
    totalItems
  );

  return { start: Math.max(0, start), end };
}

/**
 * Image lazy loading helper
 */
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') {
    return null;
  }

  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.01,
    ...options
  });
}

/**
 * Preload resources
 */
export function preloadResource(url: string, type: 'image' | 'script' | 'style' = 'image'): Promise<void> {
  return new Promise((resolve, reject) => {
    if (type === 'image') {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    } else if (type === 'script') {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'script';
      link.href = url;
      link.onload = () => resolve();
      link.onerror = reject;
      document.head.appendChild(link);
    } else if (type === 'style') {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = url;
      link.onload = () => resolve();
      link.onerror = reject;
      document.head.appendChild(link);
    }
  });
}

/**
 * Check if device is mobile
 */
export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Check if connection is slow
 */
export function isSlowConnection(): boolean {
  if ('connection' in navigator) {
    const conn = (navigator as any).connection;
    if (conn) {
      return conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g';
    }
  }
  return false;
}

/**
 * Optimize for slow connections
 */
export function shouldOptimizeForSlowConnection(): boolean {
  return isSlowConnection() || isMobile();
}

