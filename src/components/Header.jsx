import React from 'react';
import { APP_VERSION } from '../lib/utils.js';

const STEPS = [
  { n: 1, label: 'Audio' },
  { n: 2, label: 'Sync' },
  { n: 3, label: 'Ajusta' },
  { n: 4, label: 'Export' },
];

export default function Header({ step }) {
  return (
    <header className="app-header">
      <div className="logo">
        <span className="logo-icon">🎤</span>
        <span className="logo-text">Makereoke</span>
        <span className="version-badge">v{APP_VERSION}</span>
      </div>

      <div className="header-right">
        <nav className="step-indicator">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.n}>
              <div className={`step${step === s.n ? ' active' : ''}${step > s.n ? ' done' : ''}`}>
                <div className="step-num">
                  {step > s.n ? '✓' : s.n}
                </div>
                <span className="step-label">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className="step-line" />}
            </React.Fragment>
          ))}
        </nav>
      </div>
    </header>
  );
}
