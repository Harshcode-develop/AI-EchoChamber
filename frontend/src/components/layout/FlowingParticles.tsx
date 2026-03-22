import { useEffect, useState } from 'react';

export default function FlowingParticles() {
  const [particles, setParticles] = useState<{ id: number; size: number; left: number; duration: number; delay: number; colorClass: string; tx: number }[]>([]);

  useEffect(() => {
    // Determine particle count based on screen width
    // Limit to 6 on mobile to preserve battery life and high FPS, 15 on desktop
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 6 : 15;

    // Generate particles for a lightweight flowing effect
    const newParticles = Array.from({ length: particleCount }).map((_, i) => ({
      id: i,
      size: Math.random() * (isMobile ? 8 : 10) + 4, // 4px to 14px (or 12px mobile)
      left: Math.random() * 100, // 0% to 100%
      duration: Math.random() * 20 + 20, // 20s to 40s (slower is smoother)
      delay: Math.random() * 20, // 0s to 20s
      tx: (Math.random() - 0.5) * (isMobile ? 20 : 40), // Less drift on mobile
      colorClass: ['bg-[var(--accent-pink)]', 'bg-[var(--accent-purple)]', 'bg-[var(--accent-blue)]', 'bg-[var(--accent-orange)]'][Math.floor(Math.random() * 4)],
    }));
    setParticles(newParticles);
  }, []);

  return (
    <>
      <div className="bg-blob bg-blob-1 hardware-accelerated pointer-events-none" />
      <div className="bg-blob bg-blob-2 hardware-accelerated pointer-events-none" />
      <div className="bg-blob bg-blob-3 hardware-accelerated pointer-events-none" />
      <div className="bg-blob bg-blob-4 hardware-accelerated pointer-events-none" />
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute rounded-full opacity-0 hardware-accelerated pointer-events-none ${p.colorClass}`}
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: `${p.left}%`,
            animation: `flow-upward ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
            // Use CSS custom properties to pass variables to the keyframe
            ['--tx' as string]: `${p.tx}vw`,
          }}
        />
      ))}
    </>
  );
}
