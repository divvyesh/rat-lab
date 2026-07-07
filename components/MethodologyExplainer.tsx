import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Brain, TrendingUp, Target, Zap } from 'lucide-react';

interface MethodologyExplainerProps {
  expanded?: boolean;
}

const MethodologyExplainer: React.FC<MethodologyExplainerProps> = ({ expanded: defaultExpanded = false }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const methodologies = [
    {
      title: 'Kahneman Dual-Process Theory',
      icon: <Brain size={20} />,
      description: 'Models System 1 (fast, intuitive) and System 2 (slow, deliberate) thinking',
      details: 'Based on Daniel Kahneman\'s Nobel Prize-winning research. Personas can operate in System 1 mode (quick, emotional responses) or System 2 mode (careful, analytical thinking).'
    },
    {
      title: 'Behavioral Traits',
      icon: <TrendingUp size={20} />,
      description: 'Six core behavioral dimensions: risk aversion, loss aversion, price sensitivity, cognitive reflection, social conformity, novelty seeking',
      details: 'Each trait is measured on a 0-100 scale and influences how personas respond to stimuli. Traits are grounded in established behavioral economics research.'
    },
    {
      title: 'Heuristics & Biases',
      icon: <Target size={20} />,
      description: 'Models cognitive shortcuts: availability, anchoring, social proof, scarcity',
      details: 'Personas apply real-world heuristics when making decisions, making their responses more realistic and human-like.'
    },
    {
      title: 'Isolated Execution',
      icon: <Zap size={20} />,
      description: 'Each persona simulation runs in complete isolation to prevent contamination',
      details: 'Critical for valid research. Each persona responds independently without knowledge of other participants, preventing LLM herd mentality and ensuring authentic individual responses.'
    },
    {
      title: 'Statistical Rigor',
      icon: <TrendingUp size={20} />,
      description: 'Hypothesis testing with p-values, confidence intervals, effect sizes (Cohen\'s d)',
      details: 'Analysis includes proper statistical tests, not just descriptive statistics. Results are suitable for academic publication and peer review.'
    },
    {
      title: 'Individual-Level Analysis',
      icon: <Brain size={20} />,
      description: 'Identifies standout individuals, not just cohort averages',
      details: 'Goes beyond segment-level insights to find unique patterns in individual responses. Reveals outliers and unexpected behaviors that cohort averages hide.'
    }
  ];

  return (
    <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-3">
          <BookOpen className="text-indigo-400" size={24} />
          <div className="text-left">
            <h2 className="text-xl font-bold text-white">Methodology</h2>
            <p className="text-sm text-zinc-500">How Rat Lab works under the hood</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="text-zinc-500" size={20} />
        ) : (
          <ChevronDown className="text-zinc-500" size={20} />
        )}
      </button>

      {expanded && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-sm text-zinc-400 mb-6">
            Rat Lab is built on established behavioral science principles and statistical methods. 
            Unlike proprietary platforms, we're transparent about our methodology.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {methodologies.map((method, index) => (
              <div
                key={index}
                className="p-5 bg-zinc-950/50 border border-white/5 rounded-xl hover:border-indigo-500/30 transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-indigo-400 p-2 bg-indigo-500/10 rounded-lg">
                    {method.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-white mb-1">{method.title}</h3>
                    <p className="text-xs text-zinc-500 mb-2">{method.description}</p>
                    <details className="text-xs">
                      <summary className="text-indigo-400 cursor-pointer hover:text-indigo-300">
                        Learn more
                      </summary>
                      <p className="text-zinc-400 mt-2 leading-relaxed">{method.details}</p>
                    </details>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <p className="text-sm text-indigo-300">
              <strong>Why this matters:</strong> Transparent methodology builds trust and enables 
              peer review. You can confidently publish, present, and make decisions based on Rat Lab research.
            </p>
          </div>

          <div className="mt-4 text-xs text-zinc-600">
            <p>
              <strong>References:</strong> Kahneman, D. (2011). Thinking, Fast and Slow. 
              Tversky, A., & Kahneman, D. (1974). Judgment under Uncertainty: Heuristics and Biases.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MethodologyExplainer;



