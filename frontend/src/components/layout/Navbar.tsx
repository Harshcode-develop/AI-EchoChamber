import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, Sun, Moon, Zap, LogOut, User, ChevronDown, Bell, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getNotifications, markNotificationRead, clearAllNotifications } from '../../services/api';
import toast from 'react-hot-toast';

export default function Navbar({ onSignupClick }: {
  onSignupClick: () => void;
}) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (user) {
      getNotifications().then(setNotifications).catch(() => {});
    } else {
      setNotifications([]);
    }
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setIsProfileOpen(false);
      setIsNotifOpen(false);
      setIsMobileOpen(false);
      toast.success('Logged out successfully');
      navigate('/');
    } catch {
      toast.error('Failed to log out');
    }
  };

  const handleRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const handleClearAll = async () => {
    try {
      await clearAllNotifications();
      setNotifications([]);
    } catch {
      toast.error('Failed to clear notifications');
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const navLinks = [
    { label: 'How it works', href: '/how-it-works' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ease-in-out ${
        isScrolled 
          ? 'bg-[var(--glass-bg)] backdrop-blur-xl border-b border-[var(--border-color)] shadow-sm' 
          : 'bg-transparent border-b border-transparent'
      }`}
      style={{ height: 'var(--navbar-height)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Universal Back Button */}
          {location.pathname !== '/' && (
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 -ml-1.5 md:p-2 md:-ml-2 rounded-full hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 group transition-transform duration-300 hover:scale-[1.02] active:scale-95">
            <div className="w-8 h-8 rounded-lg gradient-bg-pink flex items-center justify-center shadow-lg group-hover:scale-110 group-active:scale-95 transition-all duration-300">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight gradient-text-pink animate-text-gradient">
              EchoChamber
            </span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6 ml-auto mr-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`text-sm font-medium transition-all duration-200 ${
                location.pathname === link.href
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--accent-purple)]'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Side Controls */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 text-[var(--text-secondary)] hover:text-[var(--accent-orange)] hover:bg-[var(--bg-tertiary)]"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/create"
                className="gradient-bg-orange text-white px-5 py-2 rounded-full text-[13px] font-bold shadow-lg hover:shadow-orange-500/20 hover:scale-[1.05] active:scale-[0.95] transition-all duration-300 text-center leading-none"
              >
                Create Now
              </Link>

              {/* Notifications Dropdown */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => {
                    setIsNotifOpen(!isNotifOpen);
                    setIsProfileOpen(false);
                  }}
                  className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[var(--bg-primary)] animate-pulse" />
                  )}
                </button>

                <AnimatePresence>
                  {isNotifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.9, filter: 'blur(10px)' }}
                      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: 15, scale: 0.9, filter: 'blur(10px)' }}
                      transition={{ type: "spring", damping: 25, stiffness: 300 }}
                      className="absolute right-0 top-full mt-2 w-80 rounded-[var(--radius-lg)] bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl overflow-hidden z-[110] glass"
                    >
                      <div className="px-4 py-3 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-tertiary)]/50">
                        <span className="font-bold text-sm text-[var(--text-primary)]">Notifications</span>
                        <div className="flex items-center gap-2">
                          {unreadCount > 0 && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--accent-purple)]/10 text-[var(--accent-purple)]">
                              {unreadCount} new
                            </span>
                          )}
                          {notifications.length > 0 && (
                            <button
                              onClick={handleClearAll}
                              className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent-red)] transition-colors ml-1"
                              title="Delete all notifications"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="max-h-[300px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-[var(--text-tertiary)] text-sm">
                            You're all caught up!
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            {notifications.map((n) => (
                              <button
                                key={n.id}
                                onClick={() => handleRead(n.id, n.is_read)}
                                className={`w-full text-left p-4 border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-tertiary)] transition-colors ${!n.is_read ? 'bg-[var(--accent-purple)]/5' : ''}`}
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <span className={`text-sm font-semibold ${!n.is_read ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                                    {n.title}
                                  </span>
                                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-[var(--accent-purple)] mt-1.5 flex-shrink-0" />}
                                </div>
                                <p className="text-xs text-[var(--text-tertiary)] leading-snug line-clamp-3">
                                  {n.message}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => {
                    setIsProfileOpen(!isProfileOpen);
                    setIsNotifOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all duration-200"
                  aria-label="User menu"
                  id="user-menu-button"
                >
                  <div className="w-7 h-7 rounded-sm gradient-bg-pink flex items-center justify-center group-hover:scale-110 transition-transform">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.9, filter: 'blur(10px)' }}
                      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: 15, scale: 0.9, filter: 'blur(10px)' }}
                      transition={{ type: "spring", damping: 25, stiffness: 300 }}
                      className="absolute right-0 top-full mt-2 w-64 rounded-[var(--radius-lg)] bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xl overflow-hidden z-[110] glass"
                    >
                      {/* User info */}
                      <div className="px-4 py-4 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/30">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Account</p>
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                          {user.email}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="p-1.5">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-semibold text-[var(--accent-red)] hover:bg-[var(--accent-red)]/5 transition-all duration-200"
                          id="logout-button"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <button
              onClick={onSignupClick}
              data-auth-trigger="signup"
              className="gradient-bg-pink text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg hover:shadow-pink-500/20 hover:scale-[1.05] active:scale-[0.95] transition-all duration-300 text-center leading-none btn-shine-effect"
            >
              Get Started
            </button>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-secondary)]"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] md:hidden"
          >
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="absolute inset-0 bg-[var(--bg-primary)]/40 backdrop-blur-md"
            />
            
            {/* Menu Content */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-[var(--bg-secondary)] shadow-2xl border-l border-[var(--border-color)] flex flex-col glass"
            >
              <div className="p-6 flex items-center justify-between border-b border-[var(--border-color)]">
                <Link to="/" onClick={() => setIsMobileOpen(false)} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg gradient-bg-pink flex items-center justify-center shadow-lg">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg font-extrabold tracking-tight gradient-text-pink">
                    EchoChamber
                  </span>
                </Link>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--bg-tertiary)] text-[var(--text-primary)] transition-transform active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)] ml-4">Navigation</p>
                  <nav className="space-y-1">
                    {navLinks.map((link, i) => (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                      >
                        <Link
                          to={link.href}
                          onClick={() => setIsMobileOpen(false)}
                          className="flex items-center px-4 py-4 rounded-2xl text-lg font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all group"
                        >
                          <span className="flex-1">{link.label}</span>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--accent-purple)]">→</span>
                        </Link>
                      </motion.div>
                    ))}
                  </nav>
                </div>

                {user && (
                  <div className="space-y-4 pt-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)] ml-4">Account</p>
                    <div className="px-4 py-4 rounded-2xl bg-[var(--bg-tertiary)]/50 border border-[var(--border-color)]">
                      <p className="text-xs text-[var(--text-tertiary)] mb-1">Signed in as</p>
                      <p className="font-bold text-[var(--text-primary)] truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-lg font-bold text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10 transition-all"
                    >
                      <LogOut className="w-5 h-5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-[var(--border-color)] space-y-4">
                <div className="flex gap-4">
                  <button
                    onClick={toggleTheme}
                    className="flex-1 h-14 rounded-2xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] flex items-center justify-center gap-3 font-bold transition-all active:scale-95"
                  >
                    {theme === 'dark' ? <Sun className="w-5 h-5 text-orange-400" /> : <Moon className="w-5 h-5 text-blue-500" />}
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </button>
                  
                  {!user && (
                    <button
                      onClick={() => { onSignupClick(); setIsMobileOpen(false); }}
                      className="flex-[1.5] h-14 gradient-bg-pink text-white rounded-2xl font-black shadow-lg shadow-pink-500/20 active:scale-95 transition-all btn-shine-effect"
                    >
                      Get Started
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
