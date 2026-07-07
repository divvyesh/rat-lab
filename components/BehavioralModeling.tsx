import React, { useState } from 'react';
import { Brain, TrendingUp, Target, Zap, BarChart3 } from 'lucide-react';
import { Persona, PersonaSegment } from '../types';

interface BehavioralModelingProps {
  personas: Persona[];
  segments: PersonaSegment[];
}

const BehavioralModeling: React.FC<BehavioralModelingProps> = ({ personas, segments }) => {
  const [selectedTrait, setSelectedTrait] = useState<keyof Persona['traits'] | null>(null);

  const traitNames: Record<keyof Persona['traits'], string> = {
    riskAversion: 'Risk Aversion',
    lossAversion: 'Loss Aversion',
    priceSensitivity: 'Price Sensitivity',
    cognitiveReflection: 'Cognitive Reflection',
    socialConformity: 'Social Conformity',
    noveltySeeking: 'Novelty Seeking'
  };

  // Calculate trait distributions
  const calculateTraitDistribution = (trait: keyof Persona['traits']) => {
    const values = personas.map(p => p.traits[trait]);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const stdDev = Math.sqrt(
      values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length
    );

    // Distribution buckets
    const buckets = [0, 20, 40, 60, 80, 100];
    const distribution = buckets.map((bucket, i) => {
      const nextBucket = buckets[i + 1] || 101;
      const count = values.filter(v => v >= bucket && v < nextBucket).length;
      return {
        range: `${bucket}-${nextBucket - 1}`,
        count,
        percentage: (count / values.length) * 100
      };
    });

    return { avg, min, max, stdDev, distribution };
  };

  // Calculate trait correlations
  const calculateCorrelations = () => {
    const traits: (keyof Persona['traits'])[] = [
      'riskAversion',
      'lossAversion',
      'priceSensitivity',
      'cognitiveReflection',
      'socialConformity',
      'noveltySeeking'
    ];

    const correlations: Array<{
      trait1: string;
      trait2: string;
      correlation: number;
    }> = [];

    for (let i = 0; i < traits.length; i++) {
      for (let j = i + 1; j < traits.length; j++) {
        const t1 = traits[i];
        const t2 = traits[j];
        const values1 = personas.map(p => p.traits[t1]);
        const values2 = personas.map(p => p.traits[t2]);

        const avg1 = values1.reduce((a, b) => a + b, 0) / values1.length;
        const avg2 = values2.reduce((a, b) => a + b, 0) / values2.length;

        const numerator = values1.reduce((sum, v1, idx) => {
          return sum + (v1 - avg1) * (values2[idx] - avg2);
        }, 0);

        const denom1 = Math.sqrt(
          values1.reduce((sum, v) => sum + Math.pow(v - avg1, 2), 0)
        );
        const denom2 = Math.sqrt(
          values2.reduce((sum, v) => sum + Math.pow(v - avg2, 2), 0)
        );

        const correlation = numerator / (denom1 * denom2 || 1);

        correlations.push({
          trait1: traitNames[t1],
          trait2: traitNames[t2],
          correlation: isNaN(correlation) ? 0 : correlation
        });
      }
    }

    return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  };

  const correlations = calculateCorrelations();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Behavioral Modeling</h2>
        <p className="text-zinc-400 text-sm">
          Advanced behavioral science features that Artificial Societies doesn't offer.
        </p>
      </div>

      {/* System 1/2 Toggle Info */}
      <div className="p-6 bg-zinc-900/30 border border-white/5 rounded-2xl">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <Brain className="text-indigo-400" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-2">System 1 vs System 2 Thinking</h3>
            <p className="text-sm text-zinc-400 mb-4">
              Rat Lab uniquely models Kahneman's dual-process theory. Each persona can operate in:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-950/50 rounded-xl border border-white/5">
                <div className="text-sm font-bold text-emerald-400 mb-2">System 1 (Fast)</div>
                <ul className="text-xs text-zinc-500 space-y-1">
                  <li>• Quick, intuitive responses</li>
                  <li>• Emotional, gut reactions</li>
                  <li>• Uses heuristics</li>
                  <li>• 2-3 second thinking time</li>
                </ul>
              </div>
              <div className="p-4 bg-zinc-950/50 rounded-xl border border-white/5">
                <div className="text-sm font-bold text-blue-400 mb-2">System 2 (Slow)</div>
                <ul className="text-xs text-zinc-500 space-y-1">
                  <li>• Deliberate, analytical</li>
                  <li>• Rational, controlled</li>
                  <li>• Weighs pros and cons</li>
                  <li>• 30+ second thinking time</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trait Distribution */}
      <div className="p-6 bg-zinc-900/30 border border-white/5 rounded-2xl">
        <h3 className="text-lg font-bold text-white mb-4">Trait Distribution Analysis</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {Object.entries(traitNames).map(([key, name]) => {
            const dist = calculateTraitDistribution(key as keyof Persona['traits']);
            return (
              <button
                key={key}
                onClick={() => setSelectedTrait(selectedTrait === key ? null : key as keyof Persona['traits'])}
                className={`p-4 bg-zinc-950/50 border rounded-xl text-left transition-all ${
                  selectedTrait === key
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                <div className="text-xs font-bold text-zinc-500 mb-2">{name}</div>
                <div className="text-2xl font-bold text-white mb-1">{Math.round(dist.avg)}</div>
                <div className="text-xs text-zinc-600">
                  Range: {dist.min}-{dist.max}
                </div>
              </button>
            );
          })}
        </div>

        {selectedTrait && (
          <div className="mt-4 p-4 bg-zinc-950/50 rounded-xl border border-white/5">
            <h4 className="text-sm font-bold text-white mb-3">
              {traitNames[selectedTrait]} Distribution
            </h4>
            <div className="space-y-2">
              {calculateTraitDistribution(selectedTrait).distribution.map((bucket, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-20 text-xs text-zinc-500">{bucket.range}</div>
                  <div className="flex-1 bg-zinc-900 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all"
                      style={{ width: `${bucket.percentage}%` }}
                    />
                  </div>
                  <div className="w-12 text-xs text-zinc-400 text-right">
                    {bucket.count} ({bucket.percentage.toFixed(0)}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Trait Correlations */}
      <div className="p-6 bg-zinc-900/30 border border-white/5 rounded-2xl">
        <h3 className="text-lg font-bold text-white mb-4">Trait Correlations</h3>
        <p className="text-sm text-zinc-400 mb-4">
          Discover which behavioral traits are correlated across your personas.
        </p>
        <div className="space-y-2">
          {correlations.slice(0, 10).map((corr, idx) => (
            <div
              key={idx}
              className="p-3 bg-zinc-950/50 border border-white/5 rounded-xl flex items-center justify-between"
            >
              <div className="text-sm text-zinc-300">
                <span className="font-bold">{corr.trait1}</span>
                {' ↔ '}
                <span className="font-bold">{corr.trait2}</span>
              </div>
              <div className={`text-sm font-bold ${
                Math.abs(corr.correlation) > 0.5
                  ? 'text-emerald-400'
                  : Math.abs(corr.correlation) > 0.3
                  ? 'text-amber-400'
                  : 'text-zinc-500'
              }`}>
                {corr.correlation > 0 ? '+' : ''}{corr.correlation.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Heuristics Visualization */}
      <div className="p-6 bg-zinc-900/30 border border-white/5 rounded-2xl">
        <h3 className="text-lg font-bold text-white mb-4">Heuristics & Biases</h3>
        <p className="text-sm text-zinc-400 mb-4">
          Rat Lab models cognitive shortcuts that influence decision-making:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Availability', desc: 'Recent events bias' },
            { name: 'Anchoring', desc: 'First info dominance' },
            { name: 'Social Proof', desc: 'Following the crowd' },
            { name: 'Scarcity', desc: 'Perceived value increase' }
          ].map((heuristic, idx) => (
            <div
              key={idx}
              className="p-4 bg-zinc-950/50 border border-white/5 rounded-xl text-center"
            >
              <div className="text-sm font-bold text-white mb-1">{heuristic.name}</div>
              <div className="text-xs text-zinc-500">{heuristic.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BehavioralModeling;



