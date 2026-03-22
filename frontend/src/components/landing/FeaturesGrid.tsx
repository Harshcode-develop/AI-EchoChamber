import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  Zap, Target, TrendingUp, Layers, Mic, Sparkles
} from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Generate content in seconds, not hours. Our AI works at the speed of thought.',
    color: '#F59E0B',
  },
  {
    icon: Target,
    title: 'Platform Optimized',
    description: "Content tailored for each platform's algorithm and audience expectations.",
    color: '#EC4899',
  },
  {
    icon: TrendingUp,
    title: 'Engagement Boost',
    description: 'AI-crafted hooks and CTAs designed to capture attention and drive interaction.',
    color: '#10B981',
  },
  {
    icon: Layers,
    title: 'Multi-Format',
    description: 'One video becomes five platform-ready content pieces instantly.',
    color: '#3B82F6',
  },
  {
    icon: Mic,
    title: 'Brand Voice',
    description: 'Maintains your unique tone, style, and personality across all platforms.',
    color: '#EF4444',
  },
  {
    icon: Sparkles,
    title: 'AI Magic',
    description: 'Powered by cutting-edge language models for human-quality writing.',
    color: '#8B5CF6',
  },
];

const FeaturesGrid = memo(function FeaturesGrid() {
  return (
    <section className="py-16 relative overflow-hidden">
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
            Dominate Every <span className="gradient-text-pink animate-text-gradient">Platform.</span>
          </h2>
          <p className="text-[var(--text-secondary)] text-[var(--text-base)] font-medium max-w-2xl mx-auto tracking-tight leading-relaxed">
            Everything you need to go viral, all from a single video source. Powered by elite AI.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.08,
                delayChildren: 0.2
              }
            }
          }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={{
                hidden: { opacity: 0, y: 25, scale: 0.95 },
                show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", damping: 20 } }
              }}
              className="group p-8 rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] hover:border-[var(--accent-purple)]/20 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-default glass-hover overflow-hidden relative will-change-[transform,opacity]"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--accent-purple)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div
                className="w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg relative z-10"
                style={{ 
                   background: `linear-gradient(135deg, ${feature.color}, ${feature.color}dd)`,
                  boxShadow: `0 8px 30px -10px ${feature.color}66`
                }}
              >
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-[var(--text-h3)] font-black mb-4 text-[var(--text-primary)] tracking-tight relative z-10 transition-colors duration-300 group-hover:text-[var(--accent-purple)] leading-tight">
                {feature.title}
              </h3>
              <p className="text-[15px] text-[var(--text-tertiary)] leading-relaxed font-medium relative z-10">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
});

export default FeaturesGrid;
