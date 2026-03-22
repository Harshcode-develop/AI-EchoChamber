import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Loader2, Volume2, VolumeX, Mic } from 'lucide-react';
import { sendChatMessage } from '../../services/api';
import type { ChatMessage } from '../../types';

const INITIAL_SUGGESTIONS = [
  'How does it work?',
  'What formats are supported?',
  'How long does it take?',
  'Is my data safe?',
];

/**
 * Strip markdown/emoji symbols from text for clean speech synthesis.
 * This ensures the browser TTS only reads actual words.
 */
function cleanTextForSpeech(text: string): string {
  let cleaned = text;
  // Remove markdown bold/italic
  cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, '$1');
  cleaned = cleaned.replace(/\*(.+?)\*/g, '$1');
  // Remove headers
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
  // Remove backticks
  cleaned = cleaned.replace(/`(.+?)`/g, '$1');
  // Remove code fences
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  // Remove markdown links [text](url) -> text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  // Remove emoji (Unicode emoji ranges)
  cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}\u{23CF}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{1FA70}-\u{1FAFF}]/gu, '');
  // Remove bullet dashes at start of lines for smoother speech
  cleaned = cleaned.replace(/^\s*[-•]\s+/gm, '');
  // Collapse multiple spaces/newlines
  cleaned = cleaned.replace(/\n+/g, '. ');
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  return cleaned.trim();
}

/**
 * Render chat message text as structured JSX.
 * Supports line breaks + dash-prefixed lists rendered as proper list items.
 */
function FormattedMessage({ text }: { text: string }) {
  const parts = useMemo(() => {
    const lines = text.split('\n');
    const result: { type: 'text' | 'list-item'; content: string }[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('- ')) {
        result.push({ type: 'list-item', content: trimmed.slice(2) });
      } else {
        result.push({ type: 'text', content: trimmed });
      }
    }
    return result;
  }, [text]);

  // Check if there are any list items — if so, group them
  const elements: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={key++} style={{ margin: '6px 0', paddingLeft: '16px', listStyleType: 'disc' }}>
          {listBuffer.map((item, i) => (
            <li key={i} style={{ marginBottom: '2px', lineHeight: '1.5' }}>{item}</li>
          ))}
        </ul>
      );
      listBuffer = [];
    }
  };

  for (const part of parts) {
    if (part.type === 'list-item') {
      listBuffer.push(part.content);
    } else {
      flushList();
      elements.push(
        <p key={key++} style={{ margin: '4px 0', lineHeight: '1.5' }}>{part.content}</p>
      );
    }
  }
  flushList();

  return <div>{elements}</div>;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hey there! I'm Echo, your AI content assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(INITIAL_SUGGESTIONS);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Speak initial message on open
  useEffect(() => {
    if (isOpen && isSpeechEnabled && messages.length === 1 && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanTextForSpeech(messages[0].content));
      window.speechSynthesis.speak(utterance);
    }
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMsg: ChatMessage = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setSuggestions([]);

    try {
      const response = await sendChatMessage(newMessages);
      setMessages([
        ...newMessages,
        { role: 'assistant', content: response.message.content },
      ]);
      
      // Speak the assistant's response (cleaned for TTS)
      if (isSpeechEnabled && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const cleanText = cleanTextForSpeech(response.message.content);
        const utterance = new SpeechSynthesisUtterance(cleanText);
        window.speechSynthesis.speak(utterance);
      }

      if (response.suggested_questions.length > 0) {
        setSuggestions(response.suggested_questions);
      }
    } catch {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
      setSuggestions(INITIAL_SUGGESTIONS);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice dictation is not supported in this browser.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => prev + (prev ? ' ' : '') + transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const toggleSpeech = () => {
    if (isSpeechEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeechEnabled(!isSpeechEnabled);
  };

  return (
    <>
      {/* Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full gradient-bg-pink text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center glow-pink"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[380px] max-h-[calc(100vh-5rem)] h-[520px] rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl flex flex-col overflow-hidden hardware-accelerated"
          >
            {/* Header */}
            <div className="gradient-bg-pink px-5 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">Echo Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-white/70 text-xs">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleSpeech}
                  className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/80 transition-all"
                  title={isSpeechEnabled ? "Mute Echo" : "Unmute Echo"}
                >
                  {isSpeechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                    setIsOpen(false);
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/80 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      msg.role === 'user'
                        ? 'bg-[var(--accent-purple)]/10'
                        : 'bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <User className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
                    ) : (
                      <Bot className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                    )}
                  </div>
                  <div
                    className={`max-w-[75%] px-4 py-3 rounded-xl text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-br-sm'
                        : 'bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-bl-sm'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <FormattedMessage text={msg.content} />
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                  </div>
                  <div className="bg-[var(--bg-tertiary)] px-4 py-3 rounded-xl rounded-bl-sm">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-[var(--text-tertiary)] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-[var(--text-tertiary)] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-[var(--text-tertiary)] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {suggestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border border-[var(--accent-purple)]/20 text-[var(--accent-purple)] hover:bg-[var(--accent-purple)]/5 transition-all truncate max-w-[48%]"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-[var(--border-color)] flex-shrink-0">
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                    placeholder={isListening ? "Listening..." : "Ask Echo anything..."}
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-purple)] transition-colors"
                  />
                  <button
                    onClick={toggleListening}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                      isListening ? 'text-[var(--accent-red)] animate-pulse' : 'text-[var(--text-tertiary)] hover:text-[var(--accent-purple)]'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  className="w-10 h-10 rounded-xl flex-shrink-0 gradient-bg-pink text-white flex items-center justify-center shadow-md hover:shadow-lg disabled:opacity-40 transition-all"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
