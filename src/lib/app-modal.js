/* ============================================================
   app-modal.js — Lightweight app-styled modal (no React deps)
   Provides: AppModal.alert(), AppModal.confirm(), AppModal.prompt()
   All return Promises so they can be awaited.
   ============================================================ */

const AppModal = (() => {
  /* ── Inject styles once ── */
  function _ensureStyles() {
    if (document.getElementById('app-modal-style')) return;
    const s = document.createElement('style');
    s.id = 'app-modal-style';
    s.textContent = `
.apm-overlay {
  position: fixed; inset: 0; z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.72);
  backdrop-filter: blur(4px);
  animation: apm-fade-in 0.15s ease;
}
@keyframes apm-fade-in { from { opacity:0 } to { opacity:1 } }
.apm-box {
  background: #1e1e3e;
  border: 1px solid #3e3e7c;
  border-radius: 14px;
  box-shadow: 0 8px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,77,255,0.15);
  padding: 28px 32px 22px;
  min-width: 320px;
  max-width: min(92vw, 480px);
  animation: apm-slide-up 0.18s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes apm-slide-up { from { transform:translateY(16px); opacity:0 } to { transform:translateY(0); opacity:1 } }
.apm-icon { font-size: 2rem; margin-bottom: 8px; display: block; text-align: center; }
.apm-title {
  font-size: 1.05rem; font-weight: 700; color: #eeeeff;
  text-align: center; margin-bottom: 10px; line-height: 1.35;
}
.apm-msg {
  font-size: 0.9rem; color: #9999cc;
  text-align: center; margin-bottom: 20px; line-height: 1.5;
  white-space: pre-line;
}
.apm-input {
  width: 100%; box-sizing: border-box;
  background: #12122a; border: 1px solid #3e3e7c; border-radius: 8px;
  color: #eeeeff; font-size: 0.95rem; padding: 9px 12px;
  outline: none; margin-bottom: 18px;
  transition: border-color 0.15s;
}
.apm-input:focus { border-color: #7c4dff; box-shadow: 0 0 0 2px rgba(124,77,255,0.2); }
.apm-btns { display: flex; gap: 10px; justify-content: center; }
.apm-btn {
  flex: 1; padding: 9px 18px; border-radius: 8px; border: none;
  font-size: 0.9rem; font-weight: 600; cursor: pointer;
  transition: filter 0.15s, transform 0.1s;
}
.apm-btn:hover { filter: brightness(1.12); }
.apm-btn:active { transform: scale(0.97); }
.apm-btn-primary { background: #7c4dff; color: #fff; }
.apm-btn-secondary { background: #2a2a56; color: #9999cc; border: 1px solid #3e3e7c; }
.apm-btn-danger { background: #ff1744; color: #fff; }
.apm-btn-warn { background: #FFD700; color: #111; }
    `;
    document.head.appendChild(s);
  }

  /* ── Core builder ── */
  function _open({ icon = '', title = '', message = '', inputDefault = null, buttons = [] }) {
    _ensureStyles();
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'apm-overlay';

      const box = document.createElement('div');
      box.className = 'apm-box';

      if (icon) {
        const ic = document.createElement('span');
        ic.className = 'apm-icon'; ic.textContent = icon;
        box.appendChild(ic);
      }

      if (title) {
        const t = document.createElement('div');
        t.className = 'apm-title'; t.textContent = title;
        box.appendChild(t);
      }

      if (message) {
        const m = document.createElement('div');
        m.className = 'apm-msg'; m.textContent = message;
        box.appendChild(m);
      }

      let inputEl = null;
      if (inputDefault !== null) {
        inputEl = document.createElement('input');
        inputEl.type = 'text';
        inputEl.className = 'apm-input';
        inputEl.value = inputDefault;
        inputEl.placeholder = 'Escribe aquí...';
        box.appendChild(inputEl);
      }

      const btnsRow = document.createElement('div');
      btnsRow.className = 'apm-btns';

      function _close(val) {
        overlay.remove();
        resolve(val);
      }

      buttons.forEach(({ label, value, style = 'primary' }) => {
        const btn = document.createElement('button');
        btn.className = `apm-btn apm-btn-${style}`;
        btn.textContent = label;
        btn.addEventListener('click', () => {
          const v = inputEl !== null ? inputEl.value : value;
          _close(v);
        });
        btnsRow.appendChild(btn);
      });

      box.appendChild(btnsRow);
      overlay.appendChild(box);
      document.body.appendChild(overlay);

      // Close on overlay backdrop click
      overlay.addEventListener('click', e => {
        if (e.target === overlay) _close(inputDefault !== null ? null : false);
      });

      // Keyboard
      overlay.addEventListener('keydown', e => {
        if (e.key === 'Escape') { _close(inputDefault !== null ? null : false); }
        if (e.key === 'Enter' && inputEl !== null) { _close(inputEl.value); }
      });

      // Focus
      requestAnimationFrame(() => {
        if (inputEl) inputEl.focus();
        else { const primary = btnsRow.querySelector('.apm-btn-primary, .apm-btn-warn'); if (primary) primary.focus(); }
      });
    });
  }

  /* ── Public API ── */

  /** Shows an info/success/error notice. Returns Promise<void>. */
  function alert(message, { title = 'Aviso', icon = 'ℹ️', btnLabel = 'Aceptar', btnStyle = 'primary' } = {}) {
    return _open({
      icon, title, message,
      buttons: [{ label: btnLabel, value: true, style: btnStyle }],
    });
  }

  /** Shows a confirm dialog. Returns Promise<boolean>. */
  function confirm(message, { title = '¿Confirmar?', icon = '❓', confirmLabel = 'Confirmar', confirmStyle = 'primary', cancelLabel = 'Cancelar' } = {}) {
    return _open({
      icon, title, message,
      buttons: [
        { label: cancelLabel,  value: false, style: 'secondary' },
        { label: confirmLabel, value: true,  style: confirmStyle },
      ],
    });
  }

  /** Shows an input prompt. Returns Promise<string|null> (null = cancelled). */
  function prompt(message, defaultValue = '', { title = '', icon = '✏️', confirmLabel = 'Aceptar', cancelLabel = 'Cancelar' } = {}) {
    return _open({
      icon, title, message,
      inputDefault: defaultValue,
      buttons: [
        { label: cancelLabel,  value: null,  style: 'secondary' },
        { label: confirmLabel, value: true,  style: 'primary'   },
      ],
    });
  }

  return { alert, confirm, prompt };
})();

export default AppModal;
