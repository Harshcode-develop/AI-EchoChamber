import { motion, AnimatePresence } from 'framer-motion';
import { Check, Linkedin, Instagram, Youtube, FileText } from 'lucide-react';
import type { ContentFormat } from '../../types';
import { FORMAT_OPTIONS } from '../../types';
import { useContact } from '../../context/ContactContext';

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.494h2.039L6.486 3.24H4.298l13.311 17.407z" />
  </svg>
);

const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  linkedin: Linkedin,
  twitter: XIcon,
  instagram: Instagram,
  youtube: Youtube,
  'file-text': FileText,
};

interface FormatSelectorProps {
  selected: ContentFormat[];
  onChange: (formats: ContentFormat[]) => void;
}

export default function FormatSelector({ selected, onChange }: FormatSelectorProps) {
  const { openContactModal } = useContact();

  const toggle = (id: ContentFormat) => {
    if (selected.includes(id)) {
      onChange(selected.filter((f) => f !== id));
    } else {
      // Force single selection only
      onChange([id]);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3.5 mb-5">
        <div className="w-9 h-9 rounded-[var(--radius-md)] gradient-bg-pink flex items-center justify-center text-white text-sm font-black shadow-lg">
          2
        </div>
        <h3 className="text-lg font-black text-[var(--text-primary)] tracking-tight">Choose Your Format</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
        {FORMAT_OPTIONS.map((format) => {
          const isSelected = selected.includes(format.id);
          const Icon = iconMap[format.icon] || FileText;

          return (
            <motion.button
              key={format.id}
              onClick={() => toggle(format.id)}
              whileTap={{ scale: 0.97 }}
              className={`relative p-4 rounded-[var(--radius-lg)] border-2 text-left transition-all duration-300 group overflow-hidden flex flex-col items-start h-full ${
                isSelected
                  ? 'border-[var(--accent-blue)] bg-[var(--accent-blue)]/5 shadow-[0_10px_40px_-10px_rgba(59,130,246,0.3)] ring-4 ring-blue-500/5'
                  : 'border-[var(--border-color)] hover:border-[var(--accent-blue)]/30 bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)]'
              }`}
            >
              {/* Check indicator */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: -45 }}
                    className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[var(--accent-blue)] flex items-center justify-center shadow-lg z-20"
                  >
                    <Check className="w-3.5 h-3.5 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>

              <div
                className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg relative z-10"
                style={{ background: format.color }}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>

              <p className="font-[900] text-[13px] text-[var(--text-primary)] mb-1 leading-tight tracking-tight relative z-10">
                {format.name}
              </p>
              <p className="text-[10px] text-[var(--text-tertiary)] font-medium leading-relaxed relative z-10 line-clamp-2">
                {format.description}
              </p>
            </motion.button>
          );
        })}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 p-5 rounded-[var(--radius-lg)] bg-[var(--bg-tertiary)]/30 border border-[var(--border-color)]/50 flex flex-col lg:flex-row lg:items-center justify-between gap-5 text-sm text-[var(--text-secondary)] glass"
      >
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-[var(--accent-purple)]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Check className="w-3 h-3 text-[var(--accent-purple)]" />
          </div>
          <div className="font-medium leading-relaxed">
            <strong className="text-[var(--accent-purple)] font-black uppercase tracking-wider text-[11px]">System Rules:</strong><br />
            Guest (1 total). Logged In (2 per day). formats are generated <span className="text-[var(--text-primary)] font-black">one at a time</span>.
          </div>
        </div>
        <div className="text-[11px] bg-[var(--bg-card)] px-4 py-3 rounded-[var(--radius-md)] border border-[var(--border-color)] shadow-sm font-medium leading-relaxed">
          Need more generations or batch processing?<br />
          <button 
            type="button"
            onClick={openContactModal}
            className="text-[var(--accent-blue)] hover:underline font-[900] cursor-pointer mt-1"
          >
            Contact the Developer
          </button>
        </div>
      </motion.div>
    </div>
  );
}
