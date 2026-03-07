import React from 'react';
import { PROJECT_INFO, CHANGELOG } from '../lib/changelog.js';
import { APP_VERSION } from '../lib/utils.js';

const TYPE_META = {
  new:     { icon: '✨', label: 'Nuevo' },
  improve: { icon: '🔧', label: 'Mejora' },
  fix:     { icon: '🐛', label: 'Fix' },
  visual:  { icon: '🎨', label: 'Visual' },
  mobile:  { icon: '📱', label: 'Móvil' },
};

function formatDate(dateStr) {
  const months = [
    'enero','febrero','marzo','abril','mayo','junio',
    'julio','agosto','septiembre','octubre','noviembre','diciembre',
  ];
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parseInt(parts[2])} de ${months[parseInt(parts[1]) - 1]} de ${parts[0]}`;
  }
  if (parts.length === 2) {
    return `${months[parseInt(parts[1]) - 1]} de ${parts[0]}`;
  }
  return dateStr;
}

export default function ChangelogModal({ onClose }) {
  // Close on overlay click (but not on modal itself)
  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  // Close on Escape key
  React.useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="cl-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className="cl-modal">

        {/* ── Header ── */}
        <div className="cl-header">
          <div className="cl-header-left">
            <span className="cl-logo-icon">🎤</span>
            <div className="cl-header-info">
              <h2 className="cl-title">{PROJECT_INFO.name}</h2>
              <p className="cl-desc">{PROJECT_INFO.description}</p>
            </div>
          </div>
          <button className="cl-close-btn" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        {/* ── Project meta ── */}
        <div className="cl-meta">
          <div className="cl-meta-item">
            <span className="cl-meta-icon">👤</span>
            <span>Creado por <strong>{PROJECT_INFO.author}</strong></span>
          </div>
          <div className="cl-meta-item">
            <span className="cl-meta-icon">📅</span>
            <span>Última actualización: <strong>{formatDate(PROJECT_INFO.lastUpdate)}</strong></span>
          </div>
          <div className="cl-meta-item">
            <span className="cl-meta-icon">🏷️</span>
            <span>Versión: <strong>v{APP_VERSION}</strong></span>
          </div>
        </div>

        {/* ── Changelog entries ── */}
        <div className="cl-list">
          {CHANGELOG.map(entry => {
            const isCurrent = entry.version === APP_VERSION;
            return (
              <div key={entry.version} className={`cl-entry${isCurrent ? ' cl-entry-current' : ''}`}>
                <div className="cl-entry-header">
                  <span className="cl-version">v{entry.version}</span>
                  {isCurrent && <span className="cl-current-tag">Actual</span>}
                  <span className="cl-date">{formatDate(entry.date)}</span>
                </div>
                <ul className="cl-changes">
                  {entry.changes.map((c, i) => {
                    const meta = TYPE_META[c.type] ?? TYPE_META.improve;
                    return (
                      <li key={i} className={`cl-change cl-change-${c.type}`}>
                        <span className="cl-change-icon" title={meta.label}>{meta.icon}</span>
                        <span className="cl-change-text">{c.text}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        {/* ── Footer ── */}
        <div className="cl-footer">
          Hecho con ❤️ por {PROJECT_INFO.author} &mdash; Makereoke &copy; {new Date().getFullYear()}
        </div>

      </div>
    </div>
  );
}
