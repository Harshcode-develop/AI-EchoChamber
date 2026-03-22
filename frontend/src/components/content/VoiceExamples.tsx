import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Lightbulb, Mic, Square } from 'lucide-react';
import toast from 'react-hot-toast';

interface VoiceExamplesProps {
  examples: string[];
  onChange: (examples: string[]) => void;
  customInstructions: string;
  onInstructionsChange: (instructions: string) => void;
}

export default function VoiceExamples({
  examples,
  onChange,
  customInstructions,
  onInstructionsChange,
}: VoiceExamplesProps) {
  const [currentText, setCurrentText] = useState('');
  const [activeField, setActiveField] = useState<'examples' | 'instructions' | null>(null);
  const recognitionRef = useRef<any>(null);
  
  // Keep refs of latest values for the continuous recognition handle
  const instructionsRef = useRef(customInstructions);
  const examplesTextRef = useRef(currentText);

  useEffect(() => {
    instructionsRef.current = customInstructions;
  }, [customInstructions]);

  useEffect(() => {
    examplesTextRef.current = currentText;
  }, [currentText]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const normalizeTranscript = (text: string) => {
    if (!text) return '';
    let normalized = text.trim();
    // Capitalize first letter
    normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
    // Add period if it's reasonably long and doesn't have punctuation
    if (normalized.length > 5 && !/[.!?]$/.test(normalized)) {
      normalized += '.';
    }
    return normalized;
  };

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setActiveField(null);
    toast.success('Microphone turned off', { id: 'voice-toast' });
  }, []);

  const startListening = useCallback((field: 'examples' | 'instructions') => {
    // If clicking the same mic, stop it
    if (activeField === field) {
      stopListening();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error('Voice recognition is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    // Stop existing recognition if switching fields
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setActiveField(field);
      toast.success('Continuous Listening...', { id: 'voice-toast', duration: 3000 });
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        const normalized = normalizeTranscript(finalTranscript);
        if (field === 'examples') {
          setCurrentText(prev => prev ? `${prev} ${normalized}` : normalized);
        } else {
          // Use instructionsRef.current to avoid stale closure issues
          const currentVal = instructionsRef.current;
          onInstructionsChange(currentVal ? `${currentVal} ${normalized}` : normalized);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        setActiveField(null);
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied', { id: 'voice-toast' });
        } else {
          toast.error(`Voice error: ${event.error}`, { id: 'voice-toast' });
        }
      }
    };

    recognition.onend = () => {
      // Don't auto-reset activeField if we expect it to stay on, 
      // but browser might stop it on its own.
      // We only reset if recognitionRef.current was nulled by stopListening
      if (!recognitionRef.current) {
        setActiveField(null);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [activeField, onInstructionsChange, stopListening]);

  const addExample = () => {
    if (currentText.trim() && examples.length < 3) {
      onChange([...examples, currentText.trim()]);
      setCurrentText('');
    }
  };

  const removeExample = (index: number) => {
    onChange(examples.filter((_, i) => i !== index));
  };

  const isListeningExamples = activeField === 'examples';
  const isListeningInstructions = activeField === 'instructions';

  return (
    <div className="w-full space-y-6">
      {/* Voice Examples */}
      <div>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--accent-orange)]/10 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-[var(--accent-orange)]" />
          </div>
          <h4 className="font-black text-[14px] text-[var(--text-primary)] tracking-tight uppercase">
            Teach It Your Voice <span className="text-[var(--text-tertiary)] font-bold lowercase opacity-60">(Optional)</span>
          </h4>
        </div>
        <p className="text-[11px] text-[var(--text-tertiary)] mb-4 font-medium leading-relaxed">
          Paste 2-3 examples of content you've written so the AI matches your elite style and unique brand voice perfectly.
        </p>

        {/* Existing examples */}
        <div className="space-y-2 mb-4">
          {examples.map((example, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)]/50 border border-[var(--border-color)]/50 glass relative group"
            >
              <p className="flex-1 text-[12px] text-[var(--text-secondary)] line-clamp-2 font-medium leading-relaxed">
                {example}
              </p>
              <button
                onClick={() => removeExample(i)}
                className="w-7 h-7 rounded-full hover:bg-[var(--bg-card)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--accent-red)] transition-all duration-300 hover:rotate-90"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </div>

        {/* Add example */}
        {examples.length < 3 && (
          <div className="flex gap-3 items-start">
            <div className="flex-1 relative">
              <textarea
                value={currentText}
                onChange={(e) => setCurrentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    addExample();
                  }
                }}
                placeholder={isListeningExamples ? "Listening... Speak clearly" : "Paste an example of your writing style... (Ctrl+Enter to add)"}
                className={`w-full px-4 py-3 rounded-[var(--radius-md)] border border-[var(--border-color)] bg-[var(--bg-card)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] resize-none focus:outline-none focus:border-[var(--accent-purple)]/50 transition-all duration-300 focus:shadow-[0_0_20px_rgba(147,51,234,0.1)] outline-none min-h-[44px] ${isListeningExamples ? 'ring-2 ring-[var(--accent-orange)]/30' : ''}`}
                rows={2}
              />
              <button
                type="button"
                onClick={() => startListening('examples')}
                className={`absolute bottom-3 right-3 p-1.5 rounded-full transition-all duration-300 ${isListeningExamples ? 'bg-[var(--accent-red)] text-white animate-pulse' : 'text-[var(--text-tertiary)] hover:text-[var(--accent-orange)] hover:bg-[var(--bg-tertiary)]'}`}
                title={isListeningExamples ? "Stop Listening" : "Continuous Voice Dictation"}
              >
                {isListeningExamples ? <Square className="w-3 h-3" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
            </div>
            <button
              type="button"
              onClick={addExample}
              disabled={!currentText.trim() || !!activeField}
              title="Add example"
              className="w-12 h-[44px] rounded-[var(--radius-md)] border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-tertiary)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--text-secondary)] hover:text-[var(--accent-purple)] transition-all duration-300 flex items-center justify-center hover:shadow-lg disabled:hover:shadow-none shadow-sm flex-shrink-0 btn-shine-effect"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Custom Instructions */}
      <div className="pt-3 border-t border-[var(--border-color)]/30">
        <h4 className="font-black text-[14px] text-[var(--text-primary)] mb-2 tracking-tight uppercase">
          Additional Instructions <span className="text-[var(--text-tertiary)] font-bold lowercase opacity-60">(Optional)</span>
        </h4>
        <div className="relative">
          <textarea
            value={customInstructions}
            onChange={(e) => onInstructionsChange(e.target.value)}
            placeholder={isListeningInstructions ? "Listening..." : "E.g., 'Keep the tone casual and fun' or 'Focus on the technical aspects'..."}
            className={`w-full px-4 py-3 rounded-[var(--radius-md)] border border-[var(--border-color)] bg-[var(--bg-card)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] resize-none focus:outline-none focus:border-[var(--accent-blue)]/50 transition-all duration-300 focus:shadow-[0_0_20px_rgba(59,130,246,0.1)] outline-none min-h-[80px] ${isListeningInstructions ? 'ring-2 ring-[var(--accent-blue)]/30' : ''}`}
            maxLength={500}
          />
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
             <button
                type="button"
                onClick={() => startListening('instructions')}
                className={`p-1.5 rounded-full transition-all duration-300 ${isListeningInstructions ? 'bg-[var(--accent-red)] text-white animate-pulse' : 'text-[var(--text-tertiary)] hover:text-[var(--accent-blue)] hover:bg-[var(--bg-tertiary)]'}`}
                title={isListeningInstructions ? "Stop Listening" : "Continuous Voice Dictation"}
              >
                {isListeningInstructions ? <Square className="w-3 h-3" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
             <div className="h-1 w-12 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--accent-blue)] transition-all duration-300" 
                  style={{ width: `${(customInstructions.length / 500) * 100}%` }}
                />
             </div>
             <p className="text-[10px] font-black uppercase text-[var(--text-tertiary)] tracking-widest tabular-nums">
               {customInstructions.length}/500
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
