
import React from 'react';
import { AppTab } from '../types';

interface HeaderProps {
  userLocation?: {lat: number, lng: number} | null;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  assetsCount: number;
}

const Header: React.FC<HeaderProps> = ({ userLocation, activeTab, onTabChange, assetsCount }) => {
  return (
    <header className="sticky top-0 z-50 bg-ekoBlack border-b border-lagosYellow/20 backdrop-blur-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer select-none" 
          onClick={() => onTabChange('deals')}
        >
          <div className="bg-lagosYellow p-2 rounded-lg shadow-[0_0_10px_rgba(255,215,0,0.3)]">
            <i className="fas fa-chart-line text-ekoBlack text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white leading-none">
              EKO <span className="text-lagosYellow uppercase">Arbitrage</span>
            </h1>
            <span className="text-[10px] font-bold text-zinc-500 tracking-[0.2em] uppercase">Market Agent v1.0</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {(['deals', 'stats', 'markets'] as AppTab[]).map((tab) => (
            <button 
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`text-xs font-black tracking-widest uppercase transition-all relative py-2 ${
                activeTab === tab ? 'text-lagosYellow' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {tab === 'deals' ? 'Dashboard' : tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-lagosYellow animate-in fade-in slide-in-from-bottom-1"></span>
              )}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Subtle Assets Live Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full">
            <span className="flex h-1.5 w-1.5 rounded-full bg-lagosYellow animate-pulse"></span>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tight">
              {(assetsCount / 1000).toFixed(1)}k+ Assets Live
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-ekoGray border border-zinc-800 rounded-full">
            <div className={`w-2 h-2 rounded-full ${userLocation ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase">
              {userLocation ? 'GPS Sync' : 'Static Mode'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
