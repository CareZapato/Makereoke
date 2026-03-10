import React, { useState } from 'react';
import { APP_VERSION } from '../lib/utils.js';
import logoUrl from '../logo.svg';

const STEPS = [
  { n: 1, label: 'Audio' },
  { n: 2, label: 'Sync' },
  { n: 3, label: 'Ajusta' },
  { n: 4, label: 'Export' },
];

export default function Header({ step, onShowChangelog }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <header className={`app-header${collapsed ? ' header-collapsed' : ''}`}>
      <div className="logo">
        <img src={logoUrl} alt="Makereoke" className="logo-img" />
        <button
          className="version-badge version-badge-btn"
          onClick={onShowChangelog}
          title="Ver historial de cambios"
        >
          v{APP_VERSION}
        </button>
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
        <button
          className="header-collapse-btn"
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expandir cabecera' : 'Compactar cabecera'}
          aria-label={collapsed ? 'Expandir cabecera' : 'Compactar cabecera'}
        >
          {collapsed ? '▾' : '▴'}
        </button>
      </div>
    </header>
  );
}
