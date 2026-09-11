import React from 'react';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { CalendarEvent } from '../../types';
import { Badge } from '../common/Badge';

interface AgendaListProps {
  events: CalendarEvent[];
  onOpenFull?: () => void;
  onDelete?: (id: number) => void;
}

export const AgendaList: React.FC<AgendaListProps> = ({ events, onOpenFull, onDelete }) => {
  return (
    <div className="bg-white/90 dark:bg-[#1E1B24]/90 backdrop-blur-md p-6 rounded-3xl border border-cat-200/80 dark:border-stone-800 shadow-cozy dark:shadow-stain space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cat-500" />
          <h2 className="text-lg font-bold font-cozy text-stone-900 dark:text-stone-100">
            Upcoming Commitments
          </h2>
        </div>
        {onOpenFull && (
          <button
            onClick={onOpenFull}
            className="text-xs font-bold text-cat-600 dark:text-cat-400 hover:underline cursor-pointer"
          >
            Full View →
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {events.length === 0 ? (
          <div className="text-center py-6 text-xs text-stone-400">
            <p className="text-xl mb-1">🐾</p>
            <p>No upcoming commitments scheduled.</p>
          </div>
        ) : (
          events.slice(0, 5).map((ev) => (
            <div
              key={ev.id}
              className="p-3.5 rounded-2xl bg-cat-50/50 dark:bg-stone-800/40 border-l-4 border-l-cat-500 border border-cat-100/80 dark:border-stone-800/80 space-y-1 transition-all hover:border-cat-300"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base">{ev.icon || '📅'}</span>
                  <h4 className="text-xs sm:text-sm font-bold truncate text-stone-800 dark:text-stone-100">
                    {ev.title}
                  </h4>
                </div>

                <Badge variant="stone" size="sm">
                  {ev.category}
                </Badge>
              </div>

              <div className="flex items-center gap-3 text-[10px] text-stone-500 dark:text-stone-400 flex-wrap">
                <span className="flex items-center gap-1 font-semibold text-cat-700 dark:text-cat-400">
                  <Clock className="w-3 h-3" />
                  <span>{ev.time}</span>
                </span>

                <span>• {ev.date}</span>

                {ev.location && (
                  <span className="flex items-center gap-1 text-stone-400 truncate max-w-[200px]">
                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                    <span>{ev.location}</span>
                  </span>
                )}
              </div>

              {onDelete && (
                <div className="text-right pt-0.5">
                  <button
                    onClick={() => onDelete(ev.id)}
                    className="text-[10px] text-stone-400 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    Delete event
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
