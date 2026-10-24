import React, { useState } from 'react';
import { SittingCat } from '../art/SittingCat';
import { TrotCat } from '../art/TrotCat';
import { LoafCat } from '../art/LoafCat';
import { StudyScene } from '../art/StudyScene';

/* Development-only gallery for checking the illustrations (open /?lab, /?lab=scene, /?lab=night). */
export const ArtLab: React.FC = () => {
  const mode = new URLSearchParams(location.search).get('lab');
  const [n] = useState(mode === 'night');
  if (mode === 'scene' || mode === 'night') {
    return (
      <div style={{ position: 'fixed', inset: 0 }}>
        <StudyScene night={n} calm={false} cats={{ lemonAwake: false, stainExcited: false }} onPetLemon={() => {}} onPetStain={() => {}} />
      </div>
    );
  }
  return (
    <div style={{ background: '#2b2026', minHeight: '100vh', padding: 24, display: 'flex', flexWrap: 'wrap', gap: 24 }}>
      <div style={{ background: '#e9dcc6', padding: 12 }}>
        <SittingCat coat="lemon" style={{ width: 220 }} />
      </div>
      <div style={{ background: '#e9dcc6', padding: 12 }}>
        <SittingCat coat="stain" style={{ width: 220 }} />
      </div>
      <div style={{ background: '#e9dcc6', padding: 12 }}>
        <TrotCat coat="lemon" style={{ width: 420 }} cadence={0.35} />
        <TrotCat coat="stain" style={{ width: 420 }} cadence={0.35} prance={1} />
      </div>
      <div style={{ background: '#e9dcc6', padding: 12, color: '#7a5' }}>
        <LoafCat coat="lemon" style={{ width: 300 }} />
        <LoafCat coat="stain" style={{ width: 300 }} asleep={false} />
      </div>
    </div>
  );
};
