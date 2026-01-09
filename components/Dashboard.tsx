
import React from 'react';
import { MarketDeal, MarketStatus, LogisticsMode } from '../types';
import DealCard from './DealCard';

interface DashboardProps {
  deals: MarketDeal[];
  status: MarketStatus;
  error: string | null;
  userLocation: {lat: number, lng: number} | null;
  logisticsMode: LogisticsMode;
}

const Dashboard: React.FC<DashboardProps> = ({ deals, status, error, userLocation, logisticsMode }) => {
  if (status === MarketStatus.LOADING && deals.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-ekoGray border border-zinc-800 rounded-2xl h-64 animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (status === MarketStatus.ERROR) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-ekoGray border border-red-900/30 rounded-3xl">
        <i className="fas fa-exclamation-triangle text-red-500 text-5xl mb-4"></i>
        <h3 className="text-xl font-bold text-white mb-2">Sync Failed</h3>
        <p className="text-zinc-500 text-center max-w-md px-6">
          {error || 'We encountered an error connecting to the Eko Market grid. Please try again later.'}
        </p>
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-ekoGray border border-zinc-800 rounded-3xl">
        <i className="fas fa-search-dollar text-lagosYellow/30 text-5xl mb-4"></i>
        <h3 className="text-xl font-bold text-white mb-2">No Deals Found</h3>
        <p className="text-zinc-500">The agent is scanning Lagos markets for opportunities...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {deals.map((deal) => (
        <DealCard 
          key={deal.id} 
          deal={deal} 
          userLocation={userLocation} 
          logisticsMode={logisticsMode} 
        />
      ))}
    </div>
  );
};

export default Dashboard;
