import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, Mail } from 'lucide-react';
import { useContact } from '../../context/ContactContext';
import { useAuth } from '../../context/AuthContext';
import { submitContactForm } from '../../services/api';
import toast from 'react-hot-toast';

export default function ContactModal() {
  const { isContactModalOpen, closeContactModal } = useContact();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  useEffect(() => {
    // Prevent scrolling when modal is open
    if (isContactModalOpen) {
      document.body.style.overflow = 'hidden';
      // Auto-extract email if user is logged in
      if (user) {
        setFormData(prev => ({
          ...prev,
          email: prev.email || user.email || '',
          name: prev.name || user.email?.split('@')[0] || ''
        }));
      }
    } else {
      document.body.style.overflow = '';
      // Reset form when closed
      setFormData({ name: '', email: '', subject: '', message: '' });
    }
  }, [isContactModalOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await submitContactForm({
        name: formData.name,
        email: formData.email || undefined,
        subject: formData.subject,
        message: formData.message,
      });
      toast.success('Message sent! I will reply as soon as possible.');
      closeContactModal();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to send message.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isContactModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-black/40"
          onClick={closeContactModal}
        >
          {/* Modal Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ 
              type: "spring",
              damping: 25,
              stiffness: 300,
              mass: 0.8
            }}
            className="relative w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[var(--radius-lg)] shadow-2xl overflow-hidden glass z-10 hardware-accelerated"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="h-1.2 gradient-bg-pink" />
            <div className="px-6 sm:px-8 py-7">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-1 flex items-center gap-2.5">
                    <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--accent-purple)]" />
                    Contact Developer
                  </h2>
                  <p className="text-[13px] text-[var(--text-tertiary)] max-w-[280px]">
                    Questions, higher limits, or custom formats? Send me a message!
                  </p>
                </div>
                <button
                  onClick={closeContactModal}
                  className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)] transition-all duration-200 self-start"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="group">
                  <label className="block text-[13px] font-bold text-[var(--text-secondary)] mb-1.5 ml-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)]/50 border border-[var(--border-color)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-purple)] focus:bg-[var(--bg-secondary)] transition-all focus:outline-none"
                    placeholder="Your name"
                  />
                </div>

                <div className="group">
                  <label className="block text-[13px] font-bold text-[var(--text-secondary)] mb-1.5 ml-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)]/50 border border-[var(--border-color)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-purple)] focus:bg-[var(--bg-secondary)] transition-all focus:outline-none"
                    placeholder="Enter email to get a reply"
                  />
                </div>

                <div className="group">
                  <label className="block text-[13px] font-bold text-[var(--text-secondary)] mb-1.5 ml-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={150}
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)]/50 border border-[var(--border-color)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-purple)] focus:bg-[var(--bg-secondary)] transition-all focus:outline-none"
                    placeholder="What's this about?"
                  />
                </div>

                <div className="group">
                  <label className="block text-[13px] font-bold text-[var(--text-secondary)] mb-1.5 ml-1 flex justify-between">
                    <span>Message *</span>
                    <span className="text-[var(--text-tertiary)] font-normal text-[11px]">{formData.message.length}/1000</span>
                  </label>
                  <textarea
                    required
                    minLength={10}
                    maxLength={1000}
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)]/50 border border-[var(--border-color)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-purple)] focus:bg-[var(--bg-secondary)] transition-all focus:outline-none resize-none"
                    placeholder="Type your message here..."
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading || formData.message.length < 10}
                    className="w-full gradient-bg-pink text-white py-3 rounded-[var(--radius-md)] text-sm font-bold flex items-center justify-center gap-2 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-shine-effect"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 ml-1" />
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
