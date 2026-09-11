import React, { useState } from 'react';
import { RefreshCw, ExternalLink, Download, Upload, Database, CheckCircle2 } from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import { DataExportModal } from './DataExportModal';

export const GoogleSheetSync: React.FC = () => {
  const {
    sheetUrl,
    setSheetUrl,
    syncStatus,
    lastSyncTime,
    autoSync,
    setAutoSync,
    syncWithGoogleSheet,
  } = useTaskStore();

  const [inputUrl, setInputUrl] = useState(sheetUrl);
  const [showExportModal, setShowExportModal] = useState(false);

  const handleSaveUrl = () => {
    setSheetUrl(inputUrl);
    alert('Sheet URL updated!');
  };

  const integrations = [
    {
      name: 'Master Task Tracker Google Sheet',
      desc: 'Live dynamic sync with the sheet updated by Gemini Spark background runs',
      status: syncStatus,
      icon: '📊',
      active: true,
    },
    {
      name: 'Augsburg MSW Moodle & Calendar',
      desc: 'Clinical courses, seminars, and forum assignment deadlines',
      status: 'Active (Augsburg Feed)',
      icon: '🎓',
      active: true,
    },
    {
      name: 'CARE Counseling Practicum',
      desc: 'Orientation, Mendota Heights training, supervision w/ Micalah',
      status: 'Active (CARE Feed)',
      icon: '🏥',
      active: true,
    },
    {
      name: 'Universal Home Health Care (UHHC)',
      desc: 'Bi-weekly payroll milestones and clinical field shifts',
      status: 'Active (UHHC Feed)',
      icon: '💼',
      active: true,
    },
    {
      name: 'Personal & Pet Wellness Tracker',
      desc: 'Rent, Banfield pet hospital care for Lemon & Stain, bills',
      status: 'Active (Bills Feed)',
      icon: '🐾',
      active: true,
    },
  ];

  return (
    <div className="bg-white/90 dark:bg-[#1E1B24]/90 backdrop-blur-md p-6 rounded-3xl border border-cat-200/80 dark:border-stone-800 shadow-cozy dark:shadow-stain space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-cozy text-stone-900 dark:text-stone-100">
            Live Dynamic Sync & Data Feeds
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Connected to your Master Google Sheet, SQLite backend persistence, and personal feeds.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowExportModal(true)}
            className="px-3.5 py-2 rounded-2xl bg-cat-50 dark:bg-stone-800 hover:bg-cat-100 dark:hover:bg-stone-700 border border-cat-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Database className="w-3.5 h-3.5 text-cat-600 dark:text-cat-400" />
            <span>Import / Export CSV</span>
          </button>

          <button
            onClick={() => syncWithGoogleSheet(true)}
            className="px-4 py-2 rounded-2xl bg-cat-500 hover:bg-cat-600 text-white text-xs font-bold shadow-cozy transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Sheet Now</span>
          </button>
        </div>
      </div>

      {/* Dynamic Google Sheet Connection Box */}
      <div className="p-5 rounded-3xl bg-cat-50/60 dark:bg-stone-800/50 border border-cat-200/80 dark:border-stone-700/80 space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📊</span>
            <div>
              <h3 className="text-sm font-bold text-cat-900 dark:text-cat-300">
                Google Sheet Dynamic Feed Connection
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Status: <span className="font-bold text-cat-600 dark:text-cat-400">{syncStatus}</span>{' '}
                {lastSyncTime && `• Last Synced: ${lastSyncTime}`}
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-stone-600 dark:text-stone-300 cursor-pointer">
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="rounded text-cat-500 focus:ring-cat-400 accent-cat-500"
            />
            <span>Auto-sync on page load</span>
          </label>
        </div>

        <div>
          <label className="text-[11px] font-bold text-stone-600 dark:text-stone-400 block mb-1">
            Connected Sheet CSV / Web Feed URL:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Google Sheet CSV Export or Published Web URL"
              className="flex-1 text-xs p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-cat-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-cat-400 font-mono"
            />
            <button
              onClick={handleSaveUrl}
              className="px-4 py-2 rounded-xl bg-cat-100 dark:bg-stone-700 hover:bg-cat-200 dark:hover:bg-stone-600 text-cat-800 dark:text-cat-200 text-xs font-bold cursor-pointer transition-all"
            >
              Save URL
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 pt-1 flex-wrap gap-2">
          <span>
            💡 Target: <strong>Personal Dashboard - Master Task Tracker</strong>
          </span>
          <a
            href="https://docs.google.com/spreadsheets/d/14KDi1BMtDPFdYsReC31bNAj-uU3CR0VvcUXVg1XR-lE/edit"
            target="_blank"
            rel="noreferrer"
            className="text-cat-600 dark:text-cat-400 font-bold hover:underline flex items-center gap-1"
          >
            <span>Open Google Sheet in Drive</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Feed Status List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl border border-cat-100/80 dark:border-stone-800 bg-cat-50/40 dark:bg-stone-800/30 flex items-start gap-3.5 shadow-2xs"
          >
            <div className="text-2xl p-2 rounded-2xl bg-white dark:bg-stone-800 shadow-2xs">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs sm:text-sm font-bold truncate text-stone-800 dark:text-stone-100">
                  {item.name}
                </h4>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 shrink-0 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>{item.status}</span>
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Explanatory Note */}
      <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
        🐾 <strong>Automated Background Sync Notice:</strong> When Gemini Spark processes emails or LMS notices in the background, it adds new tasks directly to your Master Google Sheet. Whenever you load or refresh your personal dashboard, it reconciles the newest tasks while keeping all your local completion stamps intact!
      </div>

      <DataExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  );
};
