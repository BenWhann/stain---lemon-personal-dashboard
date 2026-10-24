import React, { useState } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { errorMessage } from '../../lib/api';
import { useAuth } from '../../store/auth';
import { CatHead } from '../../art/CatHead';
import { COATS, CoatName } from '../../art/coats';
import { BrandMark } from '../layout/TopBar';

/** A cat peeking over the card. Paws come up over the eyes while a password is typed. */
const Peeker: React.FC<{ coat: CoatName; look: number; shy: boolean; side: 'l' | 'r' }> = ({ coat, look, shy, side }) => {
  const c = COATS[coat];
  return (
    <svg viewBox="-60 -72 120 100" className="h-28 w-32" aria-hidden="true">
      <CatHead coat={c} eyes={shy ? 'closed' : 'open'} look={{ x: look, y: 0.5 }} blinkDelay={side === 'l' ? 0.4 : 2.6} />
      {[-19, 19].map((x) => (
        <motion.g key={x} initial={false} animate={{ y: shy ? -26 : 0 }} transition={{ type: 'spring', stiffness: 260, damping: 18, delay: x > 0 ? 0.05 : 0 }}>
          <ellipse cx={x} cy={26} rx={13} ry={10} fill={coat === 'lemon' ? c.white : c.base} />
          <path d={`M${x - 5},${20} L${x - 5},${25} M${x},${19} L${x},${25} M${x + 5},${20} L${x + 5},${25}`} stroke="#000" strokeOpacity={0.2} strokeWidth={1.2} strokeLinecap="round" />
        </motion.g>
      ))}
    </svg>
  );
};

export const LoginScreen: React.FC = () => {
  const { login, accountExists } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focus, setFocus] = useState<'user' | 'pass' | null>(null);
  const shake = useAnimationControls();

  // Pupils track the end of the username as it grows
  const look = focus === 'user' ? Math.min(1, -0.8 + username.length * 0.09) : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(errorMessage(err, "Couldn't sign in."));
      setPassword('');
      void shake.start({ x: [0, -12, 10, -6, 4, 0], transition: { duration: 0.45 } });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative z-10 grid min-h-[100svh] place-items-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm"
      >
        <div className="pointer-events-none absolute inset-x-0 -top-[5.6rem] flex justify-center gap-6">
          <Peeker coat="lemon" look={look} shy={focus === 'pass'} side="l" />
          <Peeker coat="stain" look={look} shy={focus === 'pass'} side="r" />
        </div>
        <motion.form animate={shake} onSubmit={submit} className="pane-solid relative p-8" aria-labelledby="login-title">
          <div className="mb-6 flex items-center gap-3">
            <BrandMark className="h-10 w-10" />
            <div>
              <h1 id="login-title" className="heading text-3xl leading-none">
                Welcome back
              </h1>
              <p className="mt-1 text-sm text-ink-soft">Lemon and Stain kept your seat warm.</p>
            </div>
          </div>
          <label className="block space-y-1.5">
            <span className="label">Username</span>
            <input
              className="field"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setFocus('user')}
              onBlur={() => setFocus(null)}
              required
              autoFocus
            />
          </label>
          <label className="mt-4 block space-y-1.5">
            <span className="label">Password</span>
            <input
              className="field"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocus('pass')}
              onBlur={() => setFocus(null)}
              required
            />
          </label>
          {error && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} role="alert" className="mt-4 rounded-xl bg-ember/15 px-3 py-2 text-sm text-ember">
              {error}
            </motion.p>
          )}
          {!accountExists && (
            <p className="mt-4 rounded-xl bg-honey/15 px-3 py-2 text-sm text-ink-soft">
              No account exists yet. Set ADMIN_PASSWORD in the server's .env file and restart it.
            </p>
          )}
          <button type="submit" className="btn-honey mt-6 h-11 w-full text-base" disabled={busy || !username || !password}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in
          </button>
        </motion.form>
      </motion.div>
    </main>
  );
};
