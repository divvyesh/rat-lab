import { TargetSociety } from '../types';

export const prebuiltSocieties: Omit<TargetSociety, 'id' | 'createdAt' | 'updatedAt' | 'personaIds' | 'suitabilityScores'>[] = [
  {
    name: 'Startup Investors',
    description: 'Pre-seed/seed VC investors (Partners, Principals) in major tech hubs like SF, NYC, London.',
    isPrebuilt: true
  },
  {
    name: 'Startup Founders',
    description: 'Early-stage startup founders, segmented by industry (AI, Fintech, Health, etc.).',
    isPrebuilt: true
  },
  {
    name: 'US Young Professionals',
    description: 'US young professionals in north-east cities and tech workers on the west coast.',
    isPrebuilt: true
  }
];

export const createPrebuiltSociety = (
  name: string,
  personaIds: string[] = []
): TargetSociety => {
  const prebuilt = prebuiltSocieties.find(s => s.name === name);
  if (!prebuilt) {
    throw new Error(`Prebuilt society "${name}" not found`);
  }

  return {
    id: `prebuilt-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    ...prebuilt,
    personaIds,
    suitabilityScores: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

