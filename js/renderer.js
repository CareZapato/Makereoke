/* ============================================================
   renderer.js — Canvas karaoke video renderer
   Draws: background, song title, previous/current/next lyrics,
   progress bar, animated glow on active line.
   ============================================================ */

const Renderer = (() => {

  /* ── THEMES ── */
  const THEMES = {
    classic: {
      bg: (ctx, W, H, t) => {
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#0d0a2e');
        grad.addColorStop(1, '#1a0540');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        // Subtle star dots
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        _drawStars(ctx, W, H, 120);
      },
      textActive: '#FFD700',
      textDim: 'rgba(255,255,255,0.65)',
      textPrev: 'rgba(255,255,255,0.22)',
      progressBg: 'rgba(255,255,255,0.12)',
      progressFg: '#7c4dff',
      shadowActive: 'rgba(255,215,0,0.6)',
    },
    neon: {
      bg: (ctx, W, H) => {
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, W, H);
        _drawGridLines(ctx, W, H);
      },
      textActive: '#00fff7',
      textDim: 'rgba(200,200,255,0.7)',
      textPrev: 'rgba(200,200,255,0.2)',
      progressBg: 'rgba(0,255,247,0.1)',
      progressFg: '#00fff7',
      shadowActive: 'rgba(0,255,247,0.8)',
    },
    fire: {
      bg: (ctx, W, H, t) => {
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#0a0000');
        grad.addColorStop(0.5, '#2a0800');
        grad.addColorStop(1, '#1a0000');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        _drawEmbers(ctx, W, H, t);
      },
      textActive: '#ff6600',
      textDim: 'rgba(255,180,100,0.7)',
      textPrev: 'rgba(255,180,100,0.22)',
      progressBg: 'rgba(255,100,0,0.1)',
      progressFg: '#ff6600',
      shadowActive: 'rgba(255,120,0,0.8)',
    },
    ocean: {
      bg: (ctx, W, H, t) => {
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#000d1a');
        grad.addColorStop(1, '#002244');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        _drawWaves(ctx, W, H, t);
      },
      textActive: '#00d4ff',
      textDim: 'rgba(160,220,255,0.7)',
      textPrev: 'rgba(160,220,255,0.22)',
      progressBg: 'rgba(0,212,255,0.1)',
      progressFg: '#00d4ff',
      shadowActive: 'rgba(0,212,255,0.7)',
    },
    minimal: {
      bg: (ctx, W, H) => {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, W, H);
      },
      textActive: '#ffffff',
      textDim: 'rgba(255,255,255,0.55)',
      textPrev: 'rgba(255,255,255,0.18)',
      progressBg: 'rgba(255,255,255,0.1)',
      progressFg: '#fff',
      shadowActive: 'rgba(255,255,255,0.4)',
    },
  };

  /* ── PRIVATE BACKGROUND HELPERS ── */
  const _stars = Array.from({ length: 200 }, () => ({
    x: Math.random(), y: Math.random(), r: Math.random() * 1.5 + 0.3,
    alpha: Math.random() * 0.6 + 0.1, phase: Math.random() * Math.PI * 2,
  }));
  function _drawStars(ctx, W, H, n) {
    _stars.slice(0, n).forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }
  function _drawGridLines(ctx, W, H) {
    ctx.strokeStyle = 'rgba(0,255,247,0.07)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  }
  function _drawEmbers(ctx, W, H, t) {
    const n = 40;
    for (let i = 0; i < n; i++) {
      const seed = (i * 137.508 + t * 0.5) % (W * H);
      const x = (seed * 7) % W;
      const y = H - ((seed * 13 + t * 20 * (i % 3 + 1)) % H);
      const r = 1 + (i % 3);
      ctx.globalAlpha = 0.3 + (i % 5) * 0.1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? '#ff4400' : '#ffaa00';
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function _drawWaves(ctx, W, H, t) {
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.moveTo(0, H * 0.75 + k * 20);
      for (let x = 0; x <= W; x += 4) {
        const y = H * 0.75 + k * 20 + Math.sin(x * 0.015 + t * 0.8 + k) * 12;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      ctx.fillStyle = `rgba(0,80,140,${0.08 + k * 0.04})`;
      ctx.fill();
    }
  }

  /* ── PUBLIC API ── */

  /**
   * Draw one karaoke frame onto `canvas`.
   * @param {HTMLCanvasElement} canvas
   * @param {object} opts {
   *   time: number,
   *   duration: number,
   *   lines: [{text, time}], // sorted synced lines
   *   theme: string,
   *   fontSize: number,
   *   activeColor: string,
   *   inactiveColor: string,
   *   songTitle: string,
   *   activeColorOverride: string|null,
   *   inactiveColorOverride: string|null,
   * }
   */
  function drawFrame(canvas, opts) {
    const { time, duration, lines, theme = 'classic', fontSize = 56,
            songTitle = '', activeColorOverride, inactiveColorOverride } = opts;

    const W = canvas.width;
    const H = canvas.height;
    const ctx = canvas.getContext('2d');
    const T = THEMES[theme] || THEMES.classic;

    // Background
    T.bg(ctx, W, H, time);

    // Determine current / prev / next
    let activeIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].time <= time) activeIdx = i;
    }

    const prevLine = activeIdx > 0 ? lines[activeIdx - 1] : null;
    const currLine = activeIdx >= 0 ? lines[activeIdx] : null;
    const nextLine = activeIdx >= 0 && activeIdx < lines.length - 1 ? lines[activeIdx + 1] : null;

    const activeColor  = activeColorOverride  || T.textActive;
    const inactiveColor = inactiveColorOverride || T.textDim;

    const cx = W / 2;
    const baseFontSize = Math.round(fontSize * W / 1920); // scale with resolution
    const fsLarge = Math.max(24, baseFontSize);
    const fsMed   = Math.max(18, Math.round(fsLarge * 0.65));
    const fsSmall = Math.max(14, Math.round(fsLarge * 0.48));

    // ── Song title (top left)
    if (songTitle) {
      ctx.font = `500 ${fsSmall}px 'Segoe UI', sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.textAlign = 'left';
      ctx.fillText(songTitle, 28, 36);
    }

    // ── Progress bar (bottom)
    const pbH = Math.max(4, Math.round(H * 0.007));
    const pbY = H - pbH - 18;
    ctx.fillStyle = T.progressBg;
    ctx.beginPath(); ctx.roundRect(28, pbY, W - 56, pbH, pbH / 2); ctx.fill();

    const pct = duration > 0 ? time / duration : 0;
    const progressGrad = ctx.createLinearGradient(28, 0, W - 56, 0);
    progressGrad.addColorStop(0, T.progressFg);
    progressGrad.addColorStop(1, activeColor);
    ctx.fillStyle = progressGrad;
    const pw = (W - 56) * pct;
    if (pw > 0) { ctx.beginPath(); ctx.roundRect(28, pbY, pw, pbH, pbH / 2); ctx.fill(); }

    // Time label
    ctx.font = `300 ${fsSmall}px monospace`;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'right';
    ctx.fillText(formatTime(time) + ' / ' + formatTime(duration), W - 28, pbY - 8);

    // ── Subtitle / upcoming indicator
    const midY = H * 0.5;

    // Previous line (faint, above)
    if (prevLine) {
      ctx.font = `300 ${fsSmall}px 'Segoe UI', sans-serif`;
      ctx.fillStyle = T.textPrev;
      ctx.textAlign = 'center';
      _drawTextWithShadow(ctx, prevLine.text, cx, midY - fsLarge * 1.6, 'transparent');
    }

    // Next line (below, dimmed)
    if (nextLine) {
      ctx.font = `400 ${fsMed}px 'Segoe UI', sans-serif`;
      ctx.fillStyle = inactiveColor;
      ctx.textAlign = 'center';
      _drawTextWithShadow(ctx, nextLine.text, cx, midY + fsLarge * 1.0, 'transparent');
    }

    // Active / current line (big, glowing)
    if (currLine) {
      // Calculate progress within current line
      const lineStart = currLine.time;
      const lineEnd = nextLine ? nextLine.time : duration;
      const linePct = lineEnd > lineStart ? clamp((time - lineStart) / (lineEnd - lineStart), 0, 1) : 1;

      ctx.font = `700 ${fsLarge}px 'Segoe UI', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Glow
      ctx.shadowColor = T.shadowActive;
      ctx.shadowBlur = 24 + Math.sin(time * 4) * 6;
      ctx.fillStyle = activeColor;
      ctx.fillText(_truncate(ctx, currLine.text, W - 80), cx, midY);

      // Karaoke highlight sweep (clip left portion with bright color)
      ctx.save();
      ctx.beginPath();
      const textW = ctx.measureText(_truncate(ctx, currLine.text, W - 80)).width;
      const sweepX = cx - textW / 2 + textW * linePct;
      ctx.rect(cx - textW / 2 - 4, midY - fsLarge, sweepX - (cx - textW / 2), fsLarge * 2);
      ctx.clip();
      ctx.shadowColor = activeColor;
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(_truncate(ctx, currLine.text, W - 80), cx, midY);
      ctx.restore();

      ctx.shadowBlur = 0;
      ctx.textBaseline = 'alphabetic';
    } else {
      // Nothing playing yet
      ctx.font = `300 ${fsMed}px 'Segoe UI', sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.textAlign = 'center';
      ctx.fillText('♪ ♪ ♪', cx, midY);
    }
  }

  function _drawTextWithShadow(ctx, text, x, y, shadowColor) {
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = 8;
    ctx.fillText(text, x, y);
    ctx.shadowBlur = 0;
  }

  function _truncate(ctx, text, maxW) {
    if (ctx.measureText(text).width <= maxW) return text;
    while (text.length > 3 && ctx.measureText(text + '…').width > maxW) {
      text = text.slice(0, -1);
    }
    return text + '…';
  }

  return { drawFrame, THEMES };
})();
