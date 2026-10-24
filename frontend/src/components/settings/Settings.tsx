import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Loader2, LogOut, RefreshCw, Upload } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useAuth } from '../../store/auth';
import { useTasks } from '../../store/tasks';
import { MODE_LABEL, TimerMode, useTimer } from '../../store/timer';
import { toast } from '../../store/toast';
import { MotionMode, ThemeMode, useUi } from '../../store/ui';
import type { User } from '../../types';
import { Segmented } from '../ui/Segmented';

const Card: React.FC<{ title: string; blurb?: string; children: React.ReactNode; i: number }> = ({ title, blurb, children, i }) => (
  <motion.section
    className="pane p-6"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
  >
    <h2 className="heading text-2xl">{title}</h2>
    {blurb && <p className="mt-1 text-sm text-ink-soft">{blurb}</p>}
    <div className="mt-5 space-y-5">{children}</div>
  </motion.section>
);

const Row: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <p className="text-sm font-medium text-ink">{label}</p>
      {hint && <p className="text-xs text-ink-faint">{hint}</p>}
    </div>
    {children}
  </div>
);

export const Settings: React.FC = () => {
  const ui = useUi();
  const { user, setUser, logout } = useAuth();
  const timer = useTimer();
  const tasks = useTasks();
  const [name, setName] = useState(user?.display_name ?? '');
  const [url, setUrl] = useState(tasks.sheetUrl);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwBusy, setPwBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const saveName = async () => {
    if (!name.trim() || name.trim() === user?.display_name) return;
    try {
      setUser(await api.put<User>('/auth/profile', { display_name: name.trim() }));
      toast.success('Name updated.');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next.length < 10) return toast.error('Use at least 10 characters for the new password.');
    if (pw.next !== pw.confirm) return toast.error("The new passwords don't match.");
    setPwBusy(true);
    try {
      await api.post('/auth/password', { current_password: pw.current, new_password: pw.next });
      setPw({ current: '', next: '', confirm: '' });
      toast.success('Password changed. Other devices were signed out.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 pb-24 pt-28 sm:px-8">
      <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="heading text-5xl">
        Settings
      </motion.h1>

      <Card title="Look and feel" i={0}>
        <Row label="Lighting" hint="Follow the clock switches to night at 7pm.">
          <Segmented<ThemeMode>
            label="Lighting"
            size="sm"
            value={ui.theme}
            onChange={ui.setTheme}
            options={[
              { value: 'day', label: 'Lemon Sunlight' },
              { value: 'night', label: 'Stain Nocturne' },
              { value: 'auto', label: 'Follow the clock' },
            ]}
          />
        </Row>
        <Row label="Animation" hint="Calm keeps the room still and skips the parades.">
          <Segmented<MotionMode>
            label="Animation"
            size="sm"
            value={ui.motion}
            onChange={ui.setMotion}
            options={[
              { value: 'full', label: 'Full' },
              { value: 'calm', label: 'Calm' },
              { value: 'system', label: 'Match device' },
            ]}
          />
        </Row>
        <Row label="Sound effects" hint="Chimes, purrs and the focus bell.">
          <Segmented<'on' | 'off'>
            label="Sound"
            size="sm"
            value={ui.sound ? 'on' : 'off'}
            onChange={(v) => ui.setSound(v === 'on')}
            options={[
              { value: 'on', label: 'On' },
              { value: 'off', label: 'Off' },
            ]}
          />
        </Row>
      </Card>

      <Card title="You" i={1}>
        <Row label="Name in the greeting">
          <input className="field !w-56" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => void saveName()} maxLength={100} />
        </Row>
      </Card>

      <Card title="Focus timer" blurb="Every fourth focus sprint is followed by a long nap." i={2}>
        {(['focus', 'short', 'long'] as TimerMode[]).map((m) => (
          <Row key={m} label={MODE_LABEL[m]}>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="number"
                min={1}
                max={120}
                className="field !w-20 text-center"
                value={timer.minutes[m]}
                onChange={(e) => timer.setMinutes(m, Number(e.target.value) || 1)}
              />
              minutes
            </label>
          </Row>
        ))}
      </Card>

      <Card title="Google Sheet sync" blurb="Pull tasks from your Master Task Tracker (File → Share → Publish to web → CSV)." i={3}>
        <div className="flex gap-2">
          <input className="field" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://docs.google.com/…/pub?output=csv" aria-label="Published sheet CSV link" />
          <button
            type="button"
            className="btn-ghost shrink-0"
            onClick={() => {
              tasks.setSheetUrl(url.trim());
              toast.success('Sheet link saved.');
            }}
            disabled={url.trim() === tasks.sheetUrl}
          >
            Save link
          </button>
        </div>
        <Row label="Sync when the dashboard opens">
          <Segmented<'on' | 'off'>
            label="Auto sync"
            size="sm"
            value={tasks.autoSync ? 'on' : 'off'}
            onChange={(v) => tasks.setAutoSync(v === 'on')}
            options={[
              { value: 'on', label: 'On' },
              { value: 'off', label: 'Off' },
            ]}
          />
        </Row>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-honey" onClick={() => void tasks.syncSheet(true)} disabled={tasks.syncState === 'syncing'}>
            {tasks.syncState === 'syncing' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sync now
          </button>
          <a className="btn-ghost" href="/api/sync/export-csv" download>
            <Download className="h-4 w-4" /> Export tasks as CSV
          </a>
          <button type="button" className="btn-ghost" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> Import a CSV
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void tasks.uploadCsv(f);
              e.target.value = '';
            }}
          />
          {tasks.lastSync && <span className="text-xs text-ink-faint">Last synced {tasks.lastSync}</span>}
        </div>
      </Card>

      <Card title="Password" blurb="Changing it signs out every other browser." i={4}>
        <form className="grid gap-3 sm:grid-cols-3" onSubmit={changePassword}>
          <input type="password" autoComplete="current-password" className="field" placeholder="Current password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required />
          <input type="password" autoComplete="new-password" className="field" placeholder="New (10+ characters)" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required minLength={10} />
          <input type="password" autoComplete="new-password" className="field" placeholder="Repeat new password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required />
          <div className="flex items-center justify-between sm:col-span-3">
            <button type="button" className="btn-ghost" onClick={() => void logout()}>
              <LogOut className="h-4 w-4" /> Sign out
            </button>
            <button type="submit" className="btn-honey" disabled={pwBusy}>
              {pwBusy && <Loader2 className="h-4 w-4 animate-spin" />} Change password
            </button>
          </div>
        </form>
      </Card>

      <Card title="Keyboard shortcuts" i={5}>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          {[
            ['Ctrl/⌘ K', 'Quick actions and search'],
            ['N', 'New task'],
            ['F', 'Start or pause the focus timer'],
            ['L', 'Switch between day and night'],
            ['1 / 2 / 3', 'Journal, Insights, Settings'],
          ].map(([k, v]) => (
            <React.Fragment key={k}>
              <dt>
                <kbd className="rounded-md bg-ink/10 px-2 py-0.5 text-xs text-ink">{k}</kbd>
              </dt>
              <dd className="text-ink-soft">{v}</dd>
            </React.Fragment>
          ))}
        </dl>
      </Card>
    </div>
  );
};
