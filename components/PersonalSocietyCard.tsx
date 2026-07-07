import React from 'react';
import { Linkedin, Twitter, Loader2 } from 'lucide-react';
import { PersonalSociety } from '../types';

interface PersonalSocietyCardProps {
  type: 'linkedin' | 'twitter' | 'instagram' | 'facebook';
  society?: PersonalSociety;
  onSetup: () => void;
}

const PersonalSocietyCard: React.FC<PersonalSocietyCardProps> = ({
  type,
  society,
  onSetup
}) => {
  const isLinkedIn = type === 'linkedin';
  const isTwitter = type === 'twitter';
  const isInstagram = type === 'instagram';
  const isFacebook = type === 'facebook';
  const status = society?.status || 'setup';
  const progress = society?.progress || 0;

  const getStatusBadge = () => {
    if (status === 'setup') {
      return (
        <button
          onClick={onSetup}
          className="px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg text-xs font-bold hover:bg-orange-500/30 transition-all"
        >
          Setup
        </button>
      );
    }
    if (status === 'creating') {
      return (
        <div className="px-3 py-1 bg-zinc-800 text-zinc-400 border border-white/10 rounded-lg text-xs font-bold">
          Creating...
        </div>
      );
    }
    return null;
  };

  const getDescription = () => {
    if (isLinkedIn) {
      return 'Your personal LinkedIn network built around the people who engage with your posts.';
    }
    if (isTwitter) {
      return 'Your personal X (formerly Twitter) network built from your followers.';
    }
    if (isInstagram) {
      return 'Your personal Instagram network built from people who engage with your posts.';
    }
    if (isFacebook) {
      return 'Your personal Facebook network built from friends and people who react to your posts.';
    }
    return 'Your personal social network.';
  };

  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 hover:border-white/10 transition-all relative">
      {/* Status Badge */}
      <div className="absolute top-4 left-4">
        {getStatusBadge()}
      </div>

      {/* Content */}
      <div className="flex flex-col items-center justify-center pt-8 pb-4">
        {/* Logo/Icon */}
        {isLinkedIn ? (
          <div className="mb-4">
            <div className="w-20 h-20 bg-blue-600 rounded-lg flex items-center justify-center">
              <Linkedin className="text-white" size={40} />
            </div>
          </div>
        ) : isTwitter ? (
          <div className="mb-4">
            {status === 'creating' && society?.authorProfile ? (
              <img
                src={society.authorProfile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(society.authorProfile.name || 'User')}&background=1da1f2&color=fff&size=80&bold=true`}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-2 border-white/10"
              />
            ) : (
              <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center border-2 border-white/10">
                <Twitter className="text-white" size={32} />
              </div>
            )}
          </div>
        ) : isInstagram ? (
          <div className="mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-2xl font-bold">IG</span>
            </div>
          </div>
        ) : isFacebook ? (
          <div className="mb-4">
            <div className="w-20 h-20 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-2xl font-bold">f</span>
            </div>
          </div>
        ) : null}

        {/* Title */}
        <h3 className="text-lg font-bold text-white mb-2">
          {isLinkedIn ? 'LinkedIn' : isTwitter ? 'X (formerly Twitter)' : isInstagram ? 'Instagram' : isFacebook ? 'Facebook' : 'Social Network'}
        </h3>

        {/* Description */}
        <p className="text-sm text-zinc-400 text-center mb-4">
          {status === 'creating'
            ? 'Retrieving real people from your network...'
            : getDescription()}
        </p>

        {/* Progress Bar */}
        {status === 'creating' && (
          <div className="w-full mt-4">
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Loader2 className="text-indigo-400 animate-spin" size={14} />
              <span className="text-xs text-zinc-500">{progress}% complete</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalSocietyCard;



