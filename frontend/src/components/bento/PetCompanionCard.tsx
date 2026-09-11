import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Heart } from 'lucide-react';
import { usePetStore } from '../../store/usePetStore';

export const PetCompanionCard: React.FC = () => {
  const { lemonPets, stainPets, petLemon, petStain } = usePetStore();

  const lemonMoods = [
    'Loafing peacefully in the warm sunbeam ☀️',
    'Making soft biscuits on a fuzzy blanket 🍞',
    'Purring like a quiet little engine 💛',
    'Curled up in a tiny lemon ball 🍋',
    'Chirping at a little bird outside the window 🐦',
  ];

  const stainMoods = [
    'Zooming after invisible shadow creatures ⚡',
    'Observing your study notes with deep clinical focus 🧐',
    'Curled into a sleek void loaf on your chair 🐾',
    'Napping right next to your laptop keyboard 💻',
    'Pawing gently at your pen while you write ✍️',
  ];

  const currentLemonMood = lemonMoods[lemonPets % lemonMoods.length];
  const currentStainMood = stainMoods[stainPets % stainMoods.length];

  const handleLemonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    petLemon({ x: rect.left + rect.width / 2, y: rect.top });
  };

  const handleStainClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    petStain({ x: rect.left + rect.width / 2, y: rect.top });
  };

  return (
    <div className="bg-gradient-to-br from-cat-100/90 via-amber-50 to-orange-100/80 dark:from-[#1E1B24] dark:via-[#221E2A] dark:to-cat-950/40 p-6 rounded-3xl border border-cat-200/80 dark:border-stone-800 shadow-cozy dark:shadow-stain space-y-4">
      {/* Title & Counter Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐱🐈‍⬛</span>
          <h3 className="font-bold text-xs uppercase tracking-wider text-cat-800 dark:text-cat-300 font-cozy">
            Lemon & Stain's Corner
          </h3>
        </div>
        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/80 dark:bg-stone-800 font-bold text-cat-700 dark:text-cat-300 shadow-2xs border border-cat-100 dark:border-stone-700">
          Total Pets: {lemonPets + stainPets}
        </span>
      </div>

      {/* Cat 1: Lemon */}
      <div className="p-4 rounded-2xl bg-white/85 dark:bg-stone-800/80 border border-amber-200/80 dark:border-stone-700/80 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍋🐱</span>
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">
                Lemon (Calico Loaf)
              </h4>
              <span className="text-[10px] text-stone-400">Sweet, sun-seeking companion</span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-stone-700 text-amber-800 dark:text-amber-300">
            {lemonPets} pets
          </span>
        </div>
        <p className="text-xs text-stone-600 dark:text-stone-300 italic">{currentLemonMood}</p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleLemonClick}
          className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-400 to-cat-500 hover:from-amber-500 hover:to-cat-600 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Heart className="w-3.5 h-3.5 fill-white" />
          <span>Pet Lemon 🍋</span>
        </motion.button>
      </div>

      {/* Cat 2: Stain */}
      <div className="p-4 rounded-2xl bg-white/85 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐈‍⬛🐾</span>
            <div>
              <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">
                Stain (Midnight Void)
              </h4>
              <span className="text-[10px] text-stone-400">Deep focus desk guardian</span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200">
            {stainPets} pets
          </span>
        </div>
        <p className="text-xs text-stone-600 dark:text-stone-300 italic">{currentStainMood}</p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleStainClick}
          className="w-full py-2 rounded-xl bg-gradient-to-r from-stone-800 to-black hover:from-stone-900 hover:to-stone-950 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 border border-stone-700 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Pet Stain 🐾</span>
        </motion.button>
      </div>
    </div>
  );
};
