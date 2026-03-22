import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ChatWidget from './components/chatbot/ChatWidget';
import AuthModal from './components/auth/AuthModal';
import FlowingParticles from './components/layout/FlowingParticles';
import { ContactProvider } from './context/ContactContext';
import ContactModal from './components/contact/ContactModal';
import { Zap } from 'lucide-react';

// Lazy load pages for performance
const HomePage = lazy(() => import('./pages/HomePage'));
const CreatePage = lazy(() => import('./pages/CreatePage'));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));

// Premium branded loading fallback
function PageLoader() {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[var(--bg-primary)]/80 backdrop-blur-md">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl gradient-bg-pink flex items-center justify-center shadow-2xl animate-bounce">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <div className="absolute -inset-4 bg-[var(--accent-pink)]/20 rounded-full blur-2xl animate-pulse -z-10" />
      </div>
      <p className="mt-8 text-[12px] font-black uppercase tracking-[0.3em] text-[var(--accent-pink)] animate-pulse">
        Echoing Magic...
      </p>
    </div>
  );
}

export default function App() {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authOpen, setAuthOpen] = useState(false);

  const openSignup = () => { setAuthMode('signup'); setAuthOpen(true); };
  const switchAuth = () => setAuthMode((m) => (m === 'login' ? 'signup' : 'login'));

  // Global scroll listener for overlay auto-hide scrollbars
  useEffect(() => {
    let scrollTimeout: ReturnType<typeof setTimeout>;
    
    const handleScroll = () => {
      document.body.classList.add('is-scrolling');
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        document.body.classList.remove('is-scrolling');
      }, 500); // 500ms after scroll stops
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <ContactProvider>
          <BrowserRouter>
            {/* Background particles */}
            <div className="bg-particles">
              <FlowingParticles />
            </div>

            {/* Navigation */}
            <Navbar onSignupClick={openSignup} />

            {/* Routes and Main Content */}
            <main className="relative z-10">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/how-it-works" element={<HowItWorksPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/create" element={<CreatePage />} />
                </Routes>
              </Suspense>
            </main>

            {/* Footer */}
            <Suspense fallback={null}>
              <Footer />
            </Suspense>

            {/* Global Modals & Widgets */}
            <AuthModal
              mode={authMode}
              isOpen={authOpen}
              onClose={() => setAuthOpen(false)}
              onSwitch={switchAuth}
            />
            <ContactModal />
            <ChatWidget />

            {/* Toast Notifications */}
            <Toaster
              position="top-right"
              containerStyle={{ top: 80 }}
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '14px',
                },
              }}
            />
          </BrowserRouter>
        </ContactProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
