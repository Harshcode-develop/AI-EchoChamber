import { memo } from 'react';
import { motion } from 'framer-motion';
import { Upload, Wand2, PenTool } from 'lucide-react';

const steps = [
  {
    number: 1,
    icon: Upload,
    title: 'Upload Your Video',
    description: 'Drop your video file — we support MP4, MOV, and WebM formats up to 500MB for free.',
    color: '#8B5CF6',
  },
  {
    number: 2,
    icon: Wand2,
    title: 'Choose & Generate',
    description: 'Select your target platforms, add voice examples, and let our AI create platform-perfect content.',
    color: '#EC4899',
  },
  {
    number: 3,
    icon: PenTool,
    title: 'Edit & Export',
    description: 'Review your generated content, make quick edits, and copy to clipboard — ready to post everywhere.',
    color: '#10B981',
  },
];

const HowItWorks = memo(function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 relative bg-[var(--bg-secondary)] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, type: "spring", damping: 25 }}
          className="text-center mb-12 will-change-[transform,opacity]"
        >
          <h2 className="text-[2rem] font-[900] mb-4 tracking-tight text-[var(--text-primary)]">
            Create <span className="gradient-text-pink animate-text-gradient">Magic</span> in 3 Steps
          </h2>
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-[var(--bg-tertiary)]/80 border border-[var(--border-color)] group hover:border-[var(--accent-purple)] transition-all cursor-default">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Powered by Gemini 2.5 Flash</span>
          </div>
          <p className="text-[var(--text-secondary)] text-[var(--text-base)] font-medium max-w-2xl mx-auto tracking-tight leading-relaxed">
            From raw footage to platform-ready content in seconds. High-end AI, zero effort.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-12 md:space-y-0 md:grid md:grid-cols-3 md:gap-16 relative max-w-6xl mx-auto">
          {/* Connection lines (desktop) with animation */}
          <div className="hidden md:block absolute top-[32px] left-[15%] right-[15%] h-[2px] opacity-20 overflow-hidden">
            <motion.div 
              initial={{ x: "-100%" }}
              whileInView={{ x: "100%" }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="w-full h-full will-change-transform"
              style={{ background: 'linear-gradient(90deg, transparent, #8B5CF6, #EC4899, #10B981, transparent)' }} 
            />
          </div>

          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ type: "spring", damping: 20, delay: index * 0.2 }}
              className="relative text-center flex flex-col items-center group will-change-[transform,opacity]"
            >
              {/* Step Number Badge */}
              <div className="relative inline-flex mb-10">
                <div
                  className="w-16 h-16 rounded-[var(--radius-lg)] flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-xl relative z-10 glass will-change-transform"
                  style={{ background: `${step.color}10`, border: `1px solid ${step.color}20` }}
                >
                  <step.icon className="w-7 h-7 transition-transform duration-500 group-hover:scale-110" style={{ color: step.color }} />
                </div>
                <div
                  className="absolute -top-4 -right-4 w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center text-white text-sm font-black shadow-lg z-20 transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-1 will-change-transform"
                  style={{ background: `linear-gradient(135deg, ${step.color}, ${step.color}dd)` }}
                >
                  {step.number}
                </div>
              </div>

              <h3 className="text-[var(--text-h3)] font-black mb-4 text-[var(--text-primary)] tracking-tight">
                {step.title}
              </h3>
              <p className="text-[15px] text-[var(--text-tertiary)] leading-relaxed max-w-sm mx-auto font-medium">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});

export default HowItWorks;
