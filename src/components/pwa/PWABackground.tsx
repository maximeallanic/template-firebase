import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * Animated background for PWA homepage with Candy Crush-style colorful blobs.
 * Respects prefers-reduced-motion.
 */
export function PWABackground() {
  const shouldReduceMotion = useReducedMotion();

  // Blob configurations
  const blobs = [
    {
      color: 'from-rose-500/30 to-pink-500/20',
      size: 'w-96 h-96',
      position: 'top-[-10%] left-[-20%]',
      delay: 0,
    },
    {
      color: 'from-red-500/25 to-orange-500/15',
      size: 'w-80 h-80',
      position: 'top-[20%] right-[-15%]',
      delay: 2,
    },
    {
      color: 'from-pink-400/20 to-rose-600/25',
      size: 'w-72 h-72',
      position: 'bottom-[10%] left-[-10%]',
      delay: 4,
    },
    {
      color: 'from-amber-500/15 to-red-500/20',
      size: 'w-64 h-64',
      position: 'bottom-[-5%] right-[10%]',
      delay: 1,
    },
    {
      color: 'from-purple-500/15 to-pink-500/20',
      size: 'w-48 h-48',
      position: 'top-[40%] left-[20%]',
      delay: 3,
    },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950" />

      {/* Animated blobs */}
      {blobs.map((blob, i) => (
        <motion.div
          key={i}
          className={`absolute ${blob.position} ${blob.size} rounded-full bg-gradient-to-br ${blob.color} blur-3xl`}
          initial={{ opacity: 0.5, scale: 1 }}
          animate={
            shouldReduceMotion
              ? { opacity: 0.5, scale: 1 }
              : {
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.1, 1],
                  x: [0, 20, -20, 0],
                  y: [0, -15, 15, 0],
                }
          }
          transition={{
            duration: 15 + i * 2,
            repeat: Infinity,
            delay: blob.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Radial light at center (where PLAY button sits) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-rose-500/10 via-transparent to-transparent rounded-full blur-2xl" />

      {/* Subtle grain texture */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
