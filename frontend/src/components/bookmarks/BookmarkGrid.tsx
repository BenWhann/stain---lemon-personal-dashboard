import React, { useState } from 'react';
import { ExternalLink, Plus, Trash2 } from 'lucide-react';
import { useBookmarkStore } from '../../store/useBookmarkStore';
import { Modal } from '../common/Modal';

export const BookmarkGrid: React.FC = () => {
  const { bookmarks, addBookmark, deleteBookmark } = useBookmarkStore();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Tools');
  const [icon, setIcon] = useState('🔗');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    addBookmark({
      title: title.trim(),
      url: url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`,
      category: category.trim(),
      icon: icon.trim() || '🔗',
    });

    setTitle('');
    setUrl('');
    setShowModal(false);
  };

  return (
    <div className="bg-white/90 dark:bg-[#1E1B24]/90 backdrop-blur-md p-6 rounded-3xl border border-cat-200/80 dark:border-stone-800 shadow-cozy dark:shadow-stain space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌟</span>
          <h2 className="text-lg font-bold font-cozy text-stone-900 dark:text-stone-100">
            Quick Feline Launchpad
          </h2>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="text-xs font-bold text-cat-600 dark:text-cat-400 hover:text-cat-700 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Link</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {bookmarks.map((b) => (
          <div
            key={b.id}
            className="group relative flex flex-col p-3.5 rounded-2xl bg-cat-50/50 dark:bg-stone-800/40 border border-cat-100/80 dark:border-stone-800 hover:border-cat-400 dark:hover:border-cat-500 hover:shadow-cozy dark:hover:shadow-stain-glow transition-all"
          >
            <a
              href={b.url}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex flex-col cursor-pointer"
            >
              <span className="text-2xl mb-1.5">{b.icon || '🔗'}</span>
              <span className="text-xs font-bold text-stone-800 dark:text-stone-100 group-hover:text-cat-600 dark:group-hover:text-cat-400 truncate flex items-center gap-1">
                <span>{b.title}</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </span>
              <span className="text-[10px] text-stone-400 truncate mt-0.5">
                {b.category}
              </span>
            </a>

            <button
              onClick={() => deleteBookmark(b.id)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-stone-300 hover:text-rose-500 p-1 rounded transition-all cursor-pointer"
              title="Delete bookmark"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="🌟 Add Launchpad Bookmark" maxWidth="sm">
        <form onSubmit={handleAdd} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Title
            </label>
            <input
              type="text"
              placeholder="e.g. Augsburg Moodle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-cat-50/60 dark:bg-stone-800 border border-cat-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-cat-400"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
              URL
            </label>
            <input
              type="text"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-cat-50/60 dark:bg-stone-800 border border-cat-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-cat-400"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Category
              </label>
              <input
                type="text"
                placeholder="e.g. MSW School"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-cat-50/60 dark:bg-stone-800 border border-cat-200 dark:border-stone-700 text-stone-800 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Emoji Icon
              </label>
              <input
                type="text"
                placeholder="🎓"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-cat-50/60 dark:bg-stone-800 border border-cat-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 text-center text-base"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 rounded-xl bg-cat-50 dark:bg-stone-800 font-bold text-stone-600 dark:text-stone-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cat-500 hover:bg-cat-600 text-white font-bold cursor-pointer shadow-xs"
            >
              Save Link 🐾
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
