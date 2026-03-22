import { useRef, useEffect, useState, memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

function AnimatedCounter({ end, suffix = '', duration = 2000 }: { end: number; suffix: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(animate);
          };
          animate();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <div ref={ref}>{count}{suffix}</div>;
}

const HeroSection = memo(function HeroSection() {
  return (
    <section className="relative pt-[calc(var(--navbar-height)+100px)] pb-16 overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--accent-purple)]/10 rounded-full blur-[120px] animate-pulse will-change-[opacity]" />
        <div className="absolute bottom-[20%] right-[-5%] w-[35%] h-[35%] bg-[var(--accent-pink)]/10 rounded-full blur-[100px] animate-float will-change-transform" />
      </div>
      
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        {/* Pill Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, type: "spring", damping: 25 }}
          className="inline-flex items-center justify-center gap-2.5 px-5 py-1.5 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] mb-10 shadow-sm backdrop-blur-sm will-change-[transform,opacity]"
        >
          <Sparkles className="w-3.5 h-3.5 text-[var(--accent-pink)] animate-shine" />
          <span className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--accent-pink)]">
            AI-Powered Content Magic
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, delay: 0.1, type: "spring", damping: 30 }}
          className="cinema-hero-title text-[clamp(2.75rem,8vw,4rem)] font-[900] leading-[1.05] mb-8 tracking-tight text-[var(--text-primary)] mx-auto max-w-7xl will-change-[transform,opacity]"
        >
          Turn Videos Into<br />
          <span className="gradient-text-pink animate-text-gradient py-1 inline-block">Viral Magic.</span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-[var(--text-lg)] text-[var(--text-secondary)] font-medium max-w-[580px] mx-auto mb-10 leading-relaxed tracking-tight will-change-[transform,opacity]"
        >
          Upload your video and instantly create engaging content for <span className="text-[var(--text-primary)] font-black decoration-pink-500/30 underline decoration-4 underline-offset-4 whitespace-nowrap">5 platforms at once</span>.
        </motion.p>


        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex justify-center mb-16"
        >
          <Link
            to="/create"
            className="gradient-bg-pink text-white px-8 py-3.5 rounded-full text-[15px] font-black shadow-2xl hover:shadow-pink-500/30 hover:scale-[1.05] active:scale-[0.95] transition-all duration-300 inline-flex items-center justify-center gap-3 text-center btn-shine-effect will-change-transform"
          >
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            Start Creating Free
          </Link>
        </motion.div>

        {/* Down Arrow Indicator */}
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 1, delay: 0.8 }}
           className="flex justify-center mb-16"
        >
          <button 
            onClick={() => window.scrollBy({ top: window.innerHeight - 80, behavior: 'smooth' })}
            className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--accent-purple)] hover:bg-[var(--accent-purple)]/10 animate-bounce shadow-sm transition-colors cursor-pointer will-change-transform"
            aria-label="Scroll down"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5, type: "spring" }}
          className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[var(--radius-lg)] p-6 sm:p-8 shadow-xl w-full max-w-4xl mx-auto glass relative will-change-[transform,opacity]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4">
            {[
              { end: 10, suffix: 'x', label: 'Faster Content', color: 'var(--accent-pink)' },
              { end: 5, suffix: '', label: 'Social Platforms', color: 'var(--accent-blue)' },
              { end: 80, suffix: '%', label: 'Time Saved', color: 'var(--accent-purple)' },
            ].map((stat) => (
              <div key={stat.label} className="text-center flex flex-col items-center">
                <div className="text-2xl sm:text-3xl font-black mb-1 tracking-tighter" style={{ color: stat.color }}>
                  <AnimatedCounter end={stat.end} suffix={stat.suffix} />
                </div>
                <div className="text-[9px] text-[var(--text-tertiary)] font-black uppercase tracking-[0.12em]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
});

export default HeroSection;
