import { Zap, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useContact } from '../../context/ContactContext';

export default function Footer() {
  const { openContactModal } = useContact();
  
  return (
    <footer className="border-t border-[var(--border-color)] bg-transparent relative z-10 backdrop-blur-[2px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Brand & Copyright */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3 text-left pl-6">
            <Link to="/" className="flex items-center gap-2 group transition-transform duration-300 hover:scale-[1.02] active:scale-95">
              <div className="w-5 h-5 rounded-md gradient-bg-pink flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-bold tracking-tight gradient-text-pink animate-text-gradient">
                EchoChamber
              </span>
            </Link>
            <span className="hidden md:block text-[var(--border-color)]">|</span>
            <p className="text-xs text-[var(--text-tertiary)]">
              © {new Date().getFullYear()} EchoChamber. Transform your content with AI magic.
            </p>
          </div>

          {/* Contact */}
          <div className="flex items-center">
            <button
              onClick={openContactModal}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] hover:text-white hover:gradient-bg-pink transition-all shadow-sm group cursor-pointer"
              aria-label="Contact Developer"
            >
              <Mail className="w-4 h-4" />
              <span className="text-sm font-medium">Contact</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
