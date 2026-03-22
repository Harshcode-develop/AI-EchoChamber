import { memo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

const CTASection = memo(function CTASection() {
  return (
    <section className="py-16 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--accent-pink)]/10 rounded-full blur-[140px] -z-10 animate-pulse will-change-[opacity]" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-color)] p-8 sm:p-16 shadow-xl flex flex-col items-center glass relative overflow-hidden will-change-[transform,opacity]"
        >
          {/* Subtle patterns */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent-pink)] to-transparent opacity-50" />
          
          <h2 className="text-[2rem] font-[900] mb-6 tracking-tighter text-[var(--text-primary)] max-w-3xl leading-[1.1]">
            Ready to Unleash Your <span className="gradient-text-pink animate-text-gradient">Viral Magic?</span>
          </h2>
          <p className="text-[var(--text-secondary)] text-[var(--text-base)] sm:text-[var(--text-lg)] max-w-2xl mx-auto mb-10 leading-relaxed font-medium tracking-tight">
            Join the elite creators saving weeks of work with our high-end AI content ecosystem.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-10 w-full">
            <Link
              to="/create"
              className="gradient-bg-pink text-white px-8 py-3.5 sm:px-10 sm:py-4 rounded-full text-[15px] font-[900] flex items-center justify-center gap-3 shadow-2xl hover:shadow-pink-500/30 hover:scale-[1.05] active:scale-[0.95] transition-all duration-300 btn-shine-effect w-full sm:w-auto will-change-transform"
            >
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              Claim Your Free Trial
              <ArrowRight className="w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {[
              "No credit card",
              "1 Free Generation",
              "No login required"
            ].map(text => (
              <span key={text} className="text-xs uppercase tracking-[0.1em] font-black text-[var(--text-tertiary)] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-pink)]/50" />
                {text}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
});

export default CTASection;
