import React from 'react';
import { Eye, Code, FileText, ShieldCheck, GitBranch, CheckCircle2 } from 'lucide-react';

interface TransparencyPanelProps {
  onClose?: () => void;
}

const TransparencyPanel: React.FC<TransparencyPanelProps> = ({ onClose }) => {
  const transparencyFeatures = [
    {
      icon: <Code size={20} />,
      title: 'Open Source',
      description: 'Full source code available on GitHub. Audit, modify, and contribute.',
      color: 'text-emerald-400'
    },
    {
      icon: <FileText size={20} />,
      title: 'Methodology Documentation',
      description: 'Complete documentation of behavioral science principles and statistical methods.',
      color: 'text-blue-400'
    },
    {
      icon: <Eye size={20} />,
      title: 'Explainable AI',
      description: 'See reasoning behind every persona response. No black boxes.',
      color: 'text-purple-400'
    },
    {
      icon: <ShieldCheck size={20} />,
      title: 'Audit Trails',
      description: 'Track every change, every simulation, every analysis. Full transparency.',
      color: 'text-amber-400'
    },
    {
      icon: <GitBranch size={20} />,
      title: 'Version Control',
      description: 'Git-based versioning. See exactly what changed and when.',
      color: 'text-indigo-400'
    },
    {
      icon: <CheckCircle2 size={20} />,
      title: 'Peer Review Ready',
      description: 'Academic-grade transparency. Suitable for peer-reviewed research.',
      color: 'text-pink-400'
    }
  ];

  return (
    <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Transparency & Trust</h2>
        <p className="text-zinc-400 text-sm">
          Rat Lab is built on principles of transparency, openness, and scientific rigor. 
          Unlike proprietary platforms, you can see exactly how your research works.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {transparencyFeatures.map((feature, index) => (
          <div
            key={index}
            className="p-6 bg-zinc-950/50 border border-white/5 rounded-2xl hover:border-indigo-500/30 transition-all"
          >
            <div className={`${feature.color} mb-3`}>{feature.icon}</div>
            <h3 className="text-sm font-bold text-white mb-2">{feature.title}</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
        <p className="text-sm text-indigo-300">
          <strong>Why transparency matters:</strong> In behavioral research, methodology transparency 
          is crucial for credibility. Rat Lab gives you the confidence to publish, present, and 
          make decisions based on your research.
        </p>
      </div>
    </div>
  );
};

export default TransparencyPanel;



