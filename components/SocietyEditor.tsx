import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { TargetSociety, Persona, PersonaSegment } from '../types';

interface SocietyEditorProps {
  society: TargetSociety;
  personas: Persona[];
  segments: PersonaSegment[];
  onSave: (society: TargetSociety) => void;
  onCancel: () => void;
}

const SocietyEditor: React.FC<SocietyEditorProps> = ({
  society,
  personas,
  segments,
  onSave,
  onCancel
}) => {
  const [name, setName] = useState(society.name);
  const [description, setDescription] = useState(society.description);
  const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>(society.personaIds);

  const availablePersonas = personas.filter(p => !selectedPersonaIds.includes(p.id));

  const handleTogglePersona = (personaId: string) => {
    setSelectedPersonaIds(prev =>
      prev.includes(personaId)
        ? prev.filter(id => id !== personaId)
        : [...prev, personaId]
    );
  };

  const handleSave = () => {
    onSave({
      ...society,
      name,
      description,
      personaIds: selectedPersonaIds,
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Edit Sample Population</h2>
        <button
          onClick={onCancel}
          className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all"
        >
          <X size={18} />
        </button>
      </div>

      {/* Name */}
      <div>
        <label className="text-sm font-bold text-white mb-2 block">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-4 py-2 bg-zinc-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/50"
          disabled={society.isPrebuilt}
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-sm font-bold text-white mb-2 block">
          Description
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full h-32 px-4 py-3 bg-zinc-950 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 resize-none"
          disabled={society.isPrebuilt}
        />
      </div>

      {/* Selected Personas */}
      <div>
        <label className="text-sm font-bold text-white mb-2 block">
          Selected Personas ({selectedPersonaIds.length})
        </label>
        <div className="bg-zinc-950 border border-white/10 rounded-xl p-4 max-h-64 overflow-y-auto">
          {selectedPersonaIds.length === 0 ? (
            <p className="text-zinc-500 text-sm">No personas selected</p>
          ) : (
            <div className="space-y-2">
              {selectedPersonaIds.map(personaId => {
                const persona = personas.find(p => p.id === personaId);
                if (!persona) return null;
                return (
                  <div
                    key={personaId}
                    className="flex items-center justify-between p-2 bg-zinc-900 rounded-lg"
                  >
                    <div>
                      <div className="text-sm font-bold text-white">{persona.name}</div>
                      <div className="text-xs text-zinc-400">{persona.occupation}, {persona.location}</div>
                    </div>
                    <button
                      onClick={() => handleTogglePersona(personaId)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Available Personas */}
      <div>
        <label className="text-sm font-bold text-white mb-2 block">
          Available Personas ({availablePersonas.length})
        </label>
        <div className="bg-zinc-950 border border-white/10 rounded-xl p-4 max-h-64 overflow-y-auto">
          {availablePersonas.length === 0 ? (
            <p className="text-zinc-500 text-sm">All personas are already selected</p>
          ) : (
            <div className="space-y-2">
              {availablePersonas.map(persona => (
                <button
                  key={persona.id}
                  onClick={() => handleTogglePersona(persona.id)}
                  className="w-full flex items-center justify-between p-2 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors text-left"
                >
                  <div>
                    <div className="text-sm font-bold text-white">{persona.name}</div>
                    <div className="text-xs text-zinc-400">{persona.occupation}, {persona.location}</div>
                  </div>
                  <div className="text-indigo-400 text-xs">Add</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-bold transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
        >
          <Save size={16} />
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default SocietyEditor;


