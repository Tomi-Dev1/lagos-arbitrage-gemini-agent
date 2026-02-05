
import React, { useState, useRef, useEffect } from 'react';
import { MarketDeal } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ChatComponentProps {
  topDeals: MarketDeal[];
  allDeals: MarketDeal[];
}

const ChatComponent: React.FC<ChatComponentProps> = ({ topDeals, allDeals }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<'english' | 'pidgin'>('english');
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: "Welcome! I analyze 1,200+ market prices from Mile 12, Oyingbo, other major markets, and online stores to uncover profitable trading opportunities. Ask me about a product (like beans, rice, or tomatoes), and I’ll show you the best deals and potential profit." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Update initial greeting when language changes (optional, but good for UX)
  // Context Reset: Clear history and update greeting when language changes
  useEffect(() => {
      // Always reset context on language switch to avoid mixed languages
      if (language === 'english') {
          setMessages([{ role: 'model', text: "Welcome! I analyze 1,200+ market prices from Mile 12, Oyingbo, other major markets, and online stores to uncover profitable trading opportunities. Ask me about a product (like beans, rice, or tomatoes), and I’ll show you the best deals and potential profit." }]);
      } else {
          setMessages([{ role: 'model', text: "Oga/Madam, welcome! See better market deal wey fit give you serious gain. Which one you wan check? Beans, Rice abi Tomatoes?" }]);
      }
  }, [language]);


  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
           throw new Error("Missing Gemini API Key");
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
        }, { apiVersion: 'v1beta' });

        // Convert data to readable text string as requested
        const dealsContext = topDeals.map((d, index) => 
            `${index + 1}. Item: ${d.product_name} | Buy at: ${d.market_name} (N${d.price_a}) | Sell at: ${d.market_b} (N${d.price_b}) | Profit: N${d.potential_profit} (${d.profit_percentage}%)`
        ).join('\n');

        // NEW: Generate CSV from all deals
        const generateCSV = (data: MarketDeal[]) => {
            // Schema: item_name, mile12_price, online_price, market_name, specialized_category, profit
            const headers = "item_name,mile12_price,online_price,market_name,specialized_category,profit";
            const rows = data.map(d => {
                // Determine best values based on logic
                const itemName = d.item_name || d.product_name || "Unknown Item";
                const buyPrice = d.mile12_price || d.price_a || 0;
                const sellPrice = d.online_price || d.price_b || 0;
                const marketName = d.market_name || d.market_a || "Unknown Market";
                const category = d.specialized_category || "General";
                const profit = d.potential_profit || (sellPrice - buyPrice);

                return `"${itemName}",${buyPrice},${sellPrice},"${marketName}","${category}",${profit}`;
            }).join('\n');
            return `${headers}\n${rows}`;
        };
        
        const csvData = generateCSV(allDeals);

        let systemPrompt = '';

        if (language === 'english') {
            systemPrompt = `
            You are a **Friendly Market Guide**. 
            - **Tone**: Simple, conversational, easy to understand. Avoid corporate or academic language.
            - **Goal**: Help the user find profitable deals quickly.
            - **Constraint**: Return ONLY the **Top 3** most profitable deals by default. Keep it short.
            - **Data**: You have access to a CSV file stored in Supabase that contains market deal data.
            `;
        } else {
            systemPrompt = `
            You are a **Naija Market Paddy**.
            - **Tone**: Natural Nigerian Pidgin (e.g., "How far?", "See better deal", "No long tin").
            - **Goal**: Give sharp updates on where money dey.
            - **Constraint**: Show ONLY the **Top 3** better deals. No long story.
            - **Data**: You have access to a CSV file stored in Supabase that contains market deal data.
            `;
        }

        const prompt = `
        ${systemPrompt}
        
        **Live Market Data (CSV Source):**
        \`\`\`csv
        ${csvData}
        \`\`\`
        
        **CSV Schema Definition:**
        - **item_name**: Product name (e.g. "Honey Beans", "Foreign Rice")
        - **mile12_price**: Offline / Local market buy price (Cost Price)
        - **online_price**: Online or Secondary market sell price (Selling Price)
        - **market_name**: Source market for the buy price
        - **specialized_category**: Product category
        - **profit**: Absolute profit per unit (online_price - mile12_price)

        **Instructions:**
        1. **Load & Parse**: Parse the CSV data above into structured records.
        2. **Partial Matching**: When the user queries a product (e.g. "beans"), match it strongly against the \`item_name\` column using partial string matching (e.g. "beans" matches "Brown Beans (50kg)").
        3. **Pricing Source**: 
           - ALWAYS use \`mile12_price\` as the BUY price.
           - ALWAYS use \`online_price\` as the SELL price.
           - Use \`profit\` to rank the best deals.
        4. **Data Availability**: 
           - Do NOT expect columns named "Product", "Price A", etc. Use the customized schema above.
           - If a queried product exists in \`item_name\`, NEVER respond with "no data available". Explain the deal found.
        5. **Response Format**:
           - **Default**: Show ONLY the Top 3 best deals. 
           - **Concise**: Keep answers short. No long reports.
           - **Scope**: Do NOT analyze the full dataset unless explicitly asked (e.g., "Analyze everything").
           - **Next Step**: Ask the user if they want to see more deals or details.
        
        **User Query:** "${userMessage}"
        `;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        setMessages(prev => [...prev, { role: 'model', text: text }]);
    } catch (error: any) {
        console.error("Gemini Error:", error);
        // Direct error exposure
        setMessages(prev => [...prev, { role: 'model', text: `Error: ${error.message || "Something wen wrong with the API."}` }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleShareLatestResponse = () => {
    // Find last model message
    const lastModelMessage = [...messages].reverse().find(m => m.role === 'model');
    
    if (!lastModelMessage) return;
    
    const message = `AI Market Insight
${lastModelMessage.text}

Shared via Eko Arbitrage Market Agent`;

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-lagosYellow rounded-full shadow-2xl flex items-center justify-center cursor-pointer hover:scale-110 transition-transform z-50 animate-bounce-slow group"
        title="Ask Market Expert"
      >
        {isOpen ? (
          <i className="fas fa-times text-ekoBlack text-2xl font-bold"></i>
        ) : (
          <i className="fas fa-robot text-ekoBlack text-2xl font-bold group-hover:rotate-12 transition-transform"></i>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-ekoGray border border-zinc-800 rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-10">
          {/* Header */}
          <div className="bg-zinc-900/90 backdrop-blur p-4 border-b border-zinc-800 flex items-center justify-between">
             <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-lagosYellow/20 flex items-center justify-center border border-lagosYellow/50">
                    <i className="fas fa-robot text-lagosYellow text-sm"></i>
                 </div>
                 <div>
                    <h3 className="text-white font-bold text-sm">
                        {language === 'english' ? 'Market Analyst' : 'Market Expert'}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Online</span>
                    </div>
                 </div>
             </div>
             
             {/* Language Toggle */}
             <div className="flex bg-zinc-800 rounded-lg p-1 border border-zinc-700">
                 <button 
                    onClick={() => setLanguage('english')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${language === 'english' ? 'bg-ekoBlack text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                 >
                     ENG
                 </button>
                 <button 
                    onClick={() => setLanguage('pidgin')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${language === 'pidgin' ? 'bg-lagosYellow text-ekoBlack shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                 >
                     PIDGIN
                 </button>
             </div>
          </div>

          {/* Messages Area */}
          <div className="flex-grow p-4 overflow-y-auto space-y-4 custom-scrollbar bg-ekoBlack/50">
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user' 
                        ? 'bg-zinc-800 text-white rounded-tr-none border border-zinc-700' 
                        : 'bg-lagosYellow text-ekoBlack rounded-tl-none font-medium shadow-lg'
                    }`}>
                        {msg.text}
                    </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex justify-start">
                    <div className="bg-zinc-900 p-3 rounded-2xl rounded-tl-none border border-zinc-800 flex gap-1">
                        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce delay-100"></span>
                        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce delay-200"></span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-zinc-900 border-t border-zinc-800">
            <div className="relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={language === 'english' ? "Ask for investment advice..." : "Ask about sharp deals..."}
                    className="w-full bg-ekoBlack border border-zinc-700 rounded-xl py-3 pl-4 pr-12 text-white text-sm focus:outline-none focus:border-lagosYellow/50 transition-colors"
                />
                <button 
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-lagosYellow rounded-lg flex items-center justify-center text-ekoBlack hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <i className="fas fa-paper-plane text-xs"></i>
                </button>
            </div>
            
             <div className="flex justify-between items-center mt-3">
                <button 
                  onClick={handleShareLatestResponse}
                  disabled={messages.length <= 1} 
                  className={`text-[10px] font-bold flex items-center gap-1 transition-colors ${
                    messages.length <= 1 
                      ? 'text-zinc-700 cursor-not-allowed' 
                      : 'text-[#25D366] hover:text-[#128C7E]'
                  }`}
                  title={messages.length <= 1 ? "Ask for a deal first" : "Share latest insight"}
                >
                    <i className="fab fa-whatsapp"></i>
                    <span>Share Insight</span>
                </button>

                <div className="text-center">
                     <p className="text-[9px] text-zinc-600 font-mono">POWERED BY GEMINI 2.5</p>
                </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatComponent;
