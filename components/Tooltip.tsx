import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = triggerRect.top + scrollY - tooltipRect.height - 8;
          left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'bottom':
          top = triggerRect.bottom + scrollY + 8;
          left = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'left':
          top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.left + scrollX - tooltipRect.width - 8;
          break;
        case 'right':
          top = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.right + scrollX + 8;
          break;
      }

      // Keep tooltip within viewport
      const padding = 8;
      if (top < scrollY + padding) top = scrollY + padding;
      if (left < scrollX + padding) left = scrollX + padding;
      if (left + tooltipRect.width > scrollX + window.innerWidth - padding) {
        left = scrollX + window.innerWidth - tooltipRect.width - padding;
      }

      setTooltipPosition({ top, left });
    }
  }, [isVisible, position]);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className={`inline-block ${className}`}
      >
        {children}
      </div>
      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-[300] px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-xs text-white shadow-2xl pointer-events-none animate-in fade-in zoom-in-95 duration-200 max-w-xs"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`
          }}
        >
          {content}
          <div
            className={`absolute w-2 h-2 bg-zinc-900 border-white/10 ${
              position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2 border-b-0 border-r-0 rotate-45' :
              position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2 border-t-0 border-l-0 rotate-45' :
              position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2 border-l-0 border-b-0 rotate-45' :
              'left-[-4px] top-1/2 -translate-y-1/2 border-r-0 border-t-0 rotate-45'
            }`}
          />
        </div>
      )}
    </>
  );
};

export const InfoTooltip: React.FC<{ content: string; className?: string }> = ({
  content,
  className = ''
}) => {
  return (
    <Tooltip content={content} position="top" className={className}>
      <button
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-zinc-800 text-zinc-500 hover:bg-indigo-500 hover:text-white transition-all border border-white/5"
        aria-label="More information"
      >
        <Info size={10} strokeWidth={3} />
      </button>
    </Tooltip>
  );
};

export default Tooltip;



