import { motion } from 'framer-motion';
import { Upload, Wand2, CheckCircle, Video, FileText } from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen pt-[calc(var(--navbar-height)+2rem)] pb-20 relative z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.6, type: "spring" }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center gap-2.5 px-6 py-2 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] mb-8 shadow-sm backdrop-blur-sm">
            <Video className="w-4 h-4 text-[var(--accent-blue)] font-black" /> 
            <span className="text-[11px] font-black uppercase tracking-[0.1em] text-[var(--accent-blue)]">Wait, how does it actually work?</span>
          </div>
          <h1 className="text-2xl sm:text-5xl md:text-6xl font-[900] mb-8 tracking-tighter leading-[1.1]">
            Behind The <span className="gradient-text-pink animate-text-gradient">Viral Magic.</span>
          </h1>
          <p className="text-md text-[var(--text-secondary)] max-w-2xl mx-auto font-medium tracking-tight leading-relaxed">
            Take a deep dive into our elite AI engine that turns raw footage into platform-perfect presence. 100% secure, 100% automated.
          </p>
        </motion.div>

        {/* Demo Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: "spring", damping: 25 }}
          className="relative rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden shadow-2xl mb-24 glass"
        >
          <div className="h-14 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/50 flex items-center px-6 gap-2">
            <div className="flex gap-2.5">
              <div className="w-3.5 h-3.5 rounded-full bg-[#FF5F56] shadow-sm" />
              <div className="w-3.5 h-3.5 rounded-full bg-[#FFBD2E] shadow-sm" />
              <div className="w-3.5 h-3.5 rounded-full bg-[#27C93F] shadow-sm" />
            </div>
            <div className="block mx-auto text-[11px] font-[900] text-[var(--text-tertiary)] bg-[var(--bg-card)] px-6 py-2 rounded-[var(--radius-md)] border border-[var(--border-color)] shadow-inner uppercase tracking-widest whitespace-nowrap overflow-hidden max-w-[150px] sm:max-w-none">
              ✨ echochamber.ai/engine
            </div>
            <div className="w-20 hidden sm:block" /> {/* Spacer for balance */}
          </div>
          <div className="p-8 sm:p-14 lg:p-20 md:flex gap-16 items-start">
            {/* Left Side: Privacy Assurance */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1 w-full flex flex-col justify-center gap-10 mb-16 md:mb-0"
            >
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                <div className="w-20 h-20 rounded-[var(--radius-lg)] bg-[var(--accent-green)]/10 flex items-center justify-center mb-8 border border-[var(--accent-green)]/20 shadow-xl relative glass group">
                  <CheckCircle className="w-10 h-10 text-[var(--accent-green)] transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-[var(--accent-green)]/5 blur-xl group-hover:blur-2xl transition-all" />
                </div>
                <h3 className="text-3xl sm:text-4xl font-[900] text-[var(--text-primary)] mb-6 tracking-tighter leading-tight">100% Private Streaming.</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed text-[17px] font-medium tracking-tight">
                  Your source video is processed as an encrypted stream. We never write your raw files to disk. Everything is wiped in real-time.
                </p>
              </div>

              {/* Streaming UI decoration inline */}
              <div className="w-full bg-[var(--bg-tertiary)]/30 border border-[var(--border-color)]/50 rounded-[var(--radius-lg)] p-6 shadow-2xl glass relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-green)]/5 blur-3xl -z-10" />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-[var(--accent-green)] font-mono uppercase tracking-[0.2em] flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-[var(--accent-green)] animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"/> 
                    Secure Edge Process
                  </span>
                  <span className="text-[10px] text-[var(--text-tertiary)] font-[900] uppercase tracking-widest opacity-50">Local Buffer Only</span>
                </div>
                <div className="h-2 bg-[var(--bg-card)]/50 rounded-full w-full overflow-hidden shadow-inner border border-[var(--border-color)]/20 relative">
                  <motion.div 
                    initial={{ width: "30%" }}
                    animate={{ width: "85%" }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                    className="h-full bg-gradient-to-r from-[var(--accent-green)] to-emerald-400 rounded-full relative" 
                  >
                    <div className="absolute top-0 right-0 h-full w-4 bg-white/30 blur-sm" />
                  </motion.div>
                </div>
                <p className="text-[10px] font-black text-[var(--text-tertiary)] mt-3 uppercase tracking-widest opacity-40">Zero persistence across entire ecosystem</p>
              </div>
            </motion.div>

            {/* Right Side: Process explanation */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1 space-y-12"
            >
              {[
                { icon: Upload, color: 'var(--accent-purple)', title: 'Secure Extraction', text: 'We stream your video over a private channel, extracting raw uncompressed audio without ever saving a file.' },
                { icon: Wand2, color: 'var(--accent-pink)', title: 'Semantic Deep Learning', text: 'Our AI engine analyzes tone, sentiment, and core hooks using proprietary semantic mapping.' },
                { icon: FileText, color: 'var(--accent-blue)', title: 'Multi-Core Generation', text: '5 specialized sub-engines craft perfectly tailored content for every platform simultaneously.' },
                { icon: CheckCircle, color: 'var(--accent-green)', title: 'Ready for Velocity', text: 'The result: premium, platform-ready content ready to go viral. No more blank-page anxiety.' }
              ].map((step, i) => (
                <div key={i} className="relative pl-10 group">
                  <div className="absolute left-0 top-0 bottom-[-48px] w-0.5 bg-[var(--border-color)]/30 last:hidden" />
                  <div className="absolute left-[-15px] top-0 p-1.5 bg-[var(--bg-card)] rounded-full border-2 border-[var(--border-color)]/50 z-10 group-hover:border-[var(--accent-purple)] transition-colors">
                    <step.icon className="w-4 h-4" style={{ color: step.color }} />
                  </div>
                  <h3 className="font-black text-lg mb-2 tracking-tight text-[var(--text-primary)]">
                    {i+1}. {step.title}
                  </h3>
                  <p className="text-[var(--text-tertiary)] text-sm font-medium leading-relaxed tracking-tight">
                    {step.text}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>

      </div>
    </main>
  );
}
