import React, { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';

interface CreateTargetSocietyProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (description: string) => void;
}

const CreateTargetSociety: React.FC<CreateTargetSocietyProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const handleCreate = async () => {
    if (!description.trim()) return;

    setIsCreating(true);
    // Simulate persona matching
    setTimeout(() => {
      setPreviewCount(Math.floor(Math.random() * 500) + 100);
    }, 1000);

    // Create society
    setTimeout(() => {
      onCreate(description);
      setIsCreating(false);
      setDescription('');
      setPreviewCount(null);
      onClose();
    }, 2000);
  };

  const exampleDescriptions = [
    'Startup investors (Partners, Principals) in major tech hubs like SF, NYC, London.',
    'Early-stage startup founders, segmented by industry (AI, Fintech, Health, etc.).',
    'US young professionals in north-east cities and tech workers on the west coast.',
    'Marketing professionals in B2B SaaS companies with 50-500 employees.',
    'Product managers at Fortune 500 companies focusing on digital transformation.'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-zinc-900 border-2 border-indigo-500/50 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <Sparkles className="text-indigo-400" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Create Target Sample Population</h2>
                <p className="text-xs text-zinc-500">Describe the people you want in your sample population</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description Input */}
          <div>
            <label className="text-sm font-bold text-white mb-2 block">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="E.g., Startup investors (Partners, Principals) in major tech hubs like SF, NYC, London."
              className="w-full h-32 px-4 py-3 bg-zinc-950 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 resize-none"
              disabled={isCreating}
            />
            <p className="text-xs text-zinc-500 mt-2">
              Be specific about attributes like age range, location, and professional industry.
            </p>
          </div>

          {/* Preview */}
          {previewCount !== null && (
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="text-indigo-400 animate-spin" size={16} />
                <span className="text-sm font-bold text-indigo-400">Matching personas...</span>
              </div>
              <p className="text-sm text-zinc-300">
                Found approximately <strong className="text-white">{previewCount}</strong> matching personas
              </p>
            </div>
          )}

          {/* Example Descriptions */}
          <div>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
              Example Descriptions
            </div>
            <div className="space-y-2">
              {exampleDescriptions.map((example, index) => (
                <button
                  key={index}
                  onClick={() => setDescription(example)}
                  className="w-full p-3 bg-zinc-950/50 border border-white/5 rounded-lg text-left text-sm text-zinc-400 hover:border-indigo-500/30 hover:text-zinc-300 transition-all"
                  disabled={isCreating}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-bold transition-all"
            disabled={isCreating}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!description.trim() || isCreating}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Creating...
              </>
            ) : (
              'Create Sample Population'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTargetSociety;



