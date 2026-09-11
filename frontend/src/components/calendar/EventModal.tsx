import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { EventCategory } from '../../types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  onSave: (event: {
    title: string;
    time: string;
    date: string;
    category: EventCategory;
    location?: string;
  }) => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  defaultDate = '2026-09-03',
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState('10:00 AM - 11:30 AM');
  const [category, setCategory] = useState<EventCategory>('Academic');
  const [location, setLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      date,
      time,
      category,
      location: location.trim(),
    });

    setTitle('');
    setLocation('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🐾 Schedule New Event" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div>
          <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
            Event Title
          </label>
          <input
            type="text"
            placeholder="e.g. Field Practicum / Supervision / Class"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-cat-50/60 dark:bg-stone-800 border border-cat-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-cat-400"
            required
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-cat-50/60 dark:bg-stone-800 border border-cat-200 dark:border-stone-700 text-stone-800 dark:text-stone-100"
              required
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Time
            </label>
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="e.g. 9:00 AM - 4:00 PM"
              className="w-full p-2.5 rounded-xl bg-cat-50/60 dark:bg-stone-800 border border-cat-200 dark:border-stone-700 text-stone-800 dark:text-stone-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as EventCategory)}
              className="w-full p-2.5 rounded-xl bg-cat-50/60 dark:bg-stone-800 border border-cat-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 font-semibold"
            >
              <option value="Academic">🎓 Academic (MSW)</option>
              <option value="Work">💼 Work / Practicum</option>
              <option value="Bills">💳 Bills</option>
              <option value="Wellness">🧘‍♀️ Wellness</option>
              <option value="Personal">🏡 Personal</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Location / Link
            </label>
            <input
              type="text"
              placeholder="e.g. Hagfors 151, Lake Elmo, Zoom"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-cat-50/60 dark:bg-stone-800 border border-cat-200 dark:border-stone-700 text-stone-800 dark:text-stone-100"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cat-50 dark:bg-stone-800 font-bold hover:bg-cat-100 text-stone-600 dark:text-stone-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-cat-500 hover:bg-cat-600 text-white font-bold cursor-pointer transition-all shadow-xs"
          >
            Save Event 🐾
          </button>
        </div>
      </form>
    </Modal>
  );
};
