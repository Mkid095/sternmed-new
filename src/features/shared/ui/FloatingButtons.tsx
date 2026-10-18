/**
 * Floating Action Buttons Component
 *
 * Displays WhatsApp and Chatbot floating buttons on the bottom corners of the screen.
 * - WhatsApp button on the left (green, pulsing animation)
 * - Chatbot button on the right (blue)
 *
 * They retire as the footer approaches
 * -----------------------------------
 * Both buttons are `fixed`, so they float over whatever is under them — which,
 * on the way down a page, includes the footer's category and contact links. They
 * sat on top of them and made those links unclickable. A full footer-width band
 * of clicking-that-does-nothing is a broken page, so they now fade out once the
 * footer is in view and the footer carries its own WhatsApp call to action in
 * exactly the place the button would have been covering.
 *
 * @module FloatingButtons
 */

import { useEffect, useState } from 'react';
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
  const [isPastFooter, setIsPastFooter] = useState(false);

  // Digits-only number for wa.me; empty when the admin hasn't set one yet
  const waDigits = whatsappPhone.replace(/\D/g, '');
  const whatsappLink = `https://wa.me/${waDigits}`;

  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer) return;

    /*
     * Observe the footer itself.
     *
     * A sentinel placed above it looked equivalent and never fired: the footer
     * is taller than the viewport, so at maximum scroll its top — and anything
     * directly above it — is off-screen. The buttons stayed visible over the
     * whole footer, which was the thing being fixed.
     *
     * The bottom rootMargin means they start leaving a little before the footer
     * arrives, so the transition is not a pop as the first pixel appears.
     */
    const observer = new IntersectionObserver(
      ([entry]) => setIsPastFooter(entry.isIntersecting),
      { rootMargin: '0px 0px -160px 0px' },
    );
    observer.observe(footer);

    return () => observer.disconnect();
  }, []);

  const hidden = isPastFooter ? 'pointer-events-none opacity-0' : 'opacity-100';
  const shared =
    'fixed bottom-20 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 ' +
    hidden;

  return (
    <>
      {/*
        No `animate-pulse` on the WhatsApp button. It animates opacity on the
        element's own timeline between 0.5 and 1, so it beat the fade-out — the
        button never actually reached hidden over the footer, it just sat at
        half opacity still swallowing clicks. Constant motion is its own
        problem too: an animation that never stops is a WCAG 2.2.2 failure.
        Hover and active scale give the same feedback a pulse was for.
      */}
      {/* WhatsApp Button - Left Side (hidden until a number is configured) */}
      {waDigits && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className={`${shared} left-4 bg-green-500 hover:bg-green-600`}
          aria-label="Contact us on WhatsApp"
          tabIndex={isPastFooter ? -1 : undefined}
        >
          <MessageCircle size={28} strokeWidth={2.5} aria-hidden="true" />
        </a>
      )}

      {/* Chatbot Button - Right Side */}
      {!isChatbotOpen || isChatbotMinimized ? (
        <button
          onClick={() => {
            setIsChatbotOpen(true);
            setIsChatbotMinimized(false);
          }}
          className={`${shared} right-4 bg-blue-600 hover:bg-blue-700`}
          aria-label="Open AI chatbot"
          tabIndex={isPastFooter ? -1 : undefined}
        >
          <Bot size={28} strokeWidth={2.5} aria-hidden="true" />
        </button>
      ) : (
        // Minimize button when chat is open
        <button
          onClick={() => setIsChatbotMinimized(true)}
          className={`fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-slate-700 text-white shadow-lg transition-all hover:bg-slate-800 ${hidden}`}
          aria-label="Minimize chatbot"
        >
          <ChevronDown size={28} strokeWidth={2.5} aria-hidden="true" />
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
