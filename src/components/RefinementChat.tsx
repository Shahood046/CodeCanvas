import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { motion, MotionConfig, AnimatePresence } from 'framer-motion';
import { Input } from './ui/input';
import { ChatMessage, AppMode } from '../types';
import { cn } from '../lib/utils';

interface RefinementChatProps {
  mode: AppMode;
  onRefine: (instruction: string) => Promise<void>;
  isRefining: boolean;
}

const transition = {
  type: "spring" as const,
  bounce: 0.2,
  duration: 0.4,
};

export const RefinementChat: React.FC<RefinementChatProps> = ({ mode, onRefine, isRefining }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isRefining) return;

    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Optimistic AI response
    setMessages((prev) => [...prev, { role: 'ai', content: 'Thinking...' }]);

    await onRefine(userMsg.content);

    // Update the last AI message
    setMessages(prev => {
      const newHistory = [...prev];
      newHistory[newHistory.length - 1] = { 
        role: 'ai', 
        content: `I've updated the ${mode === 'ui' ? 'React Code' : 'Infrastructure Config'} based on your request.` 
      };
      return newHistory;
    });
  };

  return (
    <MotionConfig transition={transition}>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <motion.div
          initial={false}
          animate={{
            height: isOpen ? "450px" : "50px",
            width: isOpen ? "360px" : "50px",
            borderRadius: isOpen ? "24px" : "12px",
          }}
          className={cn(
            "flex flex-col overflow-hidden shadow-2xl relative",
            isOpen 
              ? "bg-slate-900 border border-white/10" 
              : "bg-transparent border-none drop-shadow-xl" // Let the inner button handle the look when closed
          )}
        >
          {/* Header */}
          <div className={cn("flex items-center justify-between px-4 py-3 shrink-0", isOpen ? "bg-slate-950/50 border-b border-white/5" : "hidden")}>
             <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-sky-400" />
                <span className="font-bold text-white text-sm">Refinement Studio</span>
             </div>
             <button 
               onClick={() => setIsOpen(false)}
               className="text-slate-400 hover:text-white transition-colors p-1"
             >
               <X size={18} />
             </button>
          </div>

          {/* Toggle Button (Visible when closed, or acts as header toggle?) 
              Actually, following MinimalChatBox, the toggle is part of the header or a separate element.
              We'll use a specific overlay for the closed state to match the requested "Cool Button" style.
          */}
          {!isOpen && (
            <motion.button
              layoutId="chat-trigger"
              onClick={() => setIsOpen(true)}
              className="absolute inset-0 w-full h-full flex items-center justify-center rounded-md bg-gradient-to-r from-slate-800 to-black text-white hover:from-[#331029] hover:to-[#310413] transition-all duration-500 group"
            >
              <motion.div layoutId="chat-icon">
                <MessageSquare size={20} className="group-hover:scale-110 transition-transform" />
              </motion.div>
            </motion.button>
          )}

          {/* Messages Area */}
          <AnimatePresence>
            {isOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 px-4 py-4 overflow-y-auto flex flex-col gap-3 bg-slate-900"
                ref={scrollRef}
              >
                {messages.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs space-y-2 opacity-60">
                     <Sparkles size={24} className="mb-2" />
                     <p>Ask me to adjust colors, layout,</p>
                     <p>or add new components.</p>
                  </div>
                )}
                
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "max-w-[85%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed",
                      msg.role === 'user' 
                        ? "self-end bg-sky-600 text-white rounded-br-sm" 
                        : "self-start bg-slate-800 text-slate-200 border border-white/5 rounded-bl-sm"
                    )}
                  >
                     {msg.content === 'Thinking...' && isRefining ? (
                        <div className="flex items-center gap-2">
                          <Loader2 size={12} className="animate-spin" />
                          <span>Processing...</span>
                        </div>
                      ) : (
                        msg.content
                      )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Area */}
          <AnimatePresence>
            {isOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="p-3 bg-slate-950/50 border-t border-white/5 shrink-0"
              >
                <div className="flex items-center gap-2">
                  <Input
                    className="flex-1 h-10 bg-slate-950 border-white/10 focus-visible:ring-sky-500/30"
                    placeholder={mode === 'ui' ? "e.g., Make buttons larger..." : "e.g., Add a Redis cache..."}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    disabled={isRefining}
                  />
                  <button
                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleSend}
                    disabled={!input.trim() || isRefining}
                  >
                    {isRefining ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </MotionConfig>
  );
};