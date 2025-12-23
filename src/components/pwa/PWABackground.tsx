import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * Animated background for PWA homepage with colorful blobs.
 * Uses CSS animations for better performance on mobile devices.
 * Respects prefers-reduced-motion.
 */
export function PWABackground() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950" />

      {/* CSS-animated blobs - reduced from 5 to 3 for performance */}
      {!shouldReduceMotion && (
        <>
          <div
            className="absolute top-[-10%] left-[-20%] w-80 h-80 rounded-full bg-gradient-to-br from-rose-500/25 to-pink-500/15 blur-3xl"
            style={{
              animation: 'blob-float-1 20s ease-in-out infinite',
              willChange: 'transform, opacity',
            }}
          />
          <div
            className="absolute top-[20%] right-[-15%] w-72 h-72 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/10 blur-3xl"
            style={{
              animation: 'blob-float-2 25s ease-in-out infinite',
              willChange: 'transform, opacity',
            }}
          />
          <div
            className="absolute bottom-[5%] left-[-5%] w-64 h-64 rounded-full bg-gradient-to-br from-pink-400/15 to-rose-600/20 blur-3xl"
            style={{
              animation: 'blob-float-3 22s ease-in-out infinite',
              willChange: 'transform, opacity',
            }}
          />
        </>
      )}

      {/* Static blobs for reduced motion */}
      {shouldReduceMotion && (
        <>
          <div className="absolute top-[-10%] left-[-20%] w-80 h-80 rounded-full bg-gradient-to-br from-rose-500/20 to-pink-500/10 blur-3xl opacity-50" />
          <div className="absolute top-[20%] right-[-15%] w-72 h-72 rounded-full bg-gradient-to-br from-red-500/15 to-orange-500/10 blur-3xl opacity-50" />
          <div className="absolute bottom-[5%] left-[-5%] w-64 h-64 rounded-full bg-gradient-to-br from-pink-400/15 to-rose-600/15 blur-3xl opacity-50" />
        </>
      )}

      {/* Radial light at center (where PLAY button sits) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-radial from-rose-500/8 via-transparent to-transparent rounded-full blur-xl" />

      {/* CSS keyframes - defined inline for component encapsulation */}
      <style>{`
        @keyframes blob-float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
          50% { transform: translate(15px, -10px) scale(1.05); opacity: 0.6; }
        }
        @keyframes blob-float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.35; }
          50% { transform: translate(-10px, 12px) scale(1.03); opacity: 0.5; }
        }
        @keyframes blob-float-3 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
          50% { transform: translate(12px, 8px) scale(1.04); opacity: 0.55; }
        }
      `}</style>
    </div>
  );
}
