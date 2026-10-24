import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { Task } from '../../types';
import { LoafCat } from '../../art/LoafCat';
import { CalendarSection } from './CalendarSection';
import { Greeting } from './Greeting';
import { HabitsPane } from './HabitsPane';
import { Launchpad } from './Launchpad';
import { PranceDivider } from './PranceDivider';
import { QuestBoard } from './QuestBoard';
import { SanctuaryPane } from './SanctuaryPane';
import { StudyHall } from './StudyHall';
import { TimerPane } from './TimerPane';
import { TodayPane } from './TodayPane';
import { usePets } from '../../store/pets';

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 28, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { delay, duration: 0.9, ease: [0.22, 1, 0.36, 1] },
});

interface JournalProps {
  onOpenTask: (t: Task) => void;
  quickAddRef: React.Ref<HTMLInputElement>;
  calm: boolean;
}

export const Journal: React.FC<JournalProps> = ({ onOpenTask, quickAddRef, calm }) => {
  const boardRef = useRef<HTMLElement>(null);
  return (
    <div>
      {/* Cockpit: everything for today, floating over the study */}
      <section className="relative mx-auto grid min-h-[100svh] max-w-[1480px] gap-5 px-4 pb-8 pt-24 sm:px-8 xl:h-[100svh] xl:min-h-[760px] xl:grid-cols-[minmax(340px,420px)_1fr_minmax(300px,360px)] xl:pb-6">
        <div className="flex min-h-0 flex-col gap-5">
          <Greeting />
          <motion.div {...rise(0.35)} className="flex min-h-[28rem] flex-1 flex-col xl:min-h-0">
            <TodayPane onOpen={onOpenTask} quickAddRef={quickAddRef} />
          </motion.div>
        </div>

        {/* the middle stays open so the room and the cats show through */}
        <div className="flex min-h-0 flex-col items-center justify-end xl:items-start">
          <motion.div {...rise(0.55)} className="w-full max-w-[20rem]">
            <TimerPane />
          </motion.div>
        </div>

        <div className="flex min-h-0 flex-col gap-5">
          <motion.div {...rise(0.45)}>
            <SanctuaryPane />
          </motion.div>
          <motion.div {...rise(0.65)} className="flex min-h-[16rem] flex-1 flex-col xl:min-h-0">
            <HabitsPane className="flex-1" />
          </motion.div>
        </div>

        <motion.button
          type="button"
          onClick={() => boardRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-2 left-1/2 hidden -translate-x-1/2 items-center gap-1 text-xs text-ink-faint hover:text-ink xl:flex"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 5, 0] }}
          transition={{ opacity: { delay: 1.4 }, y: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } }}
        >
          The rest of your week <ChevronDown className="h-3.5 w-3.5" />
        </motion.button>
      </section>

      <div className="mx-auto max-w-[1480px] px-4 sm:px-8">
        <PranceDivider cat="lemon" calm={calm} />
        <Section ref={boardRef} id="board" title="The board" blurb="Drag tasks between columns. Dropping one in Done counts as finishing it.">
          <QuestBoard onOpen={onOpenTask} />
        </Section>

        <PranceDivider cat="stain" direction={-1} calm={calm} />
        <Section id="calendar" title="Calendar" blurb="Classes, practicum shifts, bills and deadlines in one place.">
          <CalendarSection />
        </Section>

        <PranceDivider cat="lemon" calm={calm} />
        <Section id="study" title="Study hall" blurb="Coursework at a glance, and a scratchpad that saves as you type.">
          <StudyHall />
        </Section>

        <PranceDivider cat="stain" direction={-1} calm={calm} />
        <Section id="links" title="Launchpad" blurb="The places you go every day.">
          <Launchpad />
        </Section>

        <Footer />
      </div>
    </div>
  );
};

const Section = React.forwardRef<HTMLElement, { id: string; title: string; blurb: string; children: React.ReactNode }>(
  ({ id, title, blurb, children }, ref) => (
    <section ref={ref} id={id} className="scroll-mt-24 py-6">
      <motion.header
        className="mb-6 max-w-2xl"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="heading text-4xl sm:text-5xl">{title}</h2>
        <p className="mt-2 text-ink-soft">{blurb}</p>
      </motion.header>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      >
        {children}
      </motion.div>
    </section>
  ),
);
Section.displayName = 'Section';

const Footer: React.FC = () => {
  const { lemonPets, stainPets } = usePets();
  return (
    <footer className="flex flex-col items-center pb-24 pt-16 text-center">
      <div className="flex items-end gap-2">
        <LoafCat coat="stain" style={{ width: 170 }} className="text-ink-faint" title="Stain, asleep" />
        <LoafCat coat="lemon" style={{ width: 170 }} className="text-ink-faint" title="Lemon, asleep" />
      </div>
      <p className="heading mt-4 text-2xl italic">That's everything. Go be proud of yourself.</p>
      <p className="mt-2 text-sm text-ink-faint">
        Lemon has been petted {lemonPets} times and Stain {stainPets}. They'd like more.
      </p>
    </footer>
  );
};
