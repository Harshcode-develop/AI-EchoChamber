import { useState, useCallback } from 'react';
import { Upload, X, FileVideo, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface VideoUploaderProps {
  onFileSelect: (file: File) => void;
  uploadedFile: File | { name: string; size: number } | null;
  onClear: () => void;
  isUploading?: boolean;
  uploadProgress?: number;
}

export default function VideoUploader({
  onFileSelect,
  uploadedFile,
  onClear,
  isUploading = false,
  uploadProgress = 0,
}: VideoUploaderProps) {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  // Vercel serverless functions have a hard 4.5MB limit for incoming request bodies.
  const maxSizeMB = user ? 4.5 : 4.5;

  const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm'];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && allowedTypes.includes(file.type)) {
        if (file.size > maxSizeMB * 1024 * 1024) {
          toast.error(`File too large. Maximum size is ${maxSizeMB >= 1024 ? `${(maxSizeMB/1024).toFixed(0)}GB` : `${maxSizeMB}MB`}`);
          return;
        }
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`File too large. Maximum size is ${maxSizeMB >= 1024 ? `${(maxSizeMB/1024).toFixed(0)}GB` : `${maxSizeMB}MB`}`);
        return;
      }
      onFileSelect(file);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3.5 mb-5">
        <div className="w-9 h-9 rounded-[var(--radius-md)] gradient-bg-pink flex items-center justify-center text-white text-sm font-black shadow-lg">
          1
        </div>
        <h3 className="text-lg font-black text-[var(--text-primary)] tracking-tight">Upload Your Source</h3>
      </div>

      <AnimatePresence mode="wait">
        {uploadedFile ? (
          <motion.div
            key="uploaded"
            initial={{ opacity: 0, scale: 0.98, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.98, filter: 'blur(8px)' }}
            transition={{ type: "spring", damping: 25 }}
            className="relative rounded-[var(--radius-lg)] border-2 border-[var(--accent-green)]/20 bg-[var(--accent-green)]/5 p-6 backdrop-blur-sm shadow-sm"
          >
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-[var(--radius-md)] bg-[var(--accent-green)]/10 flex items-center justify-center shadow-inner">
                <FileVideo className="w-7 h-7 text-[var(--accent-green)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-black text-[var(--text-primary)] truncate tracking-tight">
                  {uploadedFile.name}
                </p>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mt-1">
                  {formatSize(uploadedFile.size)} · Ready for magic
                </p>
              </div>
              {isUploading ? (
                <div className="w-36">
                  <div className="h-1.5 rounded-full bg-[var(--bg-tertiary)]/50 overflow-hidden shadow-inner">
                    <motion.div
                      className="h-full gradient-bg-pink rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, uploadProgress)}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                  <p className="text-[10px] font-black text-[var(--accent-pink)] mt-2 text-right uppercase tracking-widest">
                    {Math.min(100, Math.round(uploadProgress))}% Uploaded
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/20">
                    <CheckCircle className="w-3.5 h-3.5 text-[var(--accent-green)]" />
                    <span className="text-[10px] font-black uppercase text-[var(--accent-green)] tracking-wider">Success</span>
                  </div>
                  <button
                    onClick={onClear}
                    className="w-10 h-10 rounded-full hover:bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--accent-red)] transition-all duration-300 hover:rotate-90"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.label
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            htmlFor="video-upload"
            className={`relative flex flex-col items-center justify-center cursor-pointer rounded-[var(--radius-lg)] border-2 border-dashed p-8 sm:p-12 transition-all duration-500 overflow-hidden group ${
              isDragging
                ? 'border-[var(--accent-purple)] bg-[var(--accent-purple)]/5 scale-[1.01]'
                : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--accent-purple)]/40 hover:bg-[var(--bg-card-hover)]/30 shadow-xs hover:shadow-xl'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--text-primary) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            
            <div
              className={`w-16 h-16 rounded-[var(--radius-lg)] flex items-center justify-center mb-4 transition-all duration-500 shadow-xl relative z-10 ${
                isDragging ? 'bg-[var(--accent-purple)] scale-110 rotate-3' : 'bg-[var(--bg-tertiary)]/80 glass'
              }`}
            >
              <Upload
                className={`w-6 h-6 transition-all duration-500 ${
                  isDragging ? 'text-white' : 'text-[var(--text-tertiary)] group-hover:text-[var(--accent-purple)] group-hover:-translate-y-1'
                }`}
              />
            </div>
            <p className="text-base font-black text-[var(--text-primary)] mb-1 tracking-tight relative z-10">
              {isDragging ? 'Drop to Start the Magic' : 'Drop Your Video Here'}
            </p>
            <p className="text-sm text-[var(--text-tertiary)] mb-6 font-medium relative z-10">
              or <span className="text-[var(--accent-purple)] font-black decoration-purple-500/30 underline decoration-2 underline-offset-4 group-hover:text-[var(--accent-purple)] transition-colors">browse local files</span>
            </p>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.1em] text-[var(--text-tertiary)] relative z-10">
              {['MP4', 'MOV', 'WebM'].map(fmt => (
                <span key={fmt} className="px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--bg-tertiary)] border border-[var(--border-color)]/50 group-hover:border-[var(--accent-purple)]/20 transition-colors">
                  {fmt}
                </span>
              ))}
              <span className="text-[var(--text-tertiary)] opacity-60 ml-2">up to {maxSizeMB >= 1024 ? `${(maxSizeMB/1024).toFixed(0)}GB` : `${maxSizeMB}MB`}</span>
            </div>
            
            {!user && (
              <div 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const signupBtn = document.querySelector('[data-auth-trigger="signup"]') as HTMLButtonElement;
                  if (signupBtn) signupBtn.click();
                }}
                className="mt-6 px-4 py-2 rounded-full bg-[var(--accent-purple)]/5 border border-[var(--accent-purple)]/10 hover:bg-[var(--accent-purple)]/10 transition-all cursor-pointer group/msg"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--accent-purple)]">
                  Sign in to upload videos up to <span className="underline underline-offset-4 decoration-2">{maxSizeMB}MB</span>
                </p>
              </div>
            )}
            <input
              id="video-upload"
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              className="hidden"
              onChange={handleFileInput}
            />
          </motion.label>
        )}
      </AnimatePresence>
    </div>
  );
}
