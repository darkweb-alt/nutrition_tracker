
import React, { useState, useRef, useEffect } from 'react';
import { getNutritionAdvice } from '../services/geminiService';
import { UserProfile, ChatMessage } from '../types';

interface ChatBotProps {
  profile: UserProfile;
}

const ChatBot: React.FC<ChatBotProps> = ({ profile }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: `Hi ${profile.name}! I'm NutriLens AI. I can search the web for the latest nutrition facts. What's on your mind?` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
    const result = await getNutritionAdvice(userMessage, profile, history);
    
    setMessages(prev => [...prev, { role: 'model', text: result.text || "I couldn't find an answer for that.", sources: result.sources }]);
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] animate-fadeIn">
      <div className="p-6 pb-2 shrink-0">
        <div className="flex items-center gap-2">
           <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Health Lab</h2>
           <span className="bg-emerald-500/10 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Live Search</span>
        </div>
        <p className="text-slate-500 text-sm mt-1">AI-powered nutrition research</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-6">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fadeIn`}>
            <div className={`max-w-[85%] rounded-[1.5rem] p-4 text-sm font-medium leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-br-none' 
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-bl-none'
            }`}>
              {msg.text}
            </div>
            {msg.sources && msg.sources.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2 max-w-[85%]">
                <p className="text-[10px] font-black text-slate-400 uppercase w-full">Sources:</p>
                {msg.sources.map((src, idx) => (
                  <a key={idx} href={src.uri} target="_blank" rel="noopener noreferrer" className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-emerald-600 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 truncate max-w-full">
                    <i className="fa-solid fa-link mr-1"></i>{src.title}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] rounded-bl-none p-4">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-5 pb-10 shrink-0">
        <form onSubmit={handleSend} className="relative">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about food..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] pl-6 pr-14 py-4 font-bold text-slate-700 dark:text-slate-100 outline-none focus:border-emerald-500 shadow-sm"
          />
          <button type="submit" disabled={!input.trim() || isTyping} className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all disabled:opacity-50">
            <i className="fa-solid fa-paper-plane text-sm"></i>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBot;
