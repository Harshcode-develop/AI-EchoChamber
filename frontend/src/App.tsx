import { useState, useEffect } from 'react';
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

import HomePage from './pages/HomePage';
import CreatePage from './pages/CreatePage';
import HowItWorksPage from './pages/HowItWorksPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

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
            <div className="flex flex-col min-h-screen">
              {/* Background particles */}
              <div className="bg-particles">
                <FlowingParticles />
              </div>

              {/* Navigation */}
              <Navbar onSignupClick={openSignup} />

              {/* Routes and Main Content */}
              <main className="relative z-10 flex-1 flex flex-col">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/how-it-works" element={<HowItWorksPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/create" element={<CreatePage />} />
                </Routes>
              </main>

              {/* Footer */}
              <Footer />

              {/* Global Modals & Widgets */}
              <AuthModal
                mode={authMode}
                isOpen={authOpen}
                onClose={() => setAuthOpen(false)}
                onSwitch={switchAuth}
              />
              <ContactModal />
              <ChatWidget />
            </div>

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
