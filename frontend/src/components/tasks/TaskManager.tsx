import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, RefreshCw } from 'lucide-react';
import { TaskItem } from './TaskItem';
import { TaskFilter } from './TaskFilter';
import { useTaskStore } from '../../store/useTaskStore';
import { TaskPriority } from '../../types';

export const TaskManager: React.FC = () => {
  const {
    tasks,
    filterCategory,
    setFilterCategory,
    searchQuery,
    setSearchQuery,
    addTask,
    toggleTask,
    deleteTask,
    syncWithGoogleSheet,
  } = useTaskStore();

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Grad School');
  const [newPriority, setNewPriority] = useState<TaskPriority>('Purr-fect');
  const [newDue, setNewDue] = useState('2026-09-04');
  const [newSource, setNewSource] = useState('Manual');

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await addTask({
      title: newTitle.trim(),
      category: newCategory,
      priority: newPriority,
      due_date: newDue,
      source: newSource,
    });

    setNewTitle('');
    setIsAdding(false);
  };

  // Filter tasks based on category & search query
  const filteredTasks = tasks.filter((t) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchNotes = t.notes?.toLowerCase().includes(q);
      const matchSource = t.source?.toLowerCase().includes(q);
      if (!matchTitle && !matchNotes && !matchSource) return false;
    }

    // Category filter
    if (filterCategory === 'All') return true;
    if (filterCategory === 'Active') return !t.completed;
    if (filterCategory === 'Completed') return t.completed;
    return t.category === filterCategory;
  });

  const pendingCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="bg-white/90 dark:bg-[#1E1B24]/90 backdrop-blur-md p-6 rounded-3xl border border-cat-200/80 dark:border-stone-800 shadow-cozy dark:shadow-stain space-y-4">
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">📋</span>
          <h2 className="text-lg font-bold font-cozy text-stone-900 dark:text-stone-100">
            Tasks & Clinical Deadlines
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cat-100 dark:bg-stone-800 text-cat-700 dark:text-cat-300 border border-cat-200/60 dark:border-stone-700">
            {pendingCount} pending
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => syncWithGoogleSheet(true)}
            title="Pull latest tasks from Google Sheet"
            className="text-xs font-bold px-3 py-1.5 rounded-2xl bg-cat-50 dark:bg-stone-800 hover:bg-cat-100 dark:hover:bg-stone-700 border border-cat-200 dark:border-stone-700 text-cat-700 dark:text-cat-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-3 h-3 text-cat-600 dark:text-cat-400" />
            <span>Sync Sheet</span>
          </button>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="text-xs font-bold px-3.5 py-1.5 rounded-2xl bg-cat-500 hover:bg-cat-600 text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{isAdding ? 'Cancel' : 'Add Task'}</span>
          </button>
        </div>
      </div>

      {/* Task Filter */}
      <TaskFilter
        category={filterCategory}
        onSelectCategory={setFilterCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Quick Add Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreateTask}
            className="p-4 rounded-2xl bg-cat-50/70 dark:bg-stone-800/60 border border-cat-200/80 dark:border-stone-700/80 space-y-3 overflow-hidden shadow-2xs"
          >
            <input
              type="text"
              placeholder="What needs to get done?"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-cat-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-cat-400"
              autoFocus
              required
            />

            <div className="flex flex-wrap gap-2 text-xs">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-cat-200 dark:border-stone-700 font-medium text-stone-700 dark:text-stone-200"
              >
                <option value="Grad School">🎓 Grad School (MSW)</option>
                <option value="Work">💼 Work / Practicum</option>
                <option value="Bills">💳 Bills</option>
                <option value="Personal">🏡 Personal</option>
              </select>

              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-cat-200 dark:border-stone-700 font-medium text-stone-700 dark:text-stone-200"
              >
                <option value="Zoomies">⚡ Zoomies (High)</option>
                <option value="Purr-fect">🐾 Purr-fect (Medium)</option>
                <option value="Catnap">💤 Catnap (Low)</option>
              </select>

              <input
                type="date"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-cat-200 dark:border-stone-700 text-stone-700 dark:text-stone-200"
              />

              <input
                type="text"
                placeholder="Source (e.g. Augsburg, CARE)"
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-cat-200 dark:border-stone-700 text-stone-700 dark:text-stone-200"
              />

              <button
                type="submit"
                className="ml-auto px-4 py-1.5 rounded-xl bg-cat-500 hover:bg-cat-600 text-white font-bold cursor-pointer transition-all shadow-xs"
              >
                Save Task 🐾
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Task List */}
      <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-10 text-xs text-stone-400 dark:text-stone-500 space-y-1">
            <p className="text-3xl">😺</p>
            <p className="font-bold text-stone-600 dark:text-stone-300">All caught up!</p>
            <p>Time for a cozy catnap with Lemon & Stain.</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={toggleTask}
              onDelete={deleteTask}
            />
          ))
        )}
      </div>
    </div>
  );
};
