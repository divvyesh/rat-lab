
import React from 'react';
import { AppView, User } from '../types';
import { BrainCircuit, Users, FlaskConical, BarChart3, Menu, Image, LogOut, Rat, Cloud, HardDrive, Zap } from 'lucide-react';
import { getActiveConfigStatus } from '../services/firebase';

interface LayoutProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  user?: User;
  onLogout?: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentView, onChangeView, user, onLogout, children }) => {
  const navItems = [
    { id: AppView.DASHBOARD, label: 'Overview', icon: <BrainCircuit size={18} /> },
    { id: AppView.PERSONA_BUILDER, label: 'Cohorts', icon: <Users size={18} /> },
    { id: AppView.EXPERIMENT_LAB, label: 'Simulations', icon: <FlaskConical size={18} /> },
    { id: AppView.ANALYSIS, label: 'Analysis', icon: <BarChart3 size={18} /> },
    { id: AppView.ASSETS, label: 'Assets', icon: <Image size={18} /> },
  ];

  const configStatus = getActiveConfigStatus();

  return (
    <div className="flex h-screen bg-black text-zinc-100 overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <aside className="w-64 bg-zinc-950 border-r border-white/5 flex flex-col hidden md:flex relative z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Rat size={18} />
          </div>
          <h1 className="text-sm font-bold tracking-wider text-zinc-100">RAT LAB <span className="text-zinc-600 font-normal ml-1 text-xs">v2.1</span></h1>
        </div>

        {/* Token Balance */}
        {user && (
          <div className="mx-4 mb-6 p-3 bg-zinc-900/50 border border-white/5 rounded-xl flex items-center justify-between group cursor-pointer hover:bg-zinc-900 transition-colors">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-amber-500 group-hover:animate-pulse" />
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Inference Credits</div>
            </div>
            <div className="text-sm font-mono font-bold text-white">942</div>
          </div>
        )}
        
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${
                currentView === item.id ? 'bg-zinc-900 text-white font-medium border border-white/5' : 'text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-200'
              }`}
            >
              <span className={currentView === item.id ? 'text-indigo-400' : 'text-zinc-600'}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {user && (
            <div className="p-4 border-t border-white/5 bg-zinc-950/50">
                 <div className="flex items-center gap-2 mb-4 px-1">
                    {configStatus === 'REAL' ? <Cloud size={10} className="text-emerald-500" /> : <HardDrive size={10} className="text-amber-500" />}
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-tight">{configStatus === 'REAL' ? 'Sync On' : 'Demo Mode'}</span>
                 </div>
                 <div className="flex items-center gap-3 mb-3 px-1">
                    <img src={user.avatar} alt="User" className="w-8 h-8 rounded-full ring-2 ring-black" />
                    <div className="flex-1 overflow-hidden">
                        <div className="text-sm font-medium text-zinc-200 truncate">{user.name}</div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wide">Research Lead</div>
                    </div>
                 </div>
                 <button onClick={onLogout} className="w-full flex items-center gap-2 text-xs text-zinc-600 hover:text-red-400 px-1 transition-colors group">
                    <LogOut size={12} /> Sign Out
                 </button>
            </div>
        )}
      </aside>

      <main className="flex-1 overflow-y-auto relative bg-black">
        <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-white/5 p-4 flex items-center justify-between md:hidden">
           <div className="flex items-center gap-2"><Rat className="text-indigo-500" size={20} /><span className="font-bold text-sm tracking-wider">RAT LAB</span></div>
           <button className="text-zinc-400"><Menu size={20} /></button>
        </header>
        <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-full pb-32">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
