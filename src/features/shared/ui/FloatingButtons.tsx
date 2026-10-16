/**
 * Floating Action Buttons Component
 *
 * Displays WhatsApp and Chatbot floating buttons on the bottom corners of the screen.
 * - WhatsApp button on the left (green, pulsing animation)
 * - Chatbot button on the right (blue)
 *
 * @module FloatingButtons
 */

import { useState } from 'react';
import { MessageCircle, Bot, X, ChevronDown } from 'lucide-react';
import { ChatbotModal } from './ChatbotModal';

interface FloatingButtonsProps {
  /** WhatsApp phone number, digits only (e.g. 254700000000). Hides the button when empty. */
  whatsappPhone?: string;
}

/**
 * Floating action buttons component
 *
 * Shows two floating buttons:
 * - Left: WhatsApp contact (opens wa.me link) — only when a number is configured
 * - Right: AI Chatbot (opens chat modal)
 *
 * @example
 * <FloatingButtons whatsappPhone="254700000000" />
 */
export function FloatingButtons({ whatsappPhone = '' }: FloatingButtonsProps) {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isChatbotMinimized, setIsChatbotMinimized] = useState(false);

  // Digits-only number for wa.me; empty when the admin hasn't set one yet
  const waDigits = whatsappPhone.replace(/\D/g, '');
  const whatsappLink = `https://wa.me/${waDigits}`;

  return (
    <>
      {/* WhatsApp Button - Left Side (hidden until a number is configured) */}
      {waDigits && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-20 left-4 z-40 flex items-center justify-center w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 animate-pulse"
          aria-label="Contact us on WhatsApp"
        >
          <MessageCircle size={28} strokeWidth={2.5} />
        </a>
      )}

      {/* Chatbot Button - Right Side */}
      {!isChatbotOpen || isChatbotMinimized ? (
        <button
          onClick={() => {
            setIsChatbotOpen(true);
            setIsChatbotMinimized(false);
          }}
          className="fixed bottom-20 right-4 z-40 flex items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
          aria-label="Open AI chatbot"
        >
          <Bot size={28} strokeWidth={2.5} />
        </button>
      ) : (
        // Minimize button when chat is open
        <button
          onClick={() => setIsChatbotMinimized(true)}
          className="fixed bottom-20 right-4 z-40 flex items-center justify-center w-14 h-14 bg-slate-700 hover:bg-slate-800 text-white rounded-full shadow-lg transition-all"
          aria-label="Minimize chatbot"
        >
          <ChevronDown size={28} strokeWidth={2.5} />
        </button>
      )}

      {/* Chatbot Modal */}
      {(isChatbotOpen && !isChatbotMinimized) && (
        <ChatbotModal
          isOpen={isChatbotOpen}
          onClose={() => setIsChatbotOpen(false)}
          onMinimize={() => setIsChatbotMinimized(true)}
        />
      )}

      {/* Spacer for mobile bottom nav */}
      <div className="h-16 md:hidden" />
    </>
  );
}

export default FloatingButtons;
