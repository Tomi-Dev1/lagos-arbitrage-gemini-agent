
import React, { useMemo } from 'react';
import { MarketDeal, LogisticsMode } from '../types';

interface DealCardProps {
  deal: MarketDeal;
  userLocation: {lat: number, lng: number} | null;
  logisticsMode: LogisticsMode;
}

const MARKET_COORDINATES: Record<string, {lat: number, lng: number}> = {
  'Mile 12': { lat: 6.6111, lng: 3.3951 },
  'Oyingbo': { lat: 6.4789, lng: 3.3813 },
  'Alaba': { lat: 6.4624, lng: 3.1906 },
  'Computer Village': { lat: 6.5933, lng: 3.3359 },
  'Ikeja': { lat: 6.5933, lng: 3.3359 },
  'Balogun': { lat: 6.4549, lng: 3.3887 },
  'Lagos Island': { lat: 6.4549, lng: 3.3887 },
};

const DealCard: React.FC<DealCardProps> = ({ deal, userLocation, logisticsMode }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const logisticsData = useMemo(() => {
    if (!userLocation) return null;
    const marketStr = (deal?.market_a || deal?.market_name || '').toLowerCase();
    const marketKey = Object.keys(MARKET_COORDINATES).find(k => 
        marketStr.includes(k.toLowerCase())
    ) as keyof typeof MARKET_COORDINATES || 'Ikeja';
    
    const marketCoords = MARKET_COORDINATES[marketKey];
    const distance = getDistance(userLocation.lat, userLocation.lng, marketCoords.lat, marketCoords.lng);
    
    // Base logic: 500 NGN base + 250 NGN per km
    let estimatedCost = 500 + (distance * 250);
    
    // If Personal Pickup, double the cost to account for return trip
    if (logisticsMode === 'pickup') {
      estimatedCost *= 2;
    }

    return {
      distance: distance.toFixed(1),
      cost: estimatedCost,
      market: marketKey
    };
  }, [userLocation, deal, logisticsMode]);

  const calculatedProfit = (deal.online_price || deal.price_b || 0) - (deal.mile12_price || deal.price_a || 0);
  
  const handleWhatsAppShare = () => {
    const itemName = deal.product_name || deal.item_name || 'Unknown Item';
    const buyPrice = deal.mile12_price || deal.price_a || 0;
    const sellPrice = deal.online_price || deal.price_b || 0;
    const marketName = deal.market_a || deal.market_name || 'Local Market';
    
    // Construct the message
    const message = `Eko Arbitrage Deal Alert
Item: ${itemName}
Buy: ₦${buyPrice.toLocaleString()} at ${marketName}
Sell: ₦${sellPrice.toLocaleString()}
Estimated Profit: ₦${calculatedProfit.toLocaleString()}
Shared via Eko Arbitrage Market Agent`;

    // Encode and open WhatsApp
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="group relative bg-ekoGray border border-zinc-800 rounded-3xl overflow-hidden transition-all duration-300 hover:border-lagosYellow/50 card-shadow flex flex-col h-full">
      {calculatedProfit >= 1 && (
        <div className="absolute top-4 right-4 z-10 bg-lagosYellow text-ekoBlack text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg animate-in fade-in zoom-in duration-500">
          ₦{calculatedProfit.toLocaleString()} Profit
        </div>
      )}

      <div className="p-6 flex-grow flex flex-col">
        <div className="mb-6">
          <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest block mb-1">
            {deal.specialized_category || 'Market Asset'}
          </span>
          <h3 className="text-2xl font-black text-white group-hover:text-lagosYellow transition-colors truncate">
            {deal.product_name || deal.item_name || 'Unknown Item'}
          </h3>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-lagosYellow/10 flex items-center justify-center border border-lagosYellow/20">
            <i className="fas fa-map-marker-alt text-lagosYellow"></i>
          </div>
          <div>
             <p className="text-[10px] font-bold text-zinc-500 uppercase">Ground Source</p>
             <p className="text-sm font-bold text-white">{deal.market_a || deal.market_name || 'Local Market'}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 mb-6 bg-black/40 p-4 rounded-2xl border border-zinc-800/50">
          <div className="flex-1 text-center md:text-left">
            <p className="text-zinc-500 text-[9px] font-bold uppercase mb-1">Buy</p>
            <p className="text-lg font-black text-lagosYellow">
              {formatCurrency(deal.mile12_price || deal.price_a || 0)}
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="h-[1px] w-8 bg-zinc-700 relative">
               <i className="fas fa-chevron-right absolute -top-1 right-0 text-[8px] text-lagosYellow"></i>
            </div>
          </div>

          <div className="flex-1 text-center md:text-right">
            <p className="text-zinc-500 text-[9px] font-bold uppercase mb-1">Sell</p>
            <p className="text-lg font-black text-white">
              {formatCurrency(deal.online_price || deal.price_b || 0)}
            </p>
          </div>
        </div>

        {logisticsData && (
          <div className="mb-6 p-4 rounded-2xl bg-lagosYellow/5 border border-lagosYellow/10 transition-colors duration-300">
            <div className="flex justify-between items-center mb-2">
               <span className="text-[10px] font-black text-lagosYellow uppercase tracking-widest">
                Estimated Delivery Fee
               </span>
               <span className="text-[10px] font-mono text-zinc-500">{logisticsData.distance} km</span>
            </div>
            <div className="flex justify-between items-baseline">
               <p className="text-xs text-zinc-400 italic">
                 {logisticsMode === 'pickup' ? 'Personal Round-trip' : 'Standard Rider'} to {logisticsData.market}
               </p>
               <p className="text-sm font-black text-white animate-in fade-in slide-in-from-right-1">
                 {formatCurrency(logisticsData.cost)}
               </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6 mt-auto">
          <div className="bg-zinc-800/30 p-3 rounded-xl border border-zinc-800">
            <p className="text-zinc-500 text-[9px] font-bold uppercase">ROI</p>
            <p className="text-lg font-black text-green-400">
               {deal.profit_percentage ? `${deal.profit_percentage}%` : 'High'}
            </p>
          </div>
          <div className="bg-zinc-800/30 p-3 rounded-xl border border-zinc-800">
            <p className="text-zinc-500 text-[9px] font-bold uppercase">Confidence</p>
            <div className="flex items-center gap-1">
              <p className="text-lg font-black text-white">
                {deal.confidence_score ? `${deal.confidence_score}%` : '85%'}
              </p>
            </div>
          </div>
        </div>

        
        <div className="mt-4 flex justify-between items-center text-[8px] font-bold text-zinc-800 uppercase tracking-tighter">
           <span>{new Date(deal.created_at).toLocaleString()}</span>
        </div>

        {/* WhatsApp Share Button */}
        <button 
          onClick={handleWhatsAppShare}
          className="mt-4 w-full py-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors duration-300 shadow-lg active:scale-95"
          title="Share on WhatsApp"
        >
          <i className="fab fa-whatsapp text-xl"></i>
          <span>Share Deal</span>
        </button>
      </div>
    </div>
  );
};

export default DealCard;
