import React, { useState } from 'react';
import { Info, Plus } from 'lucide-react';
import PersonalSocietyCard from './PersonalSocietyCard';
import TargetSocietyCard from './TargetSocietyCard';
import CreateTargetSociety from './CreateTargetSociety';
import SocietiesFAQ from './SocietiesFAQ';
import { PersonalSociety, TargetSociety } from '../types';

interface SocietiesHomepageProps {
  personalSocieties: PersonalSociety[];
  targetSocieties: TargetSociety[];
  onCreatePersonalSociety: (type: 'linkedin' | 'twitter') => void;
  onCreateTargetSociety: (description: string) => void;
  onEditSociety: (societyId: string) => void;
  onDeleteSociety: (societyId: string) => void;
  onRefreshSociety: (societyId: string) => void;
}

const SocietiesHomepage: React.FC<SocietiesHomepageProps> = ({
  personalSocieties,
  targetSocieties,
  onCreatePersonalSociety,
  onCreateTargetSociety,
  onEditSociety,
  onDeleteSociety,
  onRefreshSociety
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight uppercase italic">
          Sample Population Homepage
        </h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Create and manage Sample Populations for your experiments, and explore the network.
          Sample Populations are networks of personas. Once you have configured a sample population, 
          you can use it to run simulations.
        </p>
      </div>

      {/* Personal Societies Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-white">Personal Sample Populations</h2>
          <button
            onClick={() => setShowFAQ(!showFAQ)}
            className="p-1 text-zinc-500 hover:text-white transition-colors"
            aria-label="More information"
          >
            <Info size={18} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* LinkedIn Card */}
          <PersonalSocietyCard
            type="linkedin"
            society={personalSocieties.find(s => s.type === 'linkedin')}
            onSetup={() => onCreatePersonalSociety('linkedin')}
          />

          {/* X/Twitter Card */}
          <PersonalSocietyCard
            type="twitter"
            society={personalSocieties.find(s => s.type === 'twitter')}
            onSetup={() => onCreatePersonalSociety('twitter')}
          />

          {/* Instagram Card */}
          <PersonalSocietyCard
            type="instagram"
            society={personalSocieties.find(s => s.type === 'instagram')}
            onSetup={() => onCreatePersonalSociety('instagram')}
          />

          {/* Facebook Card */}
          <PersonalSocietyCard
            type="facebook"
            society={personalSocieties.find(s => s.type === 'facebook')}
            onSetup={() => onCreatePersonalSociety('facebook')}
          />
        </div>
      </div>

      {/* Target Societies Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-white">Target Sample Populations</h2>
          <button
            onClick={() => setShowFAQ(!showFAQ)}
            className="p-1 text-zinc-500 hover:text-white transition-colors"
            aria-label="More information"
          >
            <Info size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Create Target Society Card */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-8 bg-zinc-900/30 border-2 border-dashed border-white/10 rounded-xl hover:border-indigo-500/50 transition-all text-center group"
          >
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors">
                <Plus className="text-indigo-400" size={24} />
              </div>
              <div className="text-sm font-bold text-white">Create Target Sample Population</div>
            </div>
          </button>

          {/* Prebuilt and Custom Target Societies */}
          {targetSocieties.map(society => (
            <TargetSocietyCard
              key={society.id}
              society={society}
              onEdit={() => onEditSociety(society.id)}
              onDelete={() => onDeleteSociety(society.id)}
              onRefresh={() => onRefreshSociety(society.id)}
            />
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      {showFAQ && (
        <div className="mt-10">
          <SocietiesFAQ />
        </div>
      )}

      {/* Create Target Society Modal */}
      {showCreateModal && (
        <CreateTargetSociety
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={onCreateTargetSociety}
        />
      )}
    </div>
  );
};

export default SocietiesHomepage;



