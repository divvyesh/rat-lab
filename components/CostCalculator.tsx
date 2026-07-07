import React, { useState } from 'react';
import { DollarSign, TrendingDown, Calculator, Zap } from 'lucide-react';

interface CostCalculatorProps {
  currentUsage?: {
    personas: number;
    simulations: number;
    apiCalls: number;
  };
}

const CostCalculator: React.FC<CostCalculatorProps> = ({ currentUsage }) => {
  const [personas, setPersonas] = useState(currentUsage?.personas || 30);
  const [simulations, setSimulations] = useState(currentUsage?.simulations || 10);
  const [apiCalls, setApiCalls] = useState(currentUsage?.apiCalls || 1000);

  // Cost calculations
  const ratLabCost = {
    base: 0, // Open source
    openai: (apiCalls * 0.002), // ~$0.002 per API call (GPT-4 Turbo)
    firebase: personas > 1000 ? 25 : 0, // Free tier covers most use cases
    total: () => (apiCalls * 0.002) + (personas > 1000 ? 25 : 0)
  };

  const artificialSocietiesCost = {
    base: 1000, // Estimated base subscription
    perUser: 200, // Per user/month
    users: 5, // Estimated team size
    total: () => 1000 + (200 * 5)
  };

  const savings = artificialSocietiesCost.total() - ratLabCost.total();
  const savingsPercent = ((savings / artificialSocietiesCost.total()) * 100).toFixed(0);

  return (
    <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Calculator className="text-indigo-400" size={24} />
          <h2 className="text-2xl font-bold text-white">Cost Calculator</h2>
        </div>
        <p className="text-zinc-400 text-sm">
          Compare Rat Lab costs with Artificial Societies. Adjust your usage to see savings.
        </p>
      </div>

      {/* Usage Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">
            Personas
          </label>
          <input
            type="number"
            value={personas}
            onChange={e => setPersonas(parseInt(e.target.value) || 0)}
            className="w-full px-4 py-2 bg-zinc-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/50"
            min="0"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">
            Simulations/Month
          </label>
          <input
            type="number"
            value={simulations}
            onChange={e => setSimulations(parseInt(e.target.value) || 0)}
            className="w-full px-4 py-2 bg-zinc-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/50"
            min="0"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">
            API Calls/Month
          </label>
          <input
            type="number"
            value={apiCalls}
            onChange={e => setApiCalls(parseInt(e.target.value) || 0)}
            className="w-full px-4 py-2 bg-zinc-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/50"
            min="0"
          />
        </div>
      </div>

      {/* Cost Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Rat Lab Cost */}
        <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="text-emerald-400" size={20} />
            <h3 className="text-lg font-bold text-white">Rat Lab</h3>
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Base Cost</span>
              <span className="text-white font-bold">$0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">OpenAI API</span>
              <span className="text-white font-bold">${ratLabCost.openai.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Firebase</span>
              <span className="text-white font-bold">${ratLabCost.firebase}</span>
            </div>
          </div>
          <div className="pt-4 border-t border-emerald-500/20">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-zinc-400">Total/Month</span>
              <span className="text-2xl font-bold text-emerald-400">
                ${ratLabCost.total().toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Artificial Societies Cost */}
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="text-red-400" size={20} />
            <h3 className="text-lg font-bold text-white">Artificial Societies</h3>
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Base Subscription</span>
              <span className="text-white font-bold">${artificialSocietiesCost.base}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Per User ({artificialSocietiesCost.users} users)</span>
              <span className="text-white font-bold">${artificialSocietiesCost.perUser * artificialSocietiesCost.users}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">API Costs</span>
              <span className="text-white font-bold">Included</span>
            </div>
          </div>
          <div className="pt-4 border-t border-red-500/20">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-zinc-400">Total/Month</span>
              <span className="text-2xl font-bold text-red-400">
                ${artificialSocietiesCost.total()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Savings Display */}
      <div className="p-6 bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 border border-emerald-500/30 rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="text-emerald-400" size={20} />
              <h3 className="text-lg font-bold text-white">Your Savings</h3>
            </div>
            <p className="text-sm text-zinc-400">
              You save <strong className="text-emerald-400">${savings.toFixed(2)}/month</strong> ({savingsPercent}% less) 
              with Rat Lab while getting the same features plus transparency and customization.
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-emerald-400">
              ${savings.toFixed(2)}
            </div>
            <div className="text-xs text-zinc-500">per month</div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-zinc-600 text-center">
        * Costs are estimates. Actual costs may vary based on usage patterns.
      </div>
    </div>
  );
};

export default CostCalculator;



