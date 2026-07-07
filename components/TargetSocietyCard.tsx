import React, { useState } from 'react';
import { MoreVertical, Folder, Rocket, Laptop, Briefcase } from 'lucide-react';
import { TargetSociety } from '../types';
import SocietyActionsMenu from './SocietyActionsMenu';

interface TargetSocietyCardProps {
  society: TargetSociety;
  onEdit: () => void;
  onDelete: () => void;
  onRefresh: () => void;
}

const TargetSocietyCard: React.FC<TargetSocietyCardProps> = ({
  society,
  onEdit,
  onDelete,
  onRefresh
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const getIcon = () => {
    const name = society.name.toLowerCase();
    if (name.includes('investor')) {
      return <Briefcase className="text-amber-400" size={24} />;
    }
    if (name.includes('founder')) {
      return <Rocket className="text-purple-400" size={24} />;
    }
    if (name.includes('professional')) {
      return <Laptop className="text-blue-400" size={24} />;
    }
    return <Folder className="text-indigo-400" size={24} />;
  };

  return (
    <div 
      className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 hover:border-white/10 transition-all relative cursor-pointer"
      onClick={(e) => {
        // Don't trigger card click if clicking on menu button
        if ((e.target as HTMLElement).closest('button')) return;
        onEdit();
      }}
    >
      {/* Badge and Menu */}
      <div className="flex items-start justify-between mb-4">
        {society.isPrebuilt && (
          <div className="px-2 py-1 bg-zinc-800 text-zinc-400 border border-white/10 rounded text-xs font-bold">
            Prebuilt
          </div>
        )}
        {!society.isPrebuilt && <div />}
        
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 text-zinc-500 hover:text-white transition-colors"
            aria-label="Society actions"
          >
            <MoreVertical size={18} />
          </button>
          {showMenu && (
            <SocietyActionsMenu
              onEdit={onEdit}
              onDelete={onDelete}
              onRefresh={onRefresh}
              onClose={() => setShowMenu(false)}
            />
          )}
        </div>
      </div>

      {/* Icon */}
      <div className="mb-4">
        {getIcon()}
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-white mb-2">{society.name}</h3>

      {/* Description */}
      <p className="text-sm text-zinc-400 leading-relaxed">
        {society.description}
      </p>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between">
          <div className={`text-xs ${society.personaIds.length === 0 ? 'text-orange-400' : 'text-zinc-500'}`}>
            {society.personaIds.length} personas
          </div>
          {society.personaIds.length === 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRefresh();
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
            >
              Click to populate
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TargetSocietyCard;



