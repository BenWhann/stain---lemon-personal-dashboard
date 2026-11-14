import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Sliders, Volume2, VolumeX } from 'lucide-react';
import { AMBIENCE_CHANNELS, sfx } from '../../lib/audio';
import { hearts } from '../../lib/celebrate';
import { usePets } from '../../store/pets';
import { useUi } from '../../store/ui';
import { CatHead } from '../../art/CatHead';
import { COATS } from '../../art/coats';
import { useXp } from './useXp';
import { cx } from '../ui/cx';

export const SanctuaryPane: React.FC<{ className?: string }> = ({ className }) => {
  const { level, title, progress, toNext, xp } = useXp();
  const { lemonPets, stainPets, focusPaws, pet } = usePets();
  const { ambience, setAmbience, sound, setSound } = useUi();
  const [ambienceOpen, setAmbienceOpen] = useState(false);

  const petCat = (cat: 'lemon' | 'stain', e: React.MouseEvent) => {
    pet(cat);
    sfx.purr(cat);
    hearts(e.clientX, e.clientY, cat);
  };

  const activeChannels = AMBIENCE_CHANNELS.filter((ch) => ambience[ch.id] > 0);

  return (
    <section className={cx('pane flex flex-col gap-4 p-4 sm:p-5', className)} aria-label="Level, cats and ambience">
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="heading text-lg">
            Level {level}: {title}
          </h2>
          <span className="tabular text-xs text-ink-faint">{xp} xp</span>
        </div>
        <div
          className="relative mt-2 h-2 overflow-hidden rounded-full bg-ink/10"
          role="progressbar"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progress to next level"
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, rgb(var(--caramel)), rgb(var(--honey)) 70%, rgb(255 236 190))' }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(3, progress * 100)}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          />
        </div>
        <p className="mt-1 text-[11px] text-ink-faint">{toNext} xp to next level · {focusPaws} focus paws</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(['lemon', 'stain'] as const).map((cat) => (
          <motion.button
            key={cat}
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => petCat(cat, e)}
            className="group flex items-center gap-2 rounded-xl bg-ink/[0.04] p-2 text-left transition-colors hover:bg-ink/[0.08]"
          >
            <svg viewBox="-56 -70 112 118" className="h-9 w-9 shrink-0 transition-transform duration-500 ease-spring group-hover:rotate-[-8deg]">
              <CatHead coat={COATS[cat]} eyes="happy" />
            </svg>
            <span className="min-w-0">
              <span className="block text-xs font-semibold capitalize text-ink">Pet {cat}</span>
              <span className="tabular block text-[10px] text-ink-faint">{cat === 'lemon' ? lemonPets : stainPets} pets</span>
            </span>
          </motion.button>
        ))}
      </div>

      <div className="border-t border-ink/10 pt-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setAmbienceOpen((o) => !o)}
            className="flex items-center gap-1.5 text-xs font-medium text-ink-soft hover:text-ink"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Ambience</span>
            {activeChannels.length > 0 && (
              <span className="rounded-full bg-honey/20 px-1.5 text-[10px] font-semibold text-honey-deep dark:text-honey">
                {activeChannels.length}
              </span>
            )}
            {ambienceOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          <button
            type="button"
            className="btn-ghost h-7 w-7 !p-0"
            onClick={() => setSound(!sound)}
            aria-label={sound ? 'Mute all sound' : 'Turn sound on'}
            title={sound ? 'Mute' : 'Unmute'}
          >
            {sound ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>
        </div>

        <AnimatePresence>
          {ambienceOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden pt-3"
            >
              <div className="grid grid-cols-5 gap-1">
                {AMBIENCE_CHANNELS.map((ch) => (
                  <label key={ch.id} className="flex flex-col items-center gap-1.5">
                    <span className="relative block h-20 w-6">
                      <span className="absolute inset-y-0 left-1/2 w-1.5 -translate-x-1/2 rounded-full bg-ink/10" />
                      <motion.span
                        className="absolute bottom-0 left-1/2 w-1.5 -translate-x-1/2 rounded-full"
                        style={{
                          background: 'linear-gradient(0deg, rgb(var(--caramel)), rgb(var(--honey)))',
                          boxShadow: ambience[ch.id] > 0 ? '0 0 10px rgb(var(--honey) / 0.6)' : 'none',
                        }}
                        animate={{ height: `${ambience[ch.id] * 100}%` }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.02}
                        value={ambience[ch.id]}
                        onChange={(e) => setAmbience(ch.id, Number(e.target.value))}
                        className="vertical-range absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        aria-label={`${ch.label} volume`}
                      />
                    </span>
                    <span className={cx('text-[10px] transition-colors', ambience[ch.id] > 0 ? 'text-ink font-medium' : 'text-ink-faint')}>
                      {ch.label}
                    </span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
