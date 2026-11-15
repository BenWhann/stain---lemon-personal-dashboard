import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Plus, X } from 'lucide-react';
import { useBookmarks } from '../../store/bookmarks';
import { Modal } from '../ui/Modal';

export const Launchpad: React.FC = () => {
  const { bookmarks, add, remove } = useBookmarks();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', url: '', category: '', icon: '🔗' });

  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <AnimatePresence initial={false}>
          {bookmarks.map((b, i) => (
            <motion.li
              key={b.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 260, damping: 26 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group relative"
            >
              <a
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-full flex-col rounded-md border border-line/15 bg-ink/[0.02] p-3 transition-colors hover:border-honey/50 hover:bg-honey/[0.04]"
              >
                <span className="text-xl">{b.icon || '🔗'}</span>
                <span className="mt-2 flex items-start justify-between gap-1 text-xs font-medium text-ink">
                  <span className="line-clamp-1">{b.title}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-ink-faint group-hover:text-honey" />
                </span>
                <span className="mt-0.5 text-[11px] text-ink-faint truncate">{b.category}</span>
              </a>
              <button
                type="button"
                aria-label={`Remove ${b.title}`}
                onClick={() => void remove(b.id)}
                className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded bg-ink/10 text-ink-faint opacity-0 transition-opacity hover:text-ember group-hover:opacity-100 focus-visible:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
        <li>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid h-full min-h-[5.5rem] w-full place-items-center rounded-md border border-dashed border-line/25 text-xs text-ink-soft transition-colors hover:border-honey hover:text-honey"
          >
            <span className="flex flex-col items-center gap-1">
              <Plus className="h-4 w-4" /> Add a link
            </span>
          </button>
        </li>
      </ul>
      <Modal open={open} onClose={() => setOpen(false)} title="New link" width="sm">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.title.trim() || !form.url.trim()) return;
            void add({ ...form, title: form.title.trim(), url: form.url.trim(), category: form.category.trim() || 'General' });
            setForm({ title: '', url: '', category: '', icon: '🔗' });
            setOpen(false);
          }}
        >
          <input autoFocus className="field" placeholder="Name" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={255} />
          <input className="field" placeholder="https://" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required maxLength={500} />
          <div className="grid grid-cols-[1fr_5rem] gap-3">
            <input className="field" placeholder="Group (School, Work…)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} maxLength={100} />
            <input className="field text-center text-lg" aria-label="Emoji" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} maxLength={8} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-honey">
              Add link
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
