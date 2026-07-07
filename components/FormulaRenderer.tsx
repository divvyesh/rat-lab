import React from 'react';
import { Copy, Check } from 'lucide-react';
import { Formula } from '../types';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface FormulaRendererProps {
  formula: Formula;
  showDescription?: boolean;
  showVariables?: boolean;
  showResult?: boolean;
}

const FormulaRenderer: React.FC<FormulaRendererProps> = ({
  formula,
  showDescription = true,
  showVariables = true,
  showResult = true
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(formula.latex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-zinc-950/60 border border-white/5 rounded-xl p-6 hover:border-indigo-500/20 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          {showDescription && formula.description && (
            <p className="text-sm text-zinc-400 mb-3">{formula.description}</p>
          )}
          
          {/* Formula Display */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-lg p-4 overflow-x-auto">
            <BlockMath math={formula.latex} />
          </div>
          
          {/* Variables */}
          {showVariables && Object.keys(formula.variables).length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Variables:</p>
              <div className="flex flex-wrap gap-3">
                {Object.entries(formula.variables).map(([key, value]) => (
                  <div key={key} className="bg-zinc-900/50 border border-white/5 rounded-lg px-3 py-1.5">
                    <span className="text-xs text-zinc-400">
                      <InlineMath math={key} /> = {typeof value === 'number' ? value.toFixed(2) : value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Result */}
          {showResult && formula.result !== undefined && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Result:</span>
                <span className="text-lg font-bold text-indigo-400 font-mono">
                  {formula.result.toFixed(4)}
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="ml-4 p-2 bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
          title="Copy formula"
        >
          {copied ? (
            <Check size={16} className="text-emerald-400" />
          ) : (
            <Copy size={16} className="text-zinc-400" />
          )}
        </button>
      </div>
    </div>
  );
};

export default FormulaRenderer;

