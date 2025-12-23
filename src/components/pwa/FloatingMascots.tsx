import { motion } from 'framer-motion';
import { AvatarIcon } from '../AvatarIcon';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import type { Avatar } from '../../types/gameTypes';

// Mascot configurations - positioned around edges
const mascots: {
  avatar: Avatar;
  x: string;
  y: string;
  delay: number;
  duration: number;
  size: number;
}[] = [
  { avatar: 'burger', x: '5%', y: '12%', delay: 0, duration: 6, size: 56 },
  { avatar: 'pizza', x: '88%', y: '18%', delay: 1.2, duration: 7, size: 48 },
  { avatar: 'taco', x: '8%', y: '75%', delay: 2, duration: 5.5, size: 52 },
  { avatar: 'donut', x: '85%', y: '70%', delay: 0.8, duration: 6.5, size: 44 },
  { avatar: 'icecream', x: '15%', y: '45%', delay: 1.5, duration: 5, size: 40 },
  { avatar: 'chili', x: '82%', y: '42%', delay: 2.5, duration: 7.5, size: 48 },
  { avatar: 'cupcake', x: '50%', y: '8%', delay: 0.5, duration: 6, size: 44 },
  { avatar: 'sushi', x: '50%', y: '88%', delay: 1.8, duration: 5.8, size: 40 },
];

/**
 * Floating food mascots for PWA homepage.
 * Adds playful Candy Crush-style animated characters around the screen edges.
 */
export function FloatingMascots() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-10">
      {mascots.map((mascot) => (
        <motion.div
          key={mascot.avatar}
          className="absolute"
          style={{
            left: mascot.x,
            top: mascot.y,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={
            shouldReduceMotion
              ? { opacity: 0.4, scale: 1, y: 0, rotate: 0 }
              : {
                  opacity: 0.4,
                  scale: 1,
                  y: [0, -12, 0],
                  rotate: [-3, 3, -3],
                }
          }
          transition={
            shouldReduceMotion
              ? { duration: 0.5 }
              : {
                  opacity: { duration: 0.8, delay: mascot.delay * 0.3 },
                  scale: { duration: 0.8, delay: mascot.delay * 0.3 },
                  y: {
                    duration: mascot.duration,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: mascot.delay,
                  },
                  rotate: {
                    duration: mascot.duration * 1.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: mascot.delay,
                  },
                }
          }
        >
          <div
            className="drop-shadow-lg"
            style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}
          >
            <AvatarIcon avatar={mascot.avatar} size={mascot.size} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
