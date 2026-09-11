import React from 'react';
import { Search } from 'lucide-react';

interface TaskFilterProps {
  category: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const TaskFilter: React.FC<TaskFilterProps> = ({
  category,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}) => {
  const categories = [
    'All',
    'Active',
    'Completed',
    'Grad School',
    'Work',
    'Bills',
    'Personal',
  ];

  return (
    <div className="space-y-2.5">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks, courses, or notes..."
          className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-cat-50/60 dark:bg-stone-800/60 border border-cat-200/80 dark:border-stone-700/80 text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-cat-400 transition-all"
        />
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 text-xs font-bold">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`px-3 py-1 rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
              category === cat
                ? 'bg-cat-500 text-white shadow-xs'
                : 'bg-cat-50/80 dark:bg-stone-800/80 text-stone-600 dark:text-stone-400 hover:bg-cat-100 dark:hover:bg-stone-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
};
