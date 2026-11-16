import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, Download, FileCode, Loader2, LogOut, RefreshCw, Sparkles, Upload } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useAuth } from '../../store/auth';
import { useTasks } from '../../store/tasks';
import { MODE_LABEL, TimerMode, useTimer } from '../../store/timer';
import { toast } from '../../store/toast';
import { ThemeMode, useUi } from '../../store/ui';
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

  const [integrationStatus, setIntegrationStatus] = useState<{
    integration_configured: boolean;
    gemini_configured: boolean;
    integration_key_preview: string;
    gemini_model: string;
    webhook_url: string;
  } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [testText, setTestText] = useState('');
  const [customGeminiKey, setCustomGeminiKey] = useState('');
  const [extractBusy, setExtractBusy] = useState(false);
  const [extractResult, setExtractResult] = useState<string | null>(null);

  useEffect(() => {
    api.get<typeof integrationStatus>('/integrations/status')
      .then(setIntegrationStatus)
      .catch(() => {});
  }, []);

  const copyScript = async () => {
    try {
      const res = await fetch('/api/integrations/script', {
        headers: { 'X-Requested-With': 'lemon-stain' },
      });
      const code = await res.text();
      await navigator.clipboard.writeText(code);
      setCopiedScript(true);
      toast.success('Google Apps Script copied! Paste it into script.google.com');
      setTimeout(() => setCopiedScript(false), 3000);
    } catch {
      toast.error("Couldn't copy script to clipboard.");
    }
  };

  const copyWebhook = async () => {
    if (!integrationStatus?.webhook_url) return;
    try {
      await navigator.clipboard.writeText(integrationStatus.webhook_url);
      setCopiedWebhook(true);
      toast.success('Webhook URL copied!');
      setTimeout(() => setCopiedWebhook(false), 3000);
    } catch {
      toast.error("Couldn't copy URL.");
    }
  };

  const handleTestExtraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testText.trim()) return toast.error('Please enter or paste some text first.');
    setExtractBusy(true);
    setExtractResult(null);
    try {
      const res = await api.post<{
        success: boolean;
        has_action_items: boolean;
        summary?: string;
        message: string;
        saved_tasks: unknown[];
      }>('/integrations/extract-task', {
        content: testText.trim(),
        context: 'Manual test in Settings',
        api_key: customGeminiKey.trim() || undefined,
        auto_save: true,
        source: 'Gemini Scan',
      });
      await tasks.fetch();
      setExtractResult(res.message + (res.summary ? ` (${res.summary})` : ''));
      toast.success(`Gemini processed your text and saved ${res.saved_tasks.length} task(s)!`);
      setTestText('');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setExtractBusy(false);
    }
  };

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
        <Row label="Animation" hint="Calm mode is locked for instant, lightweight responsiveness.">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-line/20 bg-ink/[0.04] px-3 py-1.5 text-xs font-medium text-ink-soft">
            Calm (Performance Optimized)
          </span>
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

      <Card
        title="Gemini & Inbox Automation"
        blurb="Automatically scan incoming emails (Gmail) and calendar events with Gemini Pro to create tasks dynamically."
        i={4}
      >
        <div className="space-y-4 rounded-xl border border-line/20 bg-ink/[0.02] p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium text-ink">Background Scheduled Scanner</p>
              <p className="text-xs text-ink-faint">
                Runs automatically inside her Google account every 15 minutes, using Gemini Pro to extract tasks.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void copyScript()}
              className="btn-honey inline-flex items-center gap-1.5 text-xs font-semibold"
            >
              {copiedScript ? <Check className="h-3.5 w-3.5" /> : <FileCode className="h-3.5 w-3.5" />}
              {copiedScript ? 'Copied script!' : 'Copy Google Apps Script'}
            </button>
          </div>

          <div className="grid gap-2 border-t border-line/10 pt-2 text-xs text-ink-soft">
            <p className="font-semibold text-ink">How to activate in 2 minutes:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Open <a href="https://script.google.com" target="_blank" rel="noreferrer" className="underline font-medium text-honey-deep dark:text-honey">script.google.com</a> and click <strong>New project</strong>.</li>
              <li>Paste the copied script into the editor (replacing any code there).</li>
              <li>Fill in her Gemini API key (from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-medium text-honey-deep dark:text-honey">Google AI Studio</a>).</li>
              <li>Select <strong>installTrigger</strong> from the function dropdown at top and click <strong>Run</strong>. Done!</li>
            </ol>
          </div>

          {integrationStatus && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/10 pt-2 text-xs">
              <span className="text-ink-faint truncate max-w-full">
                Webhook: <code className="rounded bg-ink/[0.04] px-1 py-0.5 text-ink">{integrationStatus.webhook_url}</code>
              </span>
              <button
                type="button"
                onClick={() => void copyWebhook()}
                className="btn-ghost inline-flex items-center gap-1 px-2 py-1 text-xs"
              >
                {copiedWebhook ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copiedWebhook ? 'Copied' : 'Copy URL'}
              </button>
            </div>
          )}
        </div>

        {/* Quick interactive test tool */}
        <div className="space-y-3 pt-2">
          <div>
            <p className="text-sm font-medium text-ink">Quick Test / Instant Extraction</p>
            <p className="text-xs text-ink-faint">
              Paste an email, message, or syllabus snippet here to immediately test Gemini action item extraction.
            </p>
          </div>

          <form onSubmit={handleTestExtraction} className="space-y-2.5">
            <textarea
              className="field resize-y text-xs leading-relaxed"
              rows={3}
              placeholder="Paste email text here, e.g.: 'Hi Aretta, please review chapter 4 of the draft by Thursday and send feedback to the lab.'"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
            />

            {!integrationStatus?.gemini_configured && (
              <input
                type="password"
                className="field text-xs"
                placeholder="Optional: Gemini API Key (starts with AIzaSy...)"
                value={customGeminiKey}
                onChange={(e) => setCustomGeminiKey(e.target.value)}
              />
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="submit"
                disabled={extractBusy || !testText.trim()}
                className="btn-honey inline-flex items-center gap-1.5 text-xs"
              >
                {extractBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {extractBusy ? 'Analyzing with Gemini…' : 'Extract & Save Task'}
              </button>
              {extractResult && (
                <span className="text-xs font-medium text-sage">{extractResult}</span>
              )}
            </div>
          </form>
        </div>
      </Card>

      <Card title="Password" blurb="Changing it signs out every other browser." i={5}>
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

      <Card title="Keyboard shortcuts" i={6}>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          {[
            ['Ctrl/⌘ K', 'Quick actions and search'],
            ['N', 'New task'],
            ['F', 'Start or pause the focus timer'],
            ['L', 'Switch between day and night'],
            ['1 / 2 / 3 / 4 / 5', 'Today, Calendar, Board, Insights, Settings'],
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
