import React, { useState } from 'react';
import { Modal } from '../common/Modal';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, icon: string) => void;
}

export const HabitModal: React.FC<HabitModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🐾');

  const icons = ['🐾', '🏃‍♀️', '🥗', '📖', '💧', '🧘‍♀️', '☕', '💤', '✨'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), icon);
    setName('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🐾 Create Daily Paw-gress Habit" maxWidth="sm">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
            Habit Name
          </label>
          <input
            type="text"
            placeholder="e.g. Read 20m Clinical Research"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-cat-50/60 dark:bg-stone-800 border border-cat-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-cat-400"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
            Choose Icon
          </label>
          <div className="flex gap-2 flex-wrap">
            {icons.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setIcon(item)}
                className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all cursor-pointer ${
                  icon === item
                    ? 'bg-cat-500 text-white shadow-xs scale-105'
                    : 'bg-cat-50 dark:bg-stone-800 hover:bg-cat-100 dark:hover:bg-stone-700'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cat-50 dark:bg-stone-800 font-bold hover:bg-cat-100 text-stone-600 dark:text-stone-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-cat-500 hover:bg-cat-600 text-white font-bold cursor-pointer shadow-xs"
          >
            Save Habit 🐾
          </button>
        </div>
      </form>
    </Modal>
  );
};
