/**
 * Chatbot Modal Component
 *
 * AI-powered chatbot using DeepSeek API to help customers
 * with product information, orders, and general inquiries.
 * Context-aware of shop products and categories.
 *
 * @module ChatbotModal
 */

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, ChevronDown, Send, User, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { Product, Category } from '../../../types';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || '';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface ChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
}

/**
 * Initial greeting message
 */
const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: '👋 Hi! I\'m your Sternmed guide. Ask me about products, categories, or ordering!',
  timestamp: Date.now(),
};

export function ChatbotModal({ isOpen, onClose, onMinimize }: ChatbotModalProps) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch products and categories for context
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          api.getProducts(),
          api.getCategories(),
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to fetch context data:', error);
      }
    };
    fetchData();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Build context-aware system prompt with shop data
   */
  const buildSystemPrompt = (): string => {
    const categoryList = categories.map(c => `- ${c.name}: /shop?category=${c.id}`).join('\n');

    const featuredProducts = products.filter(p => p.isFeatured).slice(0, 5);
    const featuredList = featuredProducts.map(p => `- ${p.name} (Ksh ${p.price}): /product/${p.id}`).join('\n');

    return `You are a concise tour guide for Sternmed Afrika medical shop in Nairobi.

KEY: Keep responses under 30 words. Be helpful and direct.

SHOP STRUCTURE:
${categoryList}

FEATURED PRODUCTS:
${featuredList}

HOW TO HELP:
1. Guide customers to specific pages using links
2. Mention prices in Ksh when relevant
3. For product questions: send the product link
4. For category browsing: send the category link
5. For ordering: explain WhatsApp checkout
6. Keep replies VERY short - max 2-3 sentences

EXAMPLES:
Q: "What IV cannulas do you have?"
A: "We have IV Cannulas in 18G, 20G, and 22G sizes from Ksh 150. View all: /shop?category=28bbfbde-ba61-48e9-b11c-d7947b3945f1"

Q: "How do I order?"
A: "Add items to cart, then checkout via WhatsApp. Quick and easy!"

Q: "Tell me about foley catheters"
A: "We have Foley Catheters in sizes 12-16 FR at Ksh 180. Browse: /shop?category=7643e72a-4e55-4124-8ab0-e68d244b2206`;
  };

  /**
   * Send message to DeepSeek API
   */
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    if (!DEEPSEEK_API_KEY) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Sorry, chat service is unavailable. Please contact us via WhatsApp.',
        timestamp: Date.now(),
      }]);
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const apiMessages = [
        { role: 'system', content: buildSystemPrompt() },
        ...messages.slice(-6).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user', content: userMessage.content },
      ];

      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: apiMessages,
          temperature: 0.3,
          max_tokens: 150,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'API error');
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.choices[0]?.message?.content?.trim() || 'How can I help you find what you need?',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Chatbot error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Having connection issues. Please try again or contact us on WhatsApp.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle keyboard submit (Enter to send, Shift+Enter for new line)
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /**
   * Parse message and render with clickable links
   * Detects patterns like /shop?category=... or /product/...
   */
  const renderMessageWithLinks = (content: string) => {
    // Pattern to match internal links with UUIDs like /shop?category=... or /product/...
    // Matches: /shop?category=uuid OR /product/uuid
    const linkPattern = /(\/[a-z]+\?[a-z]+=[a-f0-9\-]+|\/product\/[a-f0-9\-]+)/gi;

    // Split by the pattern and keep track of matches
    const parts: Array<{ text: string; isLink: boolean }> = [];
    let lastIndex = 0;
    let match;

    while ((match = linkPattern.exec(content)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        parts.push({ text: content.slice(lastIndex, match.index), isLink: false });
      }
      // Add the link
      parts.push({ text: match[0], isLink: true });
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({ text: content.slice(lastIndex), isLink: false });
    }

    return parts.map((part, index) => {
      if (part.isLink) {
        const linkText = part.text.includes('/product/')
          ? 'View Product'
          : part.text.includes('/shop')
          ? 'Browse Category'
          : part.text;

        return (
          <button
            key={index}
            onClick={() => {
              navigate(part.text);
              // Don't close modal - allow continued conversation
            }}
            className="text-blue-600 hover:text-blue-700 underline font-medium cursor-pointer bg-blue-50 px-1.5 py-0.5 rounded text-xs inline-flex items-center gap-1"
          >
            {linkText}
          </button>
        );
      }
      return <span key={index}>{part.text}</span>;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 w-[calc(100vw-2rem)] sm:w-96 h-[500px] max-h-[60vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 text-white">
        <div className="flex items-center gap-2">
          <Bot size={20} className="text-blue-400" />
          <div>
            <h3 className="font-semibold text-sm">Sternmed Guide</h3>
            <p className="text-[10px] text-slate-300">Ask me anything</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onMinimize}
            className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Minimize"
          >
            <ChevronDown size={18} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        {messages.map((message, index) => (
          <div
            key={`${message.timestamp}-${index}`}
            className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                <Bot size={16} className="text-blue-400" />
              </div>
            )}
            <div
              className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-white text-slate-700 rounded-bl-md shadow-sm border border-slate-200'
              }`}
            >
              <p className="whitespace-pre-wrap break-words">
                {message.role === 'assistant' ? renderMessageWithLinks(message.content) : message.content}
              </p>
            </div>
            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center">
                <User size={16} className="text-slate-600" />
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-2 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <Bot size={16} className="text-blue-400" />
            </div>
            <div className="px-3 py-2 bg-white rounded-2xl rounded-bl-md shadow-sm border border-slate-200">
              <Loader2 size={16} className="animate-spin text-blue-600" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-slate-200">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about products..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 bg-slate-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5 text-center">
          Press Enter to send
        </p>
      </div>
    </div>
  );
}

export default ChatbotModal;
