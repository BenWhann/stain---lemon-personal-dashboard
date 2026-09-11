import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePetStore } from '../../store/usePetStore';

export const FloatingEmoji: React.FC = () => {
  const floatingParticles = usePetStore((state) => state.floatingParticles);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {floatingParticles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ opacity: 1, scale: 0.8, y: 0, x: 0 }}
            animate={{
              opacity: 0,
              scale: 1.4,
              y: -50,
              x: (Math.random() - 0.5) * 20,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute text-2xl select-none"
            style={{
              left: particle.x - 14,
              top: particle.y - 14,
            }}
          >
            {particle.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
