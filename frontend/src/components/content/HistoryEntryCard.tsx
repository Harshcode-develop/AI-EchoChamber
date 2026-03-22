import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Trash2, Calendar, FileVideo, Edit2, Check, Copy, FileText, Linkedin, Instagram, Youtube } from 'lucide-react';
import type { GenerationHistoryEntry, ContentFormat } from '../../types';

const XIcon = (props: React.SVGProps<SVGSVGElement> | { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...(props as any)}>
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.494h2.039L6.486 3.24H4.298l13.311 17.407z" />
  </svg>
);

const formatIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  linkedin: Linkedin,
  x_thread: XIcon,
  instagram: Instagram,
  youtube: Youtube,
  blog: FileText,
};

const formatLabels: Record<string, string> = {
  linkedin: 'LinkedIn',
  x_thread: 'X Thread',
  instagram: 'Instagram',
  youtube: 'YouTube',
  blog: 'Blog',
};

const formatColors: Record<string, string> = {
  linkedin: 'rgba(59,130,246,0.12)',
  x_thread: 'rgba(15,23,42,0.10)',
  instagram: 'rgba(236,72,153,0.12)',
  youtube: 'rgba(239,68,68,0.12)',
  blog: 'rgba(249,115,22,0.12)',
};

const formatTextColors: Record<string, string> = {
  linkedin: 'var(--accent-blue)',
  x_thread: 'var(--text-primary)',
  instagram: 'var(--accent-pink)',
  youtube: 'var(--accent-red)',
  blog: 'var(--accent-orange)',
};

interface HistoryEntryCardProps {
  entry: GenerationHistoryEntry;
  onDelete: (id: string) => void;
  onRename?: (id: string, newName: string) => Promise<void>;
}

export default function HistoryEntryCard({ entry, onDelete, onRename }: HistoryEntryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(entry.video_name);
  const [isSaving, setIsSaving] = useState(false);

  const formattedDate = new Date(entry.created_at).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleCopy = async (index: number) => {
    await navigator.clipboard.writeText(entry.content[index]?.content ?? '');
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleRename = async () => {
    if (!onRename || newName.trim() === '' || newName === entry.video_name) {
      setIsRenaming(false);
      return;
    }

    setIsSaving(true);
    try {
      await onRename(entry.id, newName.trim());
      setIsRenaming(false);
    } catch (err) {
      console.error('Failed to rename:', err);
      setNewName(entry.video_name);
    } finally {
      setIsSaving(false);
    }
  };

  const currentItem = entry.content[activeTab];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, filter: 'blur(8px)' }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden glass-hover group/card"
    >
      {/* Card Header */}
      <div 
        className="flex items-center gap-3 px-5 py-4 cursor-pointer"
        onClick={() => !isRenaming && setIsExpanded((v) => !v)}
      >
        {/* File Icon */}
        <div className="w-9 h-9 rounded-[var(--radius-md)] gradient-bg-pink flex items-center justify-center flex-shrink-0 shadow-sm group-hover/card:scale-110 transition-transform duration-300">
          <FileVideo className="w-4 h-4 text-white" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0" onClick={e => isRenaming && e.stopPropagation()}>
          {isRenaming ? (
            <div className="flex items-center gap-2 pr-4">
              <input
                type="text"
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename();
                  if (e.key === 'Escape') {
                    setNewName(entry.video_name);
                    setIsRenaming(false);
                  }
                }}
                className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[12px] font-bold text-[var(--text-primary)] px-2 py-1 rounded-[var(--radius-sm)] focus:outline-none focus:border-[var(--accent-purple)]"
              />
              <button
                disabled={isSaving}
                onClick={handleRename}
                className="p-1 rounded bg-[var(--accent-green)]/10 text-[var(--accent-green)] hover:bg-[var(--accent-green)]/20 transition-all"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group/title">
              <p className="text-[13px] font-bold text-[var(--text-primary)] truncate tracking-tight">{entry.video_name}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRenaming(true);
                }}
                className="opacity-0 group-hover/title:opacity-100 p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--accent-purple)] transition-all"
                title="Rename history entry"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-1.5 mt-0.5">
            <Calendar className="w-3 h-3 text-[var(--text-tertiary)]" />
            <span className="text-[11px] font-medium text-[var(--text-tertiary)]">{formattedDate}</span>
          </div>
        </div>

        {/* Format chips */}
        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
          {entry.formats.map((fmt) => {
            const Icon = formatIcons[fmt] || FileText;
            return (
              <span
                key={fmt}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{
                  background: formatColors[fmt] ?? 'var(--bg-tertiary)',
                  color: formatTextColors[fmt] ?? 'var(--text-secondary)',
                }}
              >
                <Icon className="w-3 h-3" />
                {formatLabels[fmt] ?? fmt}
              </span>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onDelete(entry.id)}
            className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--accent-red)] hover:bg-red-500/10 transition-all duration-200"
            title="Delete entry"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsExpanded((v) => !v)}
            className={`p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--accent-purple)] hover:bg-[var(--bg-tertiary)] transition-all duration-300 ${isExpanded ? 'rotate-180 text-[var(--accent-purple)]' : ''}`}
            title={isExpanded ? 'Collapse' : 'View content'}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {isExpanded && currentItem && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 350, mass: 0.5 }}
            className="overflow-hidden bg-[var(--bg-tertiary)]/10"
          >
            <div className="border-t border-[var(--border-color)] px-5 pt-4 pb-5">
              {/* Format Tabs */}
              {entry.content.length > 1 && (
                <div className="flex gap-1 p-1 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)]/50 mb-4 overflow-x-auto">
                  {entry.content.map((item, index) => {
                    const TabIcon = formatIcons[item.format as ContentFormat] || FileText;
                    return (
                      <button
                        key={`${item.format}-${index}-${Math.random()}`}
                        onClick={() => setActiveTab(index)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all duration-300 ${
                          activeTab === index
                            ? 'bg-[var(--bg-card)] text-[var(--accent-purple)] shadow-sm'
                            : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                        }`}
                      >
                        <TabIcon className="w-3.5 h-3.5" />
                        {formatLabels[item.format] ?? item.format}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Content Display */}
              <div className="rounded-[var(--radius-md)] border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden shadow-sm">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/30">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = formatIcons[currentItem.format] || FileText;
                      return <Icon className="w-3.5 h-3.5 text-[var(--accent-purple)]" />;
                    })()}
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-primary)]">
                      {formatLabels[currentItem.format] ?? currentItem.format}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-tight">
                      {currentItem.word_count} words · {currentItem.character_count} chars
                    </span>
                    <button
                      onClick={() => handleCopy(activeTab)}
                      className={`p-1.5 rounded-lg transition-all duration-200 ${
                        copiedIndex === activeTab
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--accent-purple)]'
                      }`}
                      title="Copy to clipboard"
                    >
                      {copiedIndex === activeTab ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                {/* Text */}
                <div className="p-5 text-[13px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto bg-[var(--bg-card)]">
                  {currentItem.content}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
