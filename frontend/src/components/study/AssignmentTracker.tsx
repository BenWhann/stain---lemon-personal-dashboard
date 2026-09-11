import React, { useState } from 'react';
import { Plus, Trash2, GraduationCap } from 'lucide-react';
import { useNoteStore } from '../../store/useNoteStore';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';

export const AssignmentTracker: React.FC = () => {
  const { assignments, addAssignment, deleteAssignment } = useNoteStore();
  const [showModal, setShowModal] = useState(false);
  const [course, setCourse] = useState('AOCP: Individuals');
  const [prof, setProf] = useState('');
  const [name, setName] = useState('');
  const [due, setDue] = useState('2026-09-15');
  const [weight, setWeight] = useState('20%');
  const [status, setStatus] = useState('Not Started');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !course.trim()) return;

    addAssignment({
      course: course.trim(),
      prof: prof.trim(),
      name: name.trim(),
      due: due.trim(),
      weight: weight.trim(),
      status: status.trim(),
    });

    setName('');
    setProf('');
    setShowModal(false);
  };

  const getStatusBadge = (s: string) => {
    switch (s.toLowerCase()) {
      case 'completed':
        return 'emerald';
      case 'in progress':
        return 'amber';
      case 'not started':
      default:
        return 'stone';
    }
  };

  return (
    <div className="bg-white/90 dark:bg-[#1E1B24]/90 backdrop-blur-md p-6 rounded-3xl border border-cat-200/80 dark:border-stone-800 shadow-cozy dark:shadow-stain space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-cat-500" />
          <div>
            <h2 className="text-lg font-bold font-cozy text-stone-900 dark:text-stone-100">
              Augsburg MSW Course Deadlines
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Clinical Practicum & Academic Milestones
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="text-xs font-bold text-cat-600 dark:text-cat-400 hover:text-cat-700 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Assignment</span>
        </button>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-cat-100 dark:border-stone-800 text-stone-400 font-bold">
              <th className="pb-2.5 font-bold">Course</th>
              <th className="pb-2.5 font-bold">Professor</th>
              <th className="pb-2.5 font-bold">Assignment</th>
              <th className="pb-2.5 font-bold">Due Date</th>
              <th className="pb-2.5 font-bold">Weight</th>
              <th className="pb-2.5 font-bold">Status</th>
              <th className="pb-2.5 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cat-50 dark:divide-stone-800/60">
            {assignments.map((a) => (
              <tr
                key={a.id}
                className="hover:bg-cat-50/50 dark:hover:bg-stone-800/30 transition-colors"
              >
                <td className="py-3 font-bold text-cat-700 dark:text-cat-400">{a.course}</td>
                <td className="py-3 text-stone-500 dark:text-stone-400">{a.prof}</td>
                <td className="py-3 font-semibold text-stone-800 dark:text-stone-200">{a.name}</td>
                <td className="py-3 text-stone-500 dark:text-stone-400">{a.due}</td>
                <td className="py-3 font-medium text-stone-400">{a.weight}</td>
                <td className="py-3">
                  <Badge variant={getStatusBadge(a.status)} size="sm">
                    {a.status}
                  </Badge>
                </td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => deleteAssignment(a.id)}
                    className="text-stone-300 hover:text-rose-500 p-1 rounded transition-colors cursor-pointer"
                    title="Delete milestone"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="🎓 Add MSW Assignment Milestone" maxWidth="md">
        <form onSubmit={handleAdd} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Assignment Name
            </label>
            <input
              type="text"
              placeholder="e.g. Resilience Survival Guide Handbook"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-cat-50/60 dark:bg-stone-800 border border-cat-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-cat-400"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Course
              </label>
              <input
                type="text"
                placeholder="e.g. AOCP Individuals"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-cat-50/60 dark:bg-stone-800 border border-cat-200 dark:border-stone-700 text-stone-800 dark:text-stone-100"
                required
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Professor / Faculty
              </label>
              <input
                type="text"
                placeholder="e.g. Alicia Nguyen Powers"
                value={prof}
                onChange={(e) => setProf(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-cat-50/60 dark:bg-stone-800 border border-cat-200 dark:border-stone-700 text-stone-800 dark:text-stone-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-cat-50/60 dark:bg-stone-800 border border-cat-200 dark:border-stone-700 text-stone-800 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Weight
              </label>
              <input
                type="text"
                placeholder="e.g. 20%"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-cat-50/60 dark:bg-stone-800 border border-cat-200 dark:border-stone-700 text-stone-800 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-cat-50/60 dark:bg-stone-800 border border-cat-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 font-semibold"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
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
              Save Milestone 🎓
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
