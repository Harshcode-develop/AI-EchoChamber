import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Edit3, Save, RotateCcw, FileText, Linkedin, Instagram, Youtube, X } from 'lucide-react';
import type { GeneratedContentItem, ContentFormat } from '../../types';

const XIcon = (props: React.SVGProps<SVGSVGElement> | { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...(props as any)}>
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.494h2.039L6.486 3.24H4.298l13.311 17.407z" />
  </svg>
);

const formatIcons: Record<ContentFormat, React.ComponentType<{ className?: string }>> = {
  linkedin: Linkedin,
  x_thread: XIcon,
  instagram: Instagram,
  youtube: Youtube,
  blog: FileText,
};

const formatLabels: Record<ContentFormat, string> = {
  linkedin: 'LinkedIn Post',
  x_thread: 'X Thread',
  instagram: 'Instagram Caption',
  youtube: 'YouTube Description',
  blog: 'Blog Article',
};

interface GeneratedContentProps {
  items: GeneratedContentItem[];
  remainingGenerations: number;
  onRemoveItem?: (index: number) => void;
}

export default function GeneratedContent({ items, remainingGenerations, onRemoveItem }: GeneratedContentProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedContents, setEditedContents] = useState<Record<number, string>>({});
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (items.length === 0) {
    return (
      <div className="w-full">
      <div className="flex items-center gap-3.5 mb-5">
        <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-tertiary)] text-sm font-black shadow-inner">
          3
        </div>
        <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Your Generated Library</h3>
      </div>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-color)] bg-[var(--bg-card)] p-8 sm:p-12 text-center glass shadow-sm"
      >
        <div className="w-14 h-14 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-4 opacity-30 ring-8 ring-[var(--bg-tertiary)]/20">
          <FileText className="w-7 h-7 text-[var(--text-primary)]" />
        </div>
        <h4 className="text-lg font-bold text-[var(--text-primary)] mb-1 tracking-tight">Nothing yet!</h4>
        <p className="text-[13px] text-[var(--text-tertiary)] font-medium max-w-[280px] mx-auto leading-relaxed">
          Ready to create? Upload a video and click <span className="text-[var(--accent-purple)] font-bold decoration-wavy underline underline-offset-4">Generate</span> to start the magic.
        </p>
      </motion.div>
      </div>
    );
  }

  // Adjust active tab if it's out of bounds after removal
  const safeActiveTab = activeTab >= items.length ? Math.max(0, items.length - 1) : activeTab;
  
  const currentItem = items[safeActiveTab];
  const currentContent = editedContents[safeActiveTab] ?? currentItem.content;
  const isEditing = editingIndex === safeActiveTab;

  const handleCopy = async (index: number) => {
    const text = editedContents[index] ?? items[index].content;
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleEdit = () => setEditingIndex(safeActiveTab);

  const handleSave = () => {
    setEditingIndex(null);
  };

  const handleReset = () => {
    const updated = { ...editedContents };
    delete updated[safeActiveTab];
    setEditedContents(updated);
    setEditingIndex(null);
  };

  const Icon = formatIcons[currentItem.format as ContentFormat] || FileText;

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-[var(--radius-md)] gradient-bg-pink flex items-center justify-center text-white text-sm font-black shadow-lg">
            3
          </div>
          <h3 className="text-lg font-black text-[var(--text-primary)] tracking-tight">Your Generated Library</h3>
        </div>
        <span className="self-start sm:self-auto text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] bg-[var(--bg-tertiary)]/80 px-4 py-1.5 rounded-full border border-[var(--border-color)] transition-all">
          {remainingGenerations} {remainingGenerations === 1 ? 'generation' : 'generations'} left
        </span>
      </div>

      {/* Format Tabs */}
      <div className="flex gap-1.5 p-1.5 rounded-[var(--radius-lg)] bg-[var(--bg-tertiary)]/50 mb-6 overflow-x-auto glass">
        {items.map((item, index) => {
          const TabIcon = formatIcons[item.format as ContentFormat] || FileText;
          return (
            <button
              key={`${item.format}-${index}`}
              onClick={() => setActiveTab(index)}
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-[var(--radius-md)] text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300 ${
                safeActiveTab === index
                  ? 'bg-[var(--bg-card)] text-[var(--accent-purple)] shadow-md translate-y-[-1px]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              {formatLabels[item.format as ContentFormat]}
              {onRemoveItem && (
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveItem(index);
                  }}
                  className="p-1 -mr-2 rounded-md hover:bg-black/10 text-[var(--text-tertiary)] hover:text-[var(--accent-red)] transition-all"
                  title="Remove from view"
                >
                  <X className="w-3 h-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={safeActiveTab + currentItem.format}
          initial={{ opacity: 0, scale: 0.98, y: 10, filter: 'blur(8px)' }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.98, y: -10, filter: 'blur(8px)' }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden shadow-xl glass transition-all duration-300"
        >
          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/30">
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5 text-[var(--accent-purple)] transition-transform group-hover:scale-110" />
              <span className="text-[13px] font-bold uppercase tracking-wider text-[var(--text-primary)]">
                {formatLabels[currentItem.format as ContentFormat]}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-tight text-[var(--text-tertiary)] mr-3">
                {currentContent.split(/\s+/).length} words · {currentContent.length} chars
              </span>
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-tertiary)]/50">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleReset}
                      className="p-2 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-tertiary)] hover:text-[var(--accent-orange)] transition-all"
                      title="Reset to original"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleSave}
                      className="p-2 rounded-lg bg-[var(--accent-green)]/20 text-[var(--accent-green)] hover:scale-105 transition-all"
                      title="Save changes"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEdit}
                    className="p-2 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-tertiary)] hover:text-[var(--accent-purple)] transition-all"
                    title="Edit content"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => handleCopy(safeActiveTab)}
                  className={`p-2 rounded-lg transition-all ${
                    copiedIndex === safeActiveTab
                      ? 'bg-emerald-500/20 text-emerald-500'
                      : 'hover:bg-[var(--bg-card)] text-[var(--text-tertiary)] hover:text-[var(--accent-purple)]'
                  }`}
                  title="Copy to clipboard"
                >
                  {copiedIndex === safeActiveTab ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            {isEditing ? (
              <textarea
                value={currentContent}
                onChange={(e) =>
                  setEditedContents({ ...editedContents, [safeActiveTab]: e.target.value })
                }
                className="w-full min-h-[300px] bg-transparent text-[var(--text-primary)] text-sm leading-relaxed resize-y focus:outline-none font-mono"
              />
            ) : (
              <div className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                {currentContent}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
