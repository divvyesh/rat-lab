import React from 'react';
import { GraduationCap, Rocket, FlaskConical, Briefcase, Building2, Sparkles } from 'lucide-react';
import { AppView } from '../types';

interface UseCaseTemplate {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  steps: string[];
  targetView?: AppView;
}

interface UseCaseTemplatesProps {
  onSelect?: (template: UseCaseTemplate) => void;
}

const templates: UseCaseTemplate[] = [
  {
    id: 'academic-research',
    title: 'Academic Research',
    description: 'Perfect for peer-reviewed studies requiring methodology transparency',
    icon: <GraduationCap size={24} />,
    color: 'text-blue-400',
    steps: [
      'Create cohorts representing your study population',
      'Define behavioral traits based on your research framework',
      'Run controlled simulations',
      'Export data with full audit trails for publication'
    ],
    targetView: AppView.PERSONA_BUILDER
  },
  {
    id: 'startup-product-testing',
    title: 'Startup Product Testing',
    description: 'Cost-effective way to test product-market fit before building',
    icon: <Rocket size={24} />,
    color: 'text-purple-400',
    steps: [
      'Define your target customer segments',
      'Create personas representing early adopters',
      'Test messaging, pricing, and features',
      'Get actionable insights without expensive surveys'
    ],
    targetView: AppView.EXPERIMENT_LAB
  },
  {
    id: 'behavioral-science',
    title: 'Behavioral Science Research',
    description: 'Study cognitive biases, heuristics, and decision-making patterns',
    icon: <FlaskConical size={24} />,
    color: 'text-emerald-400',
    steps: [
      'Model System 1 vs System 2 thinking',
      'Test heuristics (availability, anchoring, etc.)',
      'Analyze individual-level behavioral patterns',
      'Compare cross-cohort insights'
    ],
    targetView: AppView.PERSONA_BUILDER
  },
  {
    id: 'agency-client-work',
    title: 'Agency Client Work',
    description: 'Professional research for client presentations and strategy',
    icon: <Briefcase size={24} />,
    color: 'text-amber-400',
    steps: [
      'Create client-specific personas',
      'Run brand messaging tests',
      'Generate presentation-ready insights',
      'Export reports for client deliverables'
    ],
    targetView: AppView.ANALYSIS
  },
  {
    id: 'enterprise-market-research',
    title: 'Enterprise Market Research',
    description: 'Self-hosted solution for sensitive market research',
    icon: <Building2 size={24} />,
    color: 'text-indigo-400',
    steps: [
      'Deploy on your infrastructure',
      'Maintain data sovereignty',
      'Customize to your needs',
      'Integrate with existing tools'
    ],
    targetView: AppView.DASHBOARD
  },
  {
    id: 'custom-research',
    title: 'Custom Research',
    description: 'Build your own research workflows with full customization',
    icon: <Sparkles size={24} />,
    color: 'text-pink-400',
    steps: [
      'Modify codebase to your needs',
      'Add custom analysis methods',
      'Integrate with your data sources',
      'Build proprietary research tools'
    ],
    targetView: AppView.DASHBOARD
  }
];

const UseCaseTemplates: React.FC<UseCaseTemplatesProps> = ({ onSelect }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Use Case Templates</h2>
        <p className="text-zinc-400 text-sm">
          Get started quickly with pre-configured templates for common research scenarios.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map(template => (
          <div
            key={template.id}
            onClick={() => onSelect?.(template)}
            className={`p-6 bg-zinc-900/30 border border-white/5 rounded-2xl hover:border-indigo-500/30 transition-all cursor-pointer group ${
              onSelect ? 'hover:bg-zinc-900/50' : ''
            }`}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className={`${template.color} p-3 bg-zinc-950 rounded-xl border border-white/5 group-hover:border-indigo-500/30 transition-all`}>
                {template.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">{template.title}</h3>
                <p className="text-sm text-zinc-500">{template.description}</p>
              </div>
            </div>

            <div className="space-y-2">
              {template.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-2 text-xs text-zinc-400">
                  <span className="text-indigo-400 font-bold mt-0.5">{index + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>

            {onSelect && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="text-xs text-indigo-400 font-bold uppercase tracking-wider">
                  Click to Start →
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
        <p className="text-sm text-indigo-300">
          <strong>Don't see your use case?</strong> Rat Lab is fully customizable. 
          Modify the codebase to match your exact research needs.
        </p>
      </div>
    </div>
  );
};

export default UseCaseTemplates;



