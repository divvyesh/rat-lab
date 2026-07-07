import React from 'react';
import { User, Quote, TrendingUp, Star } from 'lucide-react';
import { SimulationResult, Persona } from '../types';

interface IndividualInsightsProps {
  results: SimulationResult[];
  personas: Persona[];
}

const IndividualInsights: React.FC<IndividualInsightsProps> = ({ results, personas }) => {
  // Find standout personas (high confidence, unique responses)
  const findStandoutPersonas = () => {
    if (results.length === 0) return [];

    // Calculate average confidence
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    // Find personas with above-average confidence and unique responses
    const standouts = results
      .filter(r => r.confidence > avgConfidence + 10)
      .map(r => {
        const persona = personas.find(p => p.id === r.personaId);
        const uniqueWords = new Set(
          r.responses.flatMap(resp => resp.answer.toLowerCase().split(/\s+/))
        );
        return {
          result: r,
          persona,
          uniqueness: uniqueWords.size,
          avgResponseLength: r.responses.reduce((sum, resp) => sum + resp.answer.length, 0) / r.responses.length
        };
      })
      .sort((a, b) => b.uniqueness - a.uniqueness)
      .slice(0, 5);

    return standouts;
  };

  const standouts = findStandoutPersonas();

  // Find personas with most positive responses
  const mostPositive = results
    .map(r => ({
      result: r,
      persona: personas.find(p => p.id === r.personaId),
      positiveCount: r.responses.filter(resp => resp.sentiment === 'Positive').length
    }))
    .sort((a, b) => b.positiveCount - a.positiveCount)
    .slice(0, 3);

  // Find personas with most negative responses
  const mostNegative = results
    .map(r => ({
      result: r,
      persona: personas.find(p => p.id === r.personaId),
      negativeCount: r.responses.filter(resp => resp.sentiment === 'Negative').length
    }))
    .sort((a, b) => b.negativeCount - a.negativeCount)
    .slice(0, 3);

  if (results.length === 0) {
    return (
      <div className="p-8 bg-zinc-900/30 border border-white/5 rounded-2xl text-center">
        <p className="text-zinc-500">Run a simulation to see individual-level insights</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Individual-Level Insights</h2>
        <p className="text-zinc-400 text-sm">
          Go beyond cohort averages. Discover standout individuals and unique response patterns.
          <strong className="text-indigo-400"> This is what Artificial Societies doesn't offer.</strong>
        </p>
      </div>

      {/* Standout Personas */}
      {standouts.length > 0 && (
        <div className="p-6 bg-zinc-900/30 border border-white/5 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Star className="text-amber-400" size={20} />
            <h3 className="text-lg font-bold text-white">Standout Personas</h3>
          </div>
          <p className="text-sm text-zinc-400 mb-4">
            These individuals provided unique insights that cohort averages would hide.
          </p>
          <div className="space-y-4">
            {standouts.map((standout, idx) => (
              <div
                key={idx}
                className="p-4 bg-zinc-950/50 border border-white/5 rounded-xl"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-sm font-bold text-white mb-1">
                      {standout.persona?.name || standout.result.personaName}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {standout.persona?.occupation || 'Unknown'} • Confidence: {standout.result.confidence}%
                    </div>
                  </div>
                  <div className="px-2 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold rounded border border-amber-500/20">
                    Standout
                  </div>
                </div>
                <div className="space-y-2">
                  {standout.result.responses.slice(0, 2).map((resp, respIdx) => (
                    <div key={respIdx} className="p-3 bg-zinc-900/50 rounded-lg border-l-2 border-indigo-500/50">
                      <div className="text-xs text-zinc-500 mb-1">{resp.questionText}</div>
                      <div className="text-sm text-zinc-300 italic">"{resp.answer.substring(0, 150)}..."</div>
                      <div className="text-xs text-zinc-600 mt-1">
                        Sentiment: <span className={`font-bold ${
                          resp.sentiment === 'Positive' ? 'text-emerald-400' :
                          resp.sentiment === 'Negative' ? 'text-red-400' :
                          'text-zinc-400'
                        }`}>{resp.sentiment}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Most Positive */}
      {mostPositive.length > 0 && (
        <div className="p-6 bg-zinc-900/30 border border-white/5 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-emerald-400" size={20} />
            <h3 className="text-lg font-bold text-white">Most Positive Respondents</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mostPositive.map((item, idx) => (
              <div
                key={idx}
                className="p-4 bg-zinc-950/50 border border-emerald-500/20 rounded-xl"
              >
                <div className="text-sm font-bold text-white mb-1">
                  {item.persona?.name || item.result.personaName}
                </div>
                <div className="text-xs text-zinc-500 mb-2">
                  {item.positiveCount} positive responses
                </div>
                <div className="text-xs text-emerald-400 font-bold">
                  {((item.positiveCount / item.result.responses.length) * 100).toFixed(0)}% positive
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Most Negative */}
      {mostNegative.length > 0 && (
        <div className="p-6 bg-zinc-900/30 border border-white/5 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-red-400 rotate-180" size={20} />
            <h3 className="text-lg font-bold text-white">Most Critical Respondents</h3>
          </div>
          <p className="text-sm text-zinc-400 mb-4">
            Understanding concerns helps improve your product or messaging.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mostNegative.map((item, idx) => (
              <div
                key={idx}
                className="p-4 bg-zinc-950/50 border border-red-500/20 rounded-xl"
              >
                <div className="text-sm font-bold text-white mb-1">
                  {item.persona?.name || item.result.personaName}
                </div>
                <div className="text-xs text-zinc-500 mb-2">
                  {item.negativeCount} negative responses
                </div>
                {item.result.responses.find(r => r.sentiment === 'Negative') && (
                  <div className="text-xs text-red-400 italic mt-2">
                    "{item.result.responses.find(r => r.sentiment === 'Negative')?.answer.substring(0, 80)}..."
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Individual Response Patterns */}
      <div className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
        <div className="flex items-start gap-3">
          <User className="text-indigo-400 flex-shrink-0 mt-1" size={20} />
          <div>
            <h3 className="text-sm font-bold text-white mb-2">
              Why Individual-Level Analysis Matters
            </h3>
            <p className="text-xs text-indigo-300 leading-relaxed">
              Cohort averages hide important patterns. Individual-level analysis reveals:
              outliers who represent new market opportunities, unique concerns that need addressing,
              and unexpected correlations between traits and behaviors. This depth of insight is
              what sets Rat Lab apart from platforms that only show segment-level data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndividualInsights;



