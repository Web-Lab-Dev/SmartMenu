'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Loader2 } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { getQuickSuggestions } from '@/lib/ai-helpers';
import { toast } from 'sonner';

interface AIChatBubbleProps {
  restaurantId: string;
}

/**
 * AI Chat Bubble - Floating AI Concierge
 * - FAB button with Sparkles icon
 * - Bottom sheet on mobile with Glassmorphism
 * - Quick suggestions chips
 * - Streaming chat with machine-à-écrire effect
 */
export function AIChatBubble({ restaurantId: _restaurantId }: AIChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatHelpers = useChat({
    onError: (error: Error) => {
      console.error('[AI Chat] Error:', error);
      toast.error('Erreur de connexion avec l\'IA');
    },
  } as any);

  const messages = (chatHelpers as any).messages || [];
  const input = (chatHelpers as any).input || '';
  const setInput = (chatHelpers as any).setInput || ((_val: string) => {});
  const handleSubmit = (chatHelpers as any).handleSubmit || ((_e: any) => {});
  const isLoading = (chatHelpers as any).isLoading || false;
  const error = (chatHelpers as any).error;

  const quickSuggestions = getQuickSuggestions();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle quick suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    // Set input value
    setInput(suggestion);

    // Small delay to ensure input is set
    setTimeout(() => {
      const syntheticEvent = {
        preventDefault: () => {},
      } as React.FormEvent;
      handleSubmit(syntheticEvent);
    }, 50);
  };

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-40 glass-fab rounded-full p-4 shadow-2xl"
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            style={{ background: 'linear-gradient(135deg, rgba(255, 69, 0, 0.9), rgba(255, 140, 0, 0.9))' }}
          >
            <Sparkles className="w-6 h-6 text-white" />
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Bottom Sheet */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 z-50"
            />

            {/* Chat Panel */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 glass-panel rounded-t-3xl max-h-[80vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Concierge IA</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      À votre service 🍽️
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">
                      Bonjour ! Je suis votre concierge IA.
                      <br />
                      Posez-moi vos questions sur le menu ! 😊
                    </p>
                  </div>
                )}

                {messages.map((message: any) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                          : 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-md text-gray-900 dark:text-white'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {(message as any).content || ''}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl px-4 py-3">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-900 dark:text-white" />
                    </div>
                  </motion.div>
                )}

                {error && (
                  <div className="text-center text-red-500 text-sm">
                    Une erreur est survenue. Veuillez réessayer.
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Suggestions */}
              {messages.length === 0 && (
                <div className="px-4 pb-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Suggestions rapides :
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {quickSuggestions.slice(0, 3).map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-xs px-3 py-2 glass-panel rounded-full hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
                        disabled={isLoading}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <form
                onSubmit={handleSubmit}
                className="p-4 border-t border-white/10 flex gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Posez votre question..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 rounded-full glass-panel focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input || !input.trim()}
                  className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
