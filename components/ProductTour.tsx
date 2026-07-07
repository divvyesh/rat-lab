import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { AppView } from '../types';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for highlighting
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void; // Action to perform (e.g., navigate)
}

interface ProductTourProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: AppView) => void;
  steps?: TourStep[];
}

const defaultSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Rat Lab',
    description: 'Your AI-powered behavioral research platform. Let\'s take a quick tour to get you started.',
    position: 'bottom'
  },
  {
    id: 'cohorts',
    title: 'Create Cohorts',
    description: 'Build AI personas representing your target market segments. Define behavioral traits, demographics, and psychographics.',
    target: '[data-tour="cohorts"]',
    position: 'bottom',
    action: () => {
      // Navigate to cohorts
    }
  },
  {
    id: 'simulations',
    title: 'Run Simulations',
    description: 'Design surveys and behavioral tests. Present visual stimuli and measure how your personas react.',
    target: '[data-tour="simulations"]',
    position: 'bottom'
  },
  {
    id: 'analysis',
    title: 'Analyze Results',
    description: 'Get statistical insights, GTM recommendations, and behavioral analysis powered by advanced models.',
    target: '[data-tour="analysis"]',
    position: 'bottom'
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'Start by creating your first cohort, then run simulations to see how your personas respond.',
    position: 'bottom'
  }
];

const ProductTour: React.FC<ProductTourProps> = ({
  isOpen,
  onClose,
  onNavigate,
  steps = defaultSteps
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const step = steps[currentStep];
    if (step?.target) {
      const element = document.querySelector(step.target) as HTMLElement;
      setHighlightedElement(element);
      
      // Scroll to element
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setHighlightedElement(null);
    }

    // Execute action if present
    if (step?.action) {
      step.action();
    }
  }, [currentStep, isOpen, steps]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirst) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm" />
      
      {/* Highlight overlay */}
      {highlightedElement && (
        <div
          className="fixed z-[201] pointer-events-none"
          style={{
            top: highlightedElement.offsetTop - 8,
            left: highlightedElement.offsetLeft - 8,
            width: highlightedElement.offsetWidth + 16,
            height: highlightedElement.offsetHeight + 16,
            border: '2px solid #6366f1',
            borderRadius: '12px',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
          }}
        />
      )}

      {/* Tour Card */}
      <div className="fixed z-[202] bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-zinc-900 border-2 border-indigo-500/50 rounded-3xl p-6 shadow-2xl">
          {/* Progress */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Step {currentStep + 1} of {steps.length}
            </div>
            <button
              onClick={handleSkip}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1 bg-zinc-800 rounded-full mb-6 overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Content */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">{step.description}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={isFirst}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ChevronLeft size={16} /> Previous
            </button>

            <div className="flex gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'bg-indigo-500 w-6'
                      : index < currentStep
                      ? 'bg-indigo-500/50'
                      : 'bg-zinc-700'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
            >
              {isLast ? (
                <>
                  <CheckCircle2 size={16} /> Get Started
                </>
              ) : (
                <>
                  Next <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductTour;



