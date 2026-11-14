import React from 'react';
import { motion } from 'framer-motion';
import { QuestBoard } from '../journal/QuestBoard';
import type { Task } from '../../types';

interface BoardViewProps {
  onOpenTask: (t: Task) => void;
}

export const BoardView: React.FC<BoardViewProps> = ({ onOpenTask }) => {
  return (
    <div className="mx-auto max-w-[1480px] px-4 pb-24 pt-24 sm:px-8">
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-6 max-w-2xl"
      >
        <h1 className="heading text-4xl sm:text-5xl">Quest Board</h1>
        <p className="mt-2 text-ink-soft">
          Drag tasks between columns to track work in paws, or drop in Done to complete them.
        </p>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <QuestBoard onOpen={onOpenTask} />
      </motion.div>
    </div>
  );
};
