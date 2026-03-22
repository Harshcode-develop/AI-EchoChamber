import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Eye, EyeOff, Loader2, MailCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { resetPassword } from '../../services/api';
import toast from 'react-hot-toast';

interface AuthModalProps {
  mode: 'login' | 'signup';
  isOpen: boolean;
  onClose: () => void;
  onSwitch: () => void;
}

export default function AuthModal({ mode, isOpen, onClose, onSwitch }: AuthModalProps) {
  const { login, signup, loginWithGoogle } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'signup' | 'forgot-password'>(mode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      if (authView === 'login') {
        await login(email, password);
        toast.success('Welcome back!');
        onClose();
      } else if (authView === 'signup') {
        await signup(email, password);
        setConfirmationSent(true);
      } else {
        // forgot-password
        await resetPassword(email);
        setResetSent(true);
        toast.success('Reset link sent to your email');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setErrorMsg(err.message || 'Google login failed');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal */}
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
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[var(--radius-lg)] shadow-2xl overflow-hidden glass z-10 hardware-accelerated"
          >
            {/* Header gradient */}
            <div className="h-1.2 gradient-bg-pink" />

            <div className="p-7 sm:p-8">
              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-5 right-5 w-8 h-8 rounded-lg hover:bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-1.5 tracking-tight">
                {authView === 'login' ? 'Welcome Back' : authView === 'signup' ? 'Create Account' : 'Reset Password'}
              </h2>
              <p className="text-[13px] sm:text-sm text-[var(--text-tertiary)] mb-8">
                {authView === 'login'
                  ? 'Sign in to access all your content'
                  : authView === 'signup'
                  ? 'Sign up to unlock one more AI generation'
                  : 'Enter your email to receive a recovery link'}
              </p>

              {/* Email Verification Confirmation Screen */}
              {confirmationSent || resetSent ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                    className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400/20 to-emerald-500/20 flex items-center justify-center"
                  >
                    <MailCheck className="w-8 h-8 text-emerald-400" />
                  </motion.div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">
                    {resetSent ? 'Link Sent!' : 'Check Your Email!'}
                  </h3>
                  <p className="text-[13px] text-[var(--text-secondary)] mb-0.5">
                    {resetSent ? "We've sent a recovery link to:" : "We've sent a verification link to:"}
                  </p>
                  <p className="text-[13px] font-semibold text-[var(--accent-purple)] mb-3">{email}</p>
                  <p className="text-xs text-[var(--text-tertiary)] mb-6 px-4 leading-relaxed">
                    {resetSent 
                      ? "Click the link in the email to set a new password. If you don't see it, check your spam folder."
                      : "Click the link in your email to activate your account. It may take a minute to arrive."}
                  </p>
                  <button
                    onClick={() => {
                      setConfirmationSent(false);
                      setResetSent(false);
                      onClose();
                    }}
                    className="gradient-bg-pink text-white px-8 py-2.5 rounded-[var(--radius-md)] text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                  >
                    Got it!
                  </button>
                </motion.div>
              ) : (
                <>

              {/* Google OAuth */}
              {(authView === 'login' || authView === 'signup') && (
                <>
                <button
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-3 py-2.5 rounded-[var(--radius-md)] border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[13px] font-semibold text-[var(--text-primary)] transition-all mb-6 group"
                >
                  <div className="flex items-center justify-center w-5 h-5 bg-white rounded-full shadow-sm transition-transform group-hover:scale-110">
                    <svg viewBox="0 0 48 48" className="w-3.5 h-3.5">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                      <path fill="none" d="M0 0h48v48H0z" />
                    </svg>
                  </div>
                  Continue with Google
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 h-px bg-[var(--border-color)]" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                    or email
                  </span>
                  <div className="flex-1 h-px bg-[var(--border-color)]" />
                </div>
                </>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="group">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] z-10 pointer-events-none group-focus-within:text-[var(--accent-purple)] transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      required
                      className="w-full pl-11 pr-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--border-color)] bg-[var(--bg-tertiary)]/50 focus:bg-[var(--bg-secondary)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-purple)] transition-all relative z-0"
                    />
                  </div>
                </div>
                {authView !== 'forgot-password' && (
                  <div className="group">
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] z-10 pointer-events-none group-focus-within:text-[var(--accent-purple)] transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                        minLength={8}
                        className="w-full pl-11 pr-11 py-2.5 rounded-[var(--radius-md)] border border-[var(--border-color)] bg-[var(--bg-tertiary)]/50 focus:bg-[var(--bg-secondary)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-purple)] transition-all relative z-0"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
                {authView === 'login' && (
                  <div className="flex justify-end pr-1">
                    <button
                      type="button"
                      onClick={() => setAuthView('forgot-password')}
                      className="text-[11px] font-bold text-[var(--accent-purple)] hover:text-[var(--accent-pink)] transition-colors uppercase tracking-wider"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
                {authView === 'signup' && (
                  <p className="text-[11px] text-[var(--text-tertiary)] pl-1">
                    Password must be at least 8 characters.
                  </p>
                )}
                {errorMsg && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-[12px] text-[var(--accent-red)] font-medium pl-1 bg-red-500/10 py-1.5 px-3 rounded-lg"
                  >
                    {errorMsg}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-4 gradient-bg-pink text-white py-2.5 rounded-[var(--radius-md)] text-[13px] font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed btn-shine-effect"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : authView === 'login' ? (
                    'Sign In'
                  ) : authView === 'signup' ? (
                    'Create Account'
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>

              {/* Switch */}
              <div className="text-center text-[13px] text-[var(--text-tertiary)] mt-6">
                {authView === 'login' ? (
                  <>
                    Don't have an account?{' '}
                    <button
                      onClick={() => { setAuthView('signup'); onSwitch(); }}
                      className="text-[var(--accent-purple)] font-bold hover:text-[var(--accent-pink)] transition-colors"
                    >
                      Sign Up
                    </button>
                  </>
                ) : authView === 'signup' ? (
                  <>
                    Already have an account?{' '}
                    <button
                      onClick={() => { setAuthView('login'); onSwitch(); }}
                      className="text-[var(--accent-purple)] font-bold hover:text-[var(--accent-pink)] transition-colors"
                    >
                      Sign In
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setAuthView('login')}
                    className="text-[var(--text-secondary)] font-bold hover:text-[var(--text-primary)] transition-colors flex items-center gap-2 mx-auto"
                  >
                    Back to Sign In
                  </button>
                )}
              </div>
              </>
              )}
            </div>
          </motion.div>

        </motion.div>
      )}
    </AnimatePresence>

  );
}
