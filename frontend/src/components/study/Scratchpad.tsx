import React, { useState, useEffect } from 'react';
import { FileEdit, Check, Loader2 } from 'lucide-react';
import { useNoteStore } from '../../store/useNoteStore';
import { useDebounce } from '../../hooks/useDebounce';

interface ScratchpadProps {
  rows?: number;
  title?: string;
}

export const Scratchpad: React.FC<ScratchpadProps> = ({
  rows = 7,
  title = 'Clinical & Study Scratchpad',
}) => {
  const { notes, saveNotes, isSavingNotes } = useNoteStore();
  const [localText, setLocalText] = useState(notes);
  const debouncedText = useDebounce(localText, 600);

  // Sync external state changes
  useEffect(() => {
    setLocalText(notes);
  }, [notes]);

  // Trigger autosave when typing stops
  useEffect(() => {
    if (debouncedText !== notes) {
      saveNotes(debouncedText);
    }
  }, [debouncedText, notes, saveNotes]);

  return (
    <div className="bg-white/90 dark:bg-[#1E1B24]/90 backdrop-blur-md p-6 rounded-3xl border border-cat-200/80 dark:border-stone-800 shadow-cozy dark:shadow-stain space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileEdit className="w-4 h-4 text-cat-500" />
          <h2 className="text-base sm:text-lg font-bold font-cozy text-stone-900 dark:text-stone-100">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-semibold text-stone-400">
          {isSavingNotes ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-cat-500" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Check className="w-3 h-3 text-emerald-500" />
              <span>Autosaved 🐾</span>
            </>
          )}
        </div>
      </div>

      <textarea
        value={localText}
        onChange={(e) => setLocalText(e.target.value)}
        rows={rows}
        placeholder="Jot down quick supervision reflections, field notes, or course ideas..."
        className="w-full text-xs p-4 rounded-2xl bg-cat-50/50 dark:bg-stone-800/40 border border-cat-200/70 dark:border-stone-700/70 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-cat-400 font-mono leading-relaxed custom-scrollbar transition-all"
      />
    </div>
  );
};
