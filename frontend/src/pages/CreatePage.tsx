import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import VideoUploader from '../components/content/VideoUploader';
import FormatSelector from '../components/content/FormatSelector';
import VoiceExamples from '../components/content/VoiceExamples';
import GeneratedContent from '../components/content/GeneratedContent';
import GenerationHistory from '../components/content/GenerationHistory';
import { 
  uploadVideo, 
  generateContent, 
  deleteVideo, 
  getHistory, 
  deleteHistoryEntry, 
  clearHistory,
  getGenerationStatus,
  renameHistoryEntry
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { ContentFormat, GeneratedContentItem, GenerationHistoryEntry } from '../types';
import toast from 'react-hot-toast';

export default function CreatePage() {
  const { user } = useAuth();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [fileId, setFileId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFormats, setSelectedFormats] = useState<ContentFormat[]>([]);
  const [voiceExamples, setVoiceExamples] = useState<string[]>([]);
  const [customInstructions, setCustomInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<GeneratedContentItem[]>([]);
  const [remainingGenerations, setRemainingGenerations] = useState(0);

  // History state
  const [history, setHistory] = useState<GenerationHistoryEntry[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Persistence Key
  const STORAGE_KEY = user ? `echo_chamber_create_state_${user.id}` : null;

  // Hydration effect
  useEffect(() => {
    if (!STORAGE_KEY) return;
    
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.selectedFormats) setSelectedFormats(parsed.selectedFormats);
        if (parsed.voiceExamples) setVoiceExamples(parsed.voiceExamples);
        if (parsed.customInstructions) setCustomInstructions(parsed.customInstructions);
        if (parsed.generatedItems) setGeneratedItems(parsed.generatedItems);
        if (parsed.remainingGenerations) setRemainingGenerations(parsed.remainingGenerations);
        
        // Restore video metadata
        if (parsed.videoMetadata) {
          setVideoUrl(parsed.videoMetadata.url);
          setFileId(parsed.videoMetadata.id);
          // Set a mock File object for the UI
          setVideoFile({
            name: parsed.videoMetadata.name,
            size: parsed.videoMetadata.size
          } as any);
        }
      } catch (err) {
        console.error('Failed to parse saved state:', err);
      }
    }
  }, [STORAGE_KEY]);

  // Sync effect (debounced)
  useEffect(() => {
    if (!STORAGE_KEY) return;

    const timeoutId = setTimeout(() => {
      const stateToSave = {
        selectedFormats,
        voiceExamples,
        customInstructions,
        generatedItems,
        remainingGenerations,
        videoMetadata: videoUrl ? {
          url: videoUrl,
          id: fileId,
          name: videoFile?.name || 'Uploaded Video',
          size: videoFile?.size || 0
        } : null
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [STORAGE_KEY, selectedFormats, voiceExamples, customInstructions, generatedItems, remainingGenerations, videoUrl, fileId, videoFile]);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
    fetchStatus();
  }, [user]);

  const fetchStatus = async () => {
    try {
      const data = await getGenerationStatus();
      setRemainingGenerations(data.remaining);
    } catch (err) {
      console.error('Failed to fetch generation status:', err);
    }
  };

  const fetchHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const data = await getHistory();
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    setVideoFile(file);
    setIsUploading(true);

    // Simulate progress during upload
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return Math.min(90, prev + Math.random() * 15);
      });
    }, 300);

    try {
      const result = await uploadVideo(file);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setVideoUrl(result.file_url);
      setFileId(result.file_id);
      toast.success('Video uploaded successfully!');
    } catch (err: any) {
      clearInterval(progressInterval);
      toast.error(err.response?.data?.detail || 'Upload failed');
      setVideoFile(null);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleClearFile = async () => {
    if (fileId) {
      try {
        await deleteVideo(fileId);
      } catch (err) {
        console.error('Cleanup failed:', err);
      }
    }
    if (STORAGE_KEY) {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        parsed.videoMetadata = null;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    }
    setVideoFile(null);
    setVideoUrl('');
    setFileId('');
    setUploadProgress(0);
  };

  const handleGenerate = async () => {
    if (!videoUrl || selectedFormats.length === 0) {
      toast.error('Please upload a video and select at least one format');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateContent(
        videoUrl,
        selectedFormats,
        voiceExamples,
        customInstructions
      );
      setGeneratedItems((prev) => [...result.generated_content, ...prev]);
      setRemainingGenerations(result.remaining_generations);
      toast.success('Content generated successfully! 🎉');
      
      // Refresh history if logged in
      if (user) {
        fetchHistory();
      }
    } catch (err: any) {
      console.error('Generation Error details:', err);
      let detail = 'Generation failed. Please try again.';
      
      if (err.response?.data?.detail) {
        detail = typeof err.response.data.detail === 'string'
          ? err.response.data.detail
          : JSON.stringify(err.response.data.detail);
      } else if (err.message) {
        detail = err.message;
      }
      
      // If it mentions 429 or quota natively
      if (detail.includes('429') || detail.includes('Too Many Requests') || detail.toLowerCase().includes('quota')) {
        detail = 'Google AI limits reached (15 requests per minute). Please wait 60 seconds and try again.';
      }
      
      toast.error(detail, { duration: 6000, position: 'top-center' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      await deleteHistoryEntry(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      toast.success('Entry removed');
    } catch (err) {
      toast.error('Failed to delete entry');
    }
  };

  const handleClearAllHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your entire history?')) return;
    try {
      await clearHistory();
      setHistory([]);
      toast.success('History cleared');
    } catch (err) {
      toast.error('Failed to clear history');
    }
  };
 
  const handleRenameHistory = async (id: string, newName: string) => {
    try {
      const updatedEntry = await renameHistoryEntry(id, newName);
      setHistory((prev) => prev.map((entry) => (entry.id === id ? updatedEntry : entry)));
      toast.success('History updated');
    } catch (err) {
      toast.error('Failed to rename history');
    }
  };
 
  const handleRemoveGeneratedItem = (index: number) => {
    setGeneratedItems((prev) => prev.filter((_, i) => i !== index));
    toast.success('Removed from view');
  };
 
  const canGenerate = videoUrl && selectedFormats.length > 0 && !isGenerating;

  return (
    <main className="min-h-screen pt-[calc(var(--navbar-height)+2rem)] pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.6, type: "spring" }}
          className="text-center mb-16"
        >
          <h1 className="text-[1.8rem] font-[900] mb-4 tracking-[-0.03em] leading-[1.1]">
            Create <span className="gradient-text-pink animate-text-gradient">Viral Magic.</span>
          </h1>
          <p className="text-[var(--text-base)] sm:text-[var(--text-lg)] text-[var(--text-secondary)] max-w-lg mx-auto font-medium leading-relaxed">
            Upload your footage and let our high-end AI ecosystem craft your platform-perfect presence.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-8">
          {/* Step 1: Upload */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <VideoUploader
              onFileSelect={handleFileSelect}
              uploadedFile={videoFile}
              onClear={handleClearFile}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
            />
          </motion.div>

          {/* Step 2: Format Selection */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <FormatSelector
              selected={selectedFormats}
              onChange={setSelectedFormats}
            />
          </motion.div>

          {/* Voice & Instructions (collapsible section) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-card)] p-6 sm:p-8 shadow-sm glass overflow-hidden"
          >
            <VoiceExamples
              examples={voiceExamples}
              onChange={setVoiceExamples}
              customInstructions={customInstructions}
              onInstructionsChange={setCustomInstructions}
            />
          </motion.div>

          {/* Generate Button */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center"
          >
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={`gradient-bg-pink text-white px-10 py-4 rounded-full text-[15px] font-black flex items-center justify-center gap-3 shadow-2xl transition-all duration-300 relative overflow-hidden group ${
                canGenerate
                  ? 'hover:shadow-pink-500/30 hover:scale-[1.05] active:scale-[0.95] btn-shine-effect'
                  : 'opacity-50 grayscale cursor-not-allowed'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Magic...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Generate Content
                  <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.div>

          {/* Step 3: Generated Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <GeneratedContent
              items={generatedItems}
              remainingGenerations={remainingGenerations}
              onRemoveItem={handleRemoveGeneratedItem}
            />
          </motion.div>

          {/* Generation History */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <GenerationHistory
              history={history}
              isLoading={isHistoryLoading}
              isAuthenticated={!!user}
              onDelete={handleDeleteHistory}
              onClearAll={handleClearAllHistory}
              onRename={handleRenameHistory}
              onSignInClick={() => {
                // Focus Navbar or Trigger event to open signup (App handles auth Open)
                const signupBtn = document.querySelector('[data-auth-trigger="signup"]') as HTMLButtonElement;
                if (signupBtn) signupBtn.click();
              }}
            />
          </motion.div>
        </div>
      </div>
    </main>
  );
}

