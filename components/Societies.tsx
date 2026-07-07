import React, { useState, useEffect } from 'react';
import { Network, LayoutGrid } from 'lucide-react';
import SocietiesHomepage from './SocietiesHomepage';
import SocietyEditor from './SocietyEditor';
import PersonaDetailModal from './PersonaDetailModal';
import LinkedInConnect from './LinkedInConnect';
import TwitterConnect from './TwitterConnect';
import InstagramConnect from './InstagramConnect';
import FacebookConnect from './FacebookConnect';
import NetworkVisualization from './NetworkVisualization';
import { PersonalSociety, TargetSociety, Persona, PersonaSegment } from '../types';
import { prebuiltSocieties, createPrebuiltSociety } from '../data/prebuiltSocieties';
import { createTargetSociety, searchPersonasForSociety } from '../services/targetSocietyService';
import { createPersonalSociety } from '../services/linkedinService';
import { createTwitterSociety } from '../services/twitterService';
import { createInstagramSociety } from '../services/instagramService';
import { createFacebookSociety } from '../services/facebookService';

interface SocietiesProps {
  personas: Persona[];
  segments: PersonaSegment[];
  societies: any[]; // Legacy Society type
  setSocieties: (societies: any[]) => void;
  personalSocieties: PersonalSociety[];
  setPersonalSocieties: (societies: PersonalSociety[]) => void;
  targetSocieties: TargetSociety[];
  setTargetSocieties: (societies: TargetSociety[]) => void;
  onChangeView: (view: any) => void;
}

type ViewMode = 'homepage' | 'network' | 'editor';

const Societies: React.FC<SocietiesProps> = ({
  personas,
  segments,
  societies,
  setSocieties,
  personalSocieties: propPersonalSocieties,
  setPersonalSocieties,
  targetSocieties: propTargetSocieties,
  setTargetSocieties,
  onChangeView
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('homepage');
  const [editingSocietyId, setEditingSocietyId] = useState<string | null>(null);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [showLinkedInConnect, setShowLinkedInConnect] = useState(false);
  const [showTwitterConnect, setShowTwitterConnect] = useState(false);
  const [showInstagramConnect, setShowInstagramConnect] = useState(false);
  const [showFacebookConnect, setShowFacebookConnect] = useState(false);

  // Load prebuilt societies on mount if none exist
  useEffect(() => {
    if (propTargetSocieties.length === 0) {
      const prebuilt = prebuiltSocieties.map(s => createPrebuiltSociety(s.name));
      setTargetSocieties(prebuilt);
    }
  }, [propTargetSocieties.length, setTargetSocieties]);

  const handleCreatePersonalSociety = async (type: 'linkedin' | 'twitter' | 'instagram' | 'facebook') => {
    if (type === 'linkedin') {
      setShowLinkedInConnect(true);
    } else if (type === 'twitter') {
      setShowTwitterConnect(true);
    } else if (type === 'instagram') {
      setShowInstagramConnect(true);
    } else if (type === 'facebook') {
      setShowFacebookConnect(true);
    }
  };

  const handleLinkedInConnected = async (accessToken: string) => {
    setShowLinkedInConnect(false);
    
    // Update society status to 'creating'
    const tempSociety: PersonalSociety = {
      id: `linkedin-${Date.now()}`,
      type: 'linkedin',
      status: 'creating',
      progress: 0
    };
    setPersonalSocieties(prev => [...prev.filter(s => s.type !== 'linkedin'), tempSociety]);
    
    try {
      // Create society with progress updates
      const result = await createPersonalSociety(accessToken, (progress, message) => {
        setPersonalSocieties(prev => prev.map(s => 
          s.id === tempSociety.id 
            ? { ...s, progress, status: progress < 100 ? 'creating' : 'ready' }
            : s
        ));
      });
      
      const { society: newSociety, personas: generatedPersonas } = result;
      
      // Add personas to global state (so they appear in cohorts)
      if (generatedPersonas.length > 0) {
        setPersonas(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newPersonas = generatedPersonas.filter(p => !existingIds.has(p.id));
          console.log(`✅ Adding ${newPersonas.length} LinkedIn personas to global state`);
          return [...prev, ...newPersonas];
        });
      }
      
      // Update society with final state
      setPersonalSocieties(prev => prev.map(s => 
        s.id === tempSociety.id ? newSociety : s
      ));
    } catch (error) {
      console.error('Failed to create LinkedIn society:', error);
      setPersonalSocieties(prev => prev.filter(s => s.id !== tempSociety.id));
      alert('Failed to connect LinkedIn. Please try again.');
    }
  };

  const handleTwitterConnected = async (accessToken: string) => {
    setShowTwitterConnect(false);
    
    const tempSociety: PersonalSociety = {
      id: `twitter-${Date.now()}`,
      type: 'twitter',
      status: 'creating',
      progress: 0
    };
    setPersonalSocieties(prev => [...prev.filter(s => s.type !== 'twitter'), tempSociety]);
    
    try {
      const result = await createTwitterSociety(accessToken, (progress, message) => {
        setPersonalSocieties(prev => prev.map(s => 
          s.id === tempSociety.id 
            ? { ...s, progress, status: progress < 100 ? 'creating' : 'ready' }
            : s
        ));
      });
      
      const { society: newSociety, personas: generatedPersonas } = result;
      
      // Add personas to global state (so they appear in cohorts)
      if (generatedPersonas.length > 0) {
        setPersonas(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newPersonas = generatedPersonas.filter(p => !existingIds.has(p.id));
          console.log(`✅ Adding ${newPersonas.length} Twitter personas to global state`);
          return [...prev, ...newPersonas];
        });
      }
      
      setPersonalSocieties(prev => prev.map(s => 
        s.id === tempSociety.id ? newSociety : s
      ));
    } catch (error) {
      console.error('Failed to create Twitter society:', error);
      setPersonalSocieties(prev => prev.filter(s => s.id !== tempSociety.id));
      alert('Failed to connect Twitter. Please try again.');
    }
  };

  const handleInstagramConnected = async (accessToken: string) => {
    setShowInstagramConnect(false);
    
    const tempSociety: PersonalSociety = {
      id: `instagram-${Date.now()}`,
      type: 'instagram',
      status: 'creating',
      progress: 0
    };
    setPersonalSocieties(prev => [...prev.filter(s => s.type !== 'instagram'), tempSociety]);
    
    try {
      const result = await createInstagramSociety(accessToken, (progress, message) => {
        setPersonalSocieties(prev => prev.map(s => 
          s.id === tempSociety.id 
            ? { ...s, progress, status: progress < 100 ? 'creating' : 'ready' }
            : s
        ));
      });
      
      const { society: newSociety, personas: generatedPersonas } = result;
      
      if (generatedPersonas.length > 0) {
        setPersonas(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newPersonas = generatedPersonas.filter(p => !existingIds.has(p.id));
          console.log(`✅ Adding ${newPersonas.length} Instagram personas to global state`);
          return [...prev, ...newPersonas];
        });
      }
      
      setPersonalSocieties(prev => prev.map(s => 
        s.id === tempSociety.id ? newSociety : s
      ));
    } catch (error) {
      console.error('Failed to create Instagram society:', error);
      setPersonalSocieties(prev => prev.filter(s => s.id !== tempSociety.id));
      alert('Failed to connect Instagram. Please try again.');
    }
  };

  const handleFacebookConnected = async (accessToken: string) => {
    setShowFacebookConnect(false);
    
    const tempSociety: PersonalSociety = {
      id: `facebook-${Date.now()}`,
      type: 'facebook',
      status: 'creating',
      progress: 0
    };
    setPersonalSocieties(prev => [...prev.filter(s => s.type !== 'facebook'), tempSociety]);
    
    try {
      const result = await createFacebookSociety(accessToken, (progress, message) => {
        setPersonalSocieties(prev => prev.map(s => 
          s.id === tempSociety.id 
            ? { ...s, progress, status: progress < 100 ? 'creating' : 'ready' }
            : s
        ));
      });
      
      const { society: newSociety, personas: generatedPersonas } = result;
      
      if (generatedPersonas.length > 0) {
        setPersonas(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newPersonas = generatedPersonas.filter(p => !existingIds.has(p.id));
          console.log(`✅ Adding ${newPersonas.length} Facebook personas to global state`);
          return [...prev, ...newPersonas];
        });
      }
      
      setPersonalSocieties(prev => prev.map(s => 
        s.id === tempSociety.id ? newSociety : s
      ));
    } catch (error) {
      console.error('Failed to create Facebook society:', error);
      setPersonalSocieties(prev => prev.filter(s => s.id !== tempSociety.id));
      alert('Failed to connect Facebook. Please try again.');
    }
  };
  

  const handleCreateTargetSociety = async (description: string) => {
    const newSociety = await createTargetSociety(description);
    setTargetSocieties(prev => [...prev, newSociety]);
  };

  const handleEditSociety = (societyId: string) => {
    setEditingSocietyId(societyId);
    setViewMode('editor');
  };

  const handleDeleteSociety = (societyId: string) => {
    if (confirm('Are you sure you want to delete this sample population?')) {
      setTargetSocieties(prev => prev.filter(s => s.id !== societyId));
      setPersonalSocieties(prev => prev.filter(s => s.id !== societyId));
    }
  };

  const handleRefreshSociety = async (societyId: string) => {
    const society = [...propTargetSocieties, ...propPersonalSocieties].find(s => s.id === societyId);
    if (!society) return;

    try {
      if ('isPrebuilt' in society) {
        // Refresh target society - this will search for matching personas
        const refreshed = await searchPersonasForSociety(society.description);
        setTargetSocieties(prev =>
          prev.map(s => s.id === societyId ? { 
            ...s, 
            personaIds: refreshed.personaIds,
            updatedAt: new Date().toISOString()
          } : s)
        );
        console.log(`✅ Refreshed society "${society.name}": Found ${refreshed.personaIds.length} personas`);
      }
    } catch (error) {
      console.error('Failed to refresh society:', error);
      alert(`Failed to refresh sample population. Please try again.`);
    }
  };

  const handleSaveSociety = (updatedSociety: TargetSociety) => {
    setTargetSocieties(prev =>
      prev.map(s => s.id === updatedSociety.id ? updatedSociety : s)
    );
    setEditingSocietyId(null);
    setViewMode('homepage');
  };

  const handlePersonaClick = (personaId: string) => {
    setSelectedPersonaId(personaId);
  };

  const editingSociety = editingSocietyId
    ? [...propTargetSocieties, ...propPersonalSocieties].find(s => s.id === editingSocietyId)
    : null;

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('homepage')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              viewMode === 'homepage'
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <LayoutGrid size={16} />
              Homepage
            </div>
          </button>
          <button
            onClick={() => setViewMode('network')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              viewMode === 'network'
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Network size={16} />
              Network
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'homepage' && (
        <SocietiesHomepage
          personalSocieties={propPersonalSocieties}
          targetSocieties={propTargetSocieties}
          onCreatePersonalSociety={handleCreatePersonalSociety}
          onCreateTargetSociety={handleCreateTargetSociety}
          onEditSociety={handleEditSociety}
          onDeleteSociety={handleDeleteSociety}
          onRefreshSociety={handleRefreshSociety}
        />
      )}

      {viewMode === 'network' && (
        <NetworkVisualization
          society={[...propTargetSocieties, ...propPersonalSocieties].find(s => 
            editingSocietyId ? s.id === editingSocietyId : propPersonalSocieties.length > 0 ? propPersonalSocieties[0] : propTargetSocieties[0]
          ) || null}
          personas={personas}
          onPersonaClick={handlePersonaClick}
        />
      )}

      {viewMode === 'editor' && editingSociety && 'isPrebuilt' in editingSociety && (
        <SocietyEditor
          society={editingSociety}
          personas={personas}
          segments={segments}
          onSave={handleSaveSociety}
          onCancel={() => {
            setEditingSocietyId(null);
            setViewMode('homepage');
          }}
        />
      )}

      {/* Modals */}
      {showLinkedInConnect && (
        <LinkedInConnect
          isOpen={showLinkedInConnect}
          onClose={() => setShowLinkedInConnect(false)}
          onConnected={handleLinkedInConnected}
        />
      )}

      {showTwitterConnect && (
        <TwitterConnect
          isOpen={showTwitterConnect}
          onClose={() => setShowTwitterConnect(false)}
          onConnected={handleTwitterConnected}
        />
      )}

      {showInstagramConnect && (
        <InstagramConnect
          isOpen={showInstagramConnect}
          onClose={() => setShowInstagramConnect(false)}
          onConnected={handleInstagramConnected}
        />
      )}

      {showFacebookConnect && (
        <FacebookConnect
          isOpen={showFacebookConnect}
          onClose={() => setShowFacebookConnect(false)}
          onConnected={handleFacebookConnected}
        />
      )}

      {selectedPersonaId && (
        <PersonaDetailModal
          personaId={selectedPersonaId}
          persona={personas.find(p => p.id === selectedPersonaId)}
          onClose={() => setSelectedPersonaId(null)}
        />
      )}
    </div>
  );
};

export default Societies;

