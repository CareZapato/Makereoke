import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import '../css/styles.css';

console.log('[Karaoke Video Maker] main.jsx cargado');

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    console.error('[Karaoke Video Maker] Error capturado por ErrorBoundary:', error);
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'monospace', background: '#0d0a2e', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
          <h2 style={{ color: '#FFD700', margin: 0 }}>⚠️ Error al cargar la aplicación</h2>
          <pre style={{ color: '#ff6b6b', overflow: 'auto', background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', maxWidth: '100%' }}>{String(this.state.error)}</pre>
          <button onClick={() => window.location.reload()} style={{ alignSelf: 'flex-start', padding: '8px 20px', cursor: 'pointer', background: '#7c4dff', border: 'none', color: '#fff', borderRadius: '6px', fontSize: '1rem' }}>
            🔄 Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootEl = document.getElementById('root');
console.log('[Karaoke Video Maker] #root encontrado:', !!rootEl);

ReactDOM.createRoot(rootEl).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

console.log('[Karaoke Video Maker] ReactDOM.createRoot render llamado');
