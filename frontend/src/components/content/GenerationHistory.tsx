import { AnimatePresence, motion } from 'framer-motion';
import { History, Trash2, LogIn, Loader2 } from 'lucide-react';
import type { GenerationHistoryEntry } from '../../types';
import HistoryEntryCard from './HistoryEntryCard';

interface GenerationHistoryProps {
  history: GenerationHistoryEntry[];
  isLoading: boolean;
  isAuthenticated: boolean;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onSignInClick: () => void;
  onRename?: (id: string, newName: string) => Promise<void>;
}

export default function GenerationHistory({
  history,
  isLoading,
  isAuthenticated,
  onDelete,
  onClearAll,
  onSignInClick,
  onRename,
}: GenerationHistoryProps) {
  return (
    <section className="mt-12">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-[var(--radius-md)] gradient-bg-blue flex items-center justify-center shadow-lg">
            <History className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[var(--text-primary)] tracking-tight">Generation History</h2>
            {isAuthenticated && !isLoading && history.length > 0 && (
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mt-0.5">
                {history.length} Saved {history.length !== 1 ? 'Generations' : 'Generation'}
              </p>
            )}
          </div>
        </div>

        {isAuthenticated && history.length > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)] text-[13px] font-bold text-[var(--accent-red)] border border-[var(--accent-red)]/20 hover:bg-[var(--accent-red)]/5 hover:border-[var(--accent-red)]/40 transition-all duration-300"
          >
            <Trash2 className="w-4 h-4" />
            Clear Library
          </button>
        )}
      </div>

      {/* Body */}
      {!isAuthenticated ? (
        /* Guest state */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-color)] bg-[var(--bg-card)] p-8 sm:p-12 text-center glass shadow-sm"
        >
          <div className="w-14 h-14 rounded-[var(--radius-lg)] gradient-bg-pink flex items-center justify-center mx-auto mb-4 shadow-xl relative">
            <div className="absolute inset-0 rounded-[var(--radius-lg)] animate-pulse-glow opacity-50" />
            <History className="w-7 h-7 text-white relative z-10" />
          </div>
          <h3 className="text-lg font-extrabold text-[var(--text-primary)] mb-1 tracking-tight">Your History Lives Here</h3>
          <p className="text-[13px] text-[var(--text-secondary)] max-w-sm mx-auto mb-6 font-medium">
            Sign in to securely save every generation and access your viral content from anywhere.
          </p>
          <button
            onClick={onSignInClick}
            className="inline-flex items-center gap-2.5 gradient-bg-pink text-white px-8 py-3.5 rounded-full text-sm font-black shadow-lg hover:shadow-pink-500/20 hover:scale-[1.05] active:scale-[0.95] transition-all btn-shine-effect"
          >
            <LogIn className="w-4 h-4" />
            Claim Your Library
          </button>
        </motion.div>
      ) : isLoading ? (
        /* Loading state */
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-[var(--accent-purple)] animate-spin" />
        </div>
      ) : history.length === 0 ? (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-color)] bg-[var(--bg-card)] p-8 sm:p-12 text-center glass shadow-xs"
        >
          <div className="w-14 h-14 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-4 opacity-40">
            <History className="w-7 h-7 text-[var(--text-tertiary)]" />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1 tracking-tight">No History Yet</h3>
          <p className="text-[13px] text-[var(--text-tertiary)] font-medium max-w-[280px] mx-auto">
            Ready to blow up? Generate your first piece of content to start your library.
          </p>
        </motion.div>
      ) : (
        /* History list */
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {history.map((entry) => (
              <HistoryEntryCard key={entry.id} entry={entry} onDelete={onDelete} onRename={onRename} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
