import React, { useState, useEffect } from 'react';
import { FileEdit, Check } from 'lucide-react';
import { useWidgets } from '../../store/widgets';

interface QuickNoteWidgetProps {
  id: string;
  title?: string;
  initialContent?: string;
}

export const QuickNoteWidget: React.FC<QuickNoteWidgetProps> = ({ id, title, initialContent = '' }) => {
  const updateWidget = useWidgets((s) => s.updateWidget);
  const [content, setContent] = useState(initialContent);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const handleChange = (val: string) => {
    setContent(val);
    updateWidget(id, {
      settings: {
        noteContent: val,
        noteTitle: title,
      },
    });
    setSaved(true);
    const t = window.setTimeout(() => setSaved(false), 1200);
    return () => window.clearTimeout(t);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between border-b border-line/15 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
          <FileEdit className="h-3.5 w-3.5 text-honey-deep dark:text-honey" />
          <span>{title || 'Scratchpad'}</span>
        </div>
        {saved && (
          <span className="inline-flex items-center gap-1 text-[11px] text-sage">
            <Check className="h-3 w-3" /> Saved
          </span>
        )}
      </div>
      <textarea
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Type quick thoughts, study reminders, or meeting notes..."
        rows={5}
        className="scroll-soft min-h-[7rem] flex-1 resize-y bg-transparent text-xs leading-relaxed text-ink placeholder:text-ink-faint/70 focus:outline-none"
      />
    </div>
  );
};
