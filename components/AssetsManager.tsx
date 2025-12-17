import React, { useState } from 'react';
import { analyzeImageAssets } from '../services/geminiService';
import { Asset, User } from '../types';
import { Image, Upload, Loader2, FileAudio, Tag, Plus } from 'lucide-react';

interface AssetsManagerProps {
  assets: Asset[];
  setAssets: (assets: Asset[]) => void;
  user: User;
}

const AssetsManager: React.FC<AssetsManagerProps> = ({ assets, setAssets, user }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const base64Data = base64.split(',')[1];
        
        setIsAnalyzing(true);
        let analysis = "";
        
        // Always run Vision Analysis
        analysis = await analyzeImageAssets(base64Data);

        const newAsset: Asset = {
            id: crypto.randomUUID(),
            type: file.type.startsWith('image') ? 'IMAGE' : 'AUDIO',
            name: file.name,
            data: base64Data,
            analysis: analysis
        };
        
        setAssets([...assets, newAsset]);
        setIsAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center border-b border-white/5 pb-6">
            <div>
                <h2 className="text-2xl font-semibold text-white mb-1">Assets Library</h2>
                <p className="text-zinc-400 text-sm">Upload visual stimuli and audio for research contexts.</p>
            </div>
            <label className="cursor-pointer px-5 py-2.5 bg-white text-zinc-950 hover:bg-zinc-200 rounded-lg font-medium transition-all flex items-center gap-2 shadow-sm text-sm">
                <Upload size={16} /> Upload Asset
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>
        </div>

        {isAnalyzing && (
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center gap-3 text-indigo-400 animate-pulse mb-6">
                <Loader2 className="animate-spin" size={18} /> 
                <span className="text-sm font-medium">Processing visual analysis...</span>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Upload Placeholder */}
            <label className="border-2 border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center p-6 cursor-pointer hover:border-zinc-700 hover:bg-zinc-900/50 transition-all group h-64">
                <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-4 group-hover:bg-zinc-800 transition-colors">
                    <Plus className="text-zinc-500" />
                </div>
                <span className="text-sm font-medium text-zinc-400">Add New</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>

            {assets.map(asset => (
                <div key={asset.id} className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden hover:border-zinc-700 transition-all group flex flex-col h-64">
                    <div className="h-32 bg-zinc-950 flex items-center justify-center overflow-hidden relative">
                        {asset.type === 'IMAGE' ? (
                            <img src={`data:image/png;base64,${asset.data}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt={asset.name} />
                        ) : (
                            <FileAudio size={48} className="text-zinc-700" />
                        )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                             <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-white/5">{asset.type}</span>
                        </div>
                        <h4 className="font-medium text-zinc-200 text-sm truncate mb-2">{asset.name}</h4>
                        {asset.analysis && (
                            <div className="flex-1 overflow-y-auto pr-1">
                                <p className="text-[10px] text-zinc-500 leading-snug">{asset.analysis}</p>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

export default AssetsManager;