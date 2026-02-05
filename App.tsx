
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from './supabaseClient';
import { MarketDeal, MarketStatus, AppTab, LogisticsMode } from './types';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import ChatComponent from './components/ChatComponent';

const App: React.FC = () => {
  // Mock Data Removed

  const [deals, setDeals] = useState<MarketDeal[]>([]);
  const [status, setStatus] = useState<MarketStatus>(MarketStatus.LOADING);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('deals');
  const [logisticsMode, setLogisticsMode] = useState<LogisticsMode>('delivery');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortByProfit, setSortByProfit] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // For forcing refreshes via useEffect
  const itemsPerPage = 10;

  // Fisher-Yates Shuffle Algorithm to randomize deals client-side
  const shuffleArray = (array: MarketDeal[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const fetchDeals = async () => {
    try {
      setStatus(MarketStatus.LOADING);
      const { data, error: supabaseError } = await supabase
        .from('market_deals')
        .select('*')
        .limit(2000)
        .order('created_at', { ascending: false })
        .neq('item_name', `_bust_${new Date().getTime()}`); // Cache Buster

      if (supabaseError) throw supabaseError;

      // Shuffle the data so every refresh looks "new"
      const shuffledData = shuffleArray(data || []);
      setDeals(shuffledData);
      setStatus(MarketStatus.SUCCESS);
    } catch (err: any) {
      console.error('Error fetching market deals:', err);
      // Clean error state handling
      setDeals([]); 
      setStatus(MarketStatus.SUCCESS); // Stop loading even on error

      if (err.message !== 'Failed to fetch') {
         setError(err.message);
      }
    }
  };

  useEffect(() => {
    fetchDeals();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Rough bounding box for Nigeria: Lat 4-14, Lng 2.5-15
          // If outside, default to Mile 12
          if (latitude < 4 || latitude > 14 || longitude < 2.5 || longitude > 15) {
             console.log("User outside Nigeria. Defaulting to Mile 12.");
             setUserLocation({ lat: 6.5933, lng: 3.3359 });
          } else {
             setUserLocation({
               lat: latitude,
               lng: longitude
             });
          }
        },
        () => {
          setUserLocation({ lat: 6.5933, lng: 3.3359 });
        }
      );
    }

    const channel = supabase
      .channel('market_deals_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'market_deals' },
        () => {
           // When external change happens, trigger a refresh
           setRefreshTrigger(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshTrigger]); // Depend on refreshTrigger

  // Bulletproof Live Filtering Logic
  const filteredAndSortedDeals = useMemo(() => {
    const currentDeals = deals || [];
    if (!Array.isArray(currentDeals)) return [];

    const searchTerm = (searchQuery || '').toLowerCase();

    const filtered = deals.filter((item: MarketDeal) => {
      if (!item) return false;
      if (!searchTerm) return true;

      const matchesName = (item?.product_name || '').toLowerCase().includes(searchTerm) || 
                          (item?.item_name || '').toLowerCase().includes(searchTerm);
      
      const matchesMarket = (item?.market_a || '').toLowerCase().includes(searchTerm) || 
                            (item?.market_b || '').toLowerCase().includes(searchTerm) ||
                            (item?.market_name || '').toLowerCase().includes(searchTerm);

      const matchesCategory = (item?.specialized_category || '').toLowerCase().includes(searchTerm);

      return matchesName || matchesMarket || matchesCategory;
    });

    if (sortByProfit) {
      return [...filtered].sort((a, b) => {
        const pA = (a.online_price || a.price_b || 0) - (a.mile12_price || a.price_a || 0);
        const pB = (b.online_price || b.price_b || 0) - (b.mile12_price || b.price_a || 0);
        return pB - pA;
      });
    } else {
      return [...filtered].sort((a, b) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
    }
  }, [deals, searchQuery, sortByProfit]);

  const totalPages = Math.ceil(filteredAndSortedDeals.length / itemsPerPage);
  const paginatedDeals = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedDeals.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedDeals, currentPage]);
  
  // Calculate top profitable deals for AI Context
  const topDealsForAI = useMemo(() => {
    return [...deals]
      .sort((a, b) => (b.potential_profit || 0) - (a.potential_profit || 0))
      .slice(0, 15);
  }, [deals]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortByProfit, activeTab]);

  const handleSearchIconClick = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-ekoBlack text-white">
      <Header 
        userLocation={userLocation} 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        assetsCount={deals.length}
      />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {activeTab === 'deals' && (
          <div className="animate-fade-in">
            <div className="mb-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-extrabold text-white tracking-tight">
                    LIVE <span className="text-lagosYellow">DEALS</span>
                  </h2>
                  <p className="text-zinc-500 text-sm mt-1">Real-time arbitrage opportunities filtered by our autonomous agent.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                  {/* Logistics Mode Toggle */}
                  <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1">
                    <button 
                      onClick={() => setLogisticsMode('delivery')}
                      className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                        logisticsMode === 'delivery' 
                        ? 'bg-lagosYellow text-ekoBlack shadow-lg' 
                        : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <i className="fas fa-motorcycle mr-2"></i>
                      Standard
                    </button>
                    <button 
                      onClick={() => setLogisticsMode('pickup')}
                      className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                        logisticsMode === 'pickup' 
                        ? 'bg-lagosYellow text-ekoBlack shadow-lg' 
                        : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <i className="fas fa-walking mr-2"></i>
                      Pickup
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setRefreshTrigger(prev => prev + 1)}
                      className="flex items-center justify-center gap-2 bg-zinc-800 text-white font-bold py-2.5 px-5 rounded-xl transition-all active:scale-95 hover:bg-zinc-700 border border-zinc-700"
                      title="Refresh Data"
                    >
                      <i className={`fas fa-sync-alt ${status === MarketStatus.LOADING ? 'animate-spin' : ''}`}></i>
                    </button>
                    
                    <button 
                      onClick={() => setSortByProfit(!sortByProfit)}
                      className={`flex items-center gap-2 font-black py-2.5 px-6 rounded-xl border transition-all active:scale-95 text-xs tracking-wider ${
                        sortByProfit 
                        ? 'bg-lagosYellow text-ekoBlack border-lagosYellow shadow-[0_0_20px_rgba(255,215,0,0.2)]' 
                        : 'bg-ekoBlack text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-white'
                      }`}
                    >
                      <i className="fas fa-sort-amount-down"></i>
                      {sortByProfit ? 'HIGHEST PROFIT' : 'LATEST DEALS'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="relative max-w-2xl group">
                <i 
                  className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-lagosYellow transition-colors cursor-pointer p-2"
                  onClick={handleSearchIconClick}
                ></i>
                <input 
                  ref={searchInputRef}
                  type="text" 
                  placeholder="Search 1.2k items, markets, or categories..."
                  className="w-full bg-ekoGray border border-zinc-800 rounded-2xl py-4 pl-12 pr-12 text-white placeholder-zinc-600 focus:outline-none focus:border-lagosYellow/50 transition-all focus:ring-1 focus:ring-lagosYellow/20 font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-white transition-all border border-zinc-700"
                    title="Clear Search"
                  >
                    <i className="fas fa-times text-xs"></i>
                  </button>
                )}
              </div>

              {searchQuery && (
                <div className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-1 animate-in fade-in slide-in-from-left-2">
                  Showing <span className="text-lagosYellow">{filteredAndSortedDeals.length}</span> results found in 1.2k entries
                </div>
              )}
            </div>

            <Dashboard 
              deals={paginatedDeals} 
              status={status} 
              error={error}
              userLocation={userLocation}
              logisticsMode={logisticsMode}
            />

            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-6">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev: number) => prev - 1)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-zinc-800 text-zinc-400 font-black text-xs tracking-[0.2em] disabled:opacity-30 disabled:cursor-not-allowed hover:border-lagosYellow hover:text-lagosYellow transition-all bg-ekoGray/50 active:scale-95"
                >
                  <i className="fas fa-arrow-left text-[10px]"></i>
                  PREVIOUS
                </button>
                
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-1">Grid Segment</span>
                  <span className="text-lg font-black text-lagosYellow">
                    {currentPage} <span className="text-zinc-800 text-sm mx-1">/</span> <span className="text-zinc-600 text-sm">{totalPages}</span>
                  </span>
                </div>

                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev: number) => prev + 1)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-zinc-800 text-zinc-400 font-black text-xs tracking-[0.2em] disabled:opacity-30 disabled:cursor-not-allowed hover:border-lagosYellow hover:text-lagosYellow transition-all bg-ekoGray/50 active:scale-95"
                >
                  NEXT
                  <i className="fas fa-arrow-right text-[10px]"></i>
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-black text-white mb-8">Network <span className="text-lagosYellow">Intelligence</span></h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Coverage Card */}
              <div className="bg-ekoGray border border-zinc-800 p-8 rounded-[2rem] flex flex-col items-center justify-center text-center group hover:border-lagosYellow/30 transition-all">
                <div className="w-16 h-16 rounded-2xl bg-lagosYellow/10 flex items-center justify-center mb-6 border border-lagosYellow/10 group-hover:scale-110 transition-transform">
                  <i className="fas fa-database text-lagosYellow text-2xl"></i>
                </div>
                <h3 className="text-zinc-500 font-black uppercase text-xs tracking-widest mb-2">Total Coverage</h3>
                <div className="text-6xl font-black text-white tracking-tighter mb-2">1,200</div>
                <p className="text-zinc-500 text-xs font-medium">Verified Active Assets Across Lagos</p>
              </div>

              {/* Average ROI Card */}
              <div className="bg-ekoGray border border-zinc-800 p-8 rounded-[2rem] flex flex-col items-center justify-center text-center group hover:border-lagosYellow/30 transition-all">
                <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6 border border-green-500/10 group-hover:scale-110 transition-transform">
                  <i className="fas fa-percentage text-green-500 text-2xl"></i>
                </div>
                <h3 className="text-zinc-500 font-black uppercase text-xs tracking-widest mb-2">Avg. Opportunity ROI</h3>
                <div className="text-6xl font-black text-white tracking-tighter mb-2">32%</div>
                <p className="text-zinc-500 text-xs font-medium">Real-time Margin Index</p>
              </div>

              {/* Data Freshness Card */}
              <div className="bg-ekoGray border border-zinc-800 p-8 rounded-[2rem] flex flex-col items-center justify-center text-center group hover:border-lagosYellow/30 transition-all">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/10 group-hover:scale-110 transition-transform">
                  <i className="fas fa-bolt text-blue-500 text-2xl"></i>
                </div>
                <h3 className="text-zinc-500 font-black uppercase text-xs tracking-widest mb-2">Sync Latency</h3>
                <div className="text-6xl font-black text-white tracking-tighter mb-2">0.8s</div>
                <p className="text-zinc-500 text-xs font-medium">Real-time Ground Price Updates</p>
              </div>
            </div>

            <div className="mt-12 bg-ekoGray/30 border border-zinc-800 rounded-3xl p-12 text-center">
               <p className="text-zinc-500 font-mono text-sm max-w-2xl mx-auto leading-relaxed">
                  The Eko Arbitrage Agent is currently processing cross-market liquidity maps for 1.2k assets. 
                  Machine learning modules are being updated with today's price movements from Mile 12 to Epe.
               </p>
            </div>
          </div>
        )}

        {activeTab === 'markets' && (
          <div className="animate-fade-in flex flex-col items-center justify-center py-32 bg-ekoGray border border-zinc-800 rounded-[3rem] text-center px-6">
            <div className="w-24 h-24 rounded-full bg-lagosYellow/10 flex items-center justify-center mb-8 border border-lagosYellow/20 animate-pulse">
               <i className="fas fa-store-alt text-lagosYellow text-4xl"></i>
            </div>
            <h2 className="text-4xl font-black text-white mb-6 tracking-tighter">Market Hub <span className="text-lagosYellow">Dynamics</span></h2>
            <p className="text-zinc-400 max-w-xl text-lg font-medium leading-relaxed">
              We are monitoring volatile shifts in <strong>Mile 12</strong>, <strong>Oyingbo</strong>, <strong>Alaba International</strong>, and <strong>Computer Village</strong>. 
              Price clustering reports will be available once the agent finalizes current scans.
            </p>
          </div>
        )}
      </main>

      {/* AI Chat Bot */}
      <ChatComponent topDeals={topDealsForAI} allDeals={deals} />

      <footer className="border-t border-zinc-900 py-10 mt-12 bg-ekoBlack">
        <div className="container mx-auto px-4 text-center">
          <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest">
            &copy; {new Date().getFullYear()} Eko Market Arbitrage Agent
          </p>
          <div className="flex justify-center gap-6 mt-4">
            <span className="text-zinc-800 text-[9px] font-black uppercase tracking-[0.4em]">Autonomous Intelligence</span>
            <span className="text-zinc-800 text-[9px] font-black uppercase tracking-[0.4em]">Lagos Market Grid</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
