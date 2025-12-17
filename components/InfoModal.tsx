
import React from 'react';
import { X, Info, Zap } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
        
        <div className="p-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <Info size={24} />
            </div>
            <div>
              <div className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-1">Knowledge Core</div>
              <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">{title}</h3>
            </div>
            <button 
              onClick={onClose}
              className="ml-auto p-2 bg-zinc-950 text-zinc-500 hover:text-white rounded-xl border border-white/5 transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="bg-zinc-950/50 rounded-2xl border border-white/5 p-6 mb-8">
            <p className="text-sm text-zinc-300 leading-relaxed font-medium">
              {content}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
              <Zap size={12} className="text-amber-500" /> System Educational Guide
            </div>
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-all active:scale-95"
            >
              Acknowledged
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;

export const InfoButton: React.FC<{ onClick: (e: React.MouseEvent) => void; className?: string }> = ({ onClick, className }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(e); }}
    className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 text-zinc-500 hover:bg-indigo-500 hover:text-white transition-all border border-white/5 ${className}`}
  >
    <Info size={10} strokeWidth={3} />
  </button>
);
