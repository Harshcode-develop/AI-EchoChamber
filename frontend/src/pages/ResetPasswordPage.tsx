import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { updateUserPassword } from '../services/api';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if we have an access token in the URL (Supabase recovery link)
    // Or if there's already a session (Supabase handles setting the session from hash)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session && !location.hash) {
        toast.error('Invalid or expired reset link');
        navigate('/');
      }
    };
    checkSession();
  }, [navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      await updateUserPassword(password);
      setIsSuccess(true);
      toast.success('Password updated successfully!');
      setTimeout(() => navigate('/'), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <main className="min-h-screen pt-32 pb-20 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[var(--radius-lg)] p-8 text-center glass shadow-2xl"
        >
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">Password Updated!</h1>
          <p className="text-[var(--text-secondary)] mb-8">
            Your password has been changed successfully. You will be redirected to the home page shortly.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full gradient-bg-pink text-white py-3 rounded-[var(--radius-md)] font-bold shadow-lg"
          >
            Back to Home
          </button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-32 pb-20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[var(--radius-lg)] overflow-hidden glass shadow-2xl"
      >
        <div className="h-1.5 gradient-bg-pink" />
        <div className="p-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] mb-8 transition-colors text-xs font-bold uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>

          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2 tracking-tight">Set New Password</h1>
          <p className="text-sm text-[var(--text-tertiary)] mb-8 leading-relaxed">
            Create a secure password for your account. Min 8 characters.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="group">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] z-10 pointer-events-none group-focus-within:text-[var(--accent-purple)] transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  required
                  className="w-full pl-11 pr-11 py-3 rounded-[var(--radius-md)] border border-[var(--border-color)] bg-[var(--bg-tertiary)]/50 focus:bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-purple)] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="group">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] z-10 pointer-events-none group-focus-within:text-[var(--accent-purple)] transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-[var(--radius-md)] border border-[var(--border-color)] bg-[var(--bg-tertiary)]/50 focus:bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-purple)] transition-all"
                />
              </div>
            </div>

            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs text-[var(--accent-red)] bg-red-500/10 p-3 rounded-lg border border-red-500/20 font-medium"
              >
                {errorMsg}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full gradient-bg-pink text-white py-3 rounded-[var(--radius-md)] font-bold shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 btn-shine-effect mt-4"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
            </button>
          </form>
        </div>
      </motion.div>
    </main>
  );
}
