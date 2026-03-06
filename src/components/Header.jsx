import React from 'react';
import { APP_VERSION } from '../lib/utils.js';

const STEPS = [
  { n: 1, label: 'Audio' },
  { n: 2, label: 'Sync' },
  { n: 3, label: 'Ajusta' },
  { n: 4, label: 'Export' },
];

export default function Header({ step, projectName, onOpenProjects, onSaveProject }) {
  return (
    <header className="app-header">
      <div className="logo">
        <span className="logo-icon">🎤</span>
        Makereoke
        <span className="version-badge">v{APP_VERSION}</span>
      </div>

      <div className="header-right">
        {projectName && (
          <div className="project-indicator">
            <span className="project-indicator-dot" />
            <span className="project-indicator-name" id="currentProjectName">{projectName}</span>
            <button className="btn btn-ghost proj-save-btn" onClick={onSaveProject}>
              💾 Guardar
            </button>
          </div>
        )}

        <button className="btn btn-ghost" onClick={onOpenProjects} style={{ fontSize: '0.85rem' }}>
          📁 Proyectos
        </button>

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
