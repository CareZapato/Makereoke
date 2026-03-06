/* ============================================================
   renderer.js — Canvas karaoke video renderer (ES module)
   ============================================================ */

const Renderer = (() => {

  function sr(seed) { const x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function clampN(v, mn, mx) { return v < mn ? mn : v > mx ? mx : v; }
  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  const DATA = {
    stars:  Array.from({ length: 300 }, (_, i) => ({
      x: sr(i*3),   y: sr(i*3+1), r: sr(i*3+2)*1.8+0.3,
      a: sr(i*3+3)*0.7+0.2, ph: sr(i*5)*6.28, spd: sr(i*5+1)*3+0.5,
    })),
    orbs:   Array.from({ length: 65 }, (_, i) => ({
      x: sr(i*7),   y: sr(i*7+1), hue: sr(i*7+2)*360, r: sr(i*7+3)*5+2,
      spd: sr(i*7+4)*0.028+0.007, ph: sr(i*7+5)*6.28, wob: sr(i*7+6)*0.012+0.003,
    })),
    conf:   Array.from({ length: 60 }, (_, i) => ({
      x: sr(i*11),  y: sr(i*11+1), w: sr(i*11+2)*14+5, h: sr(i*11+3)*8+3,
      hue: sr(i*11+4)*360, rot: sr(i*11+5)*6.28,
      spd: sr(i*11+6)*0.05+0.015, spin: (sr(i*11+7)-0.5)*0.08,
    })),
    mCols:  Array.from({ length: 40 }, (_, i) => ({
      xFrac: i/40, off: sr(i*3)*28, spd: sr(i*3+1)*0.9+0.3, al: sr(i*3+2)*0.4+0.15,
    })),
    shoots: Array.from({ length: 9 }, (_, i) => ({
      startFrac: sr(i*4), interval: sr(i*4+1)*9+4, x0: sr(i*4+2), y0: sr(i*4+3)*0.5,
    })),
    sparks: Array.from({ length: 110 }, (_, i) => ({
      x: sr(i*6), y: sr(i*6+1), ph: sr(i*6+2)*6.28, spd: sr(i*6+3)*4+0.8,
    })),
    prisms: Array.from({ length: 10 }, (_, i) => ({
      baseX: i/10, spread: sr(i*5)*0.12+0.06, hue: i*36,
      ph: sr(i*5+1)*6.28, spdH: sr(i*5+2)*15+8, spdX: (sr(i*5+3)-0.5)*0.06,
    })),
    noteParts: Array.from({ length: 20 }, (_, i) => ({
      x: sr(i*9+400), y: sr(i*9+401), spd: sr(i*9+402)*0.035+0.012,
      ch: ['\u266A','\u266B','\u266C','\u2669'][i%4], ph: sr(i*9+403)*6.28,
      sz: sr(i*9+404)*0.7+0.8, drift: (sr(i*9+405)-0.5)*0.018,
    })),
    embers: Array.from({ length: 38 }, (_, i) => ({
      x: sr(i*8+500), y: sr(i*8+501), spd: sr(i*8+502)*0.045+0.018,
      ph: sr(i*8+503)*6.28, hue: sr(i*8+504)*40+8,
      r: sr(i*8+505)*2+0.8, drift: (sr(i*8+506)-0.5)*0.02,
    })),
    snow: Array.from({ length: 55 }, (_, i) => ({
      x: sr(i*7+600), y: sr(i*7+601), spd: sr(i*7+602)*0.025+0.008,
      r: sr(i*7+603)*2.2+0.6, ph: sr(i*7+604)*6.28,
      drift: (sr(i*7+605)-0.5)*0.015,
    })),
  };

  const MCHARS = 'ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ012345679';

  const THEMES = {
    classic: { base: ['#0d0a2e','#160840'], textActive:'#FFD700', textDim:'rgba(255,255,255,0.65)', textPrev:'rgba(255,255,255,0.2)', progressBg:'rgba(255,255,255,0.1)', progressFg:'#7c4dff', shadowActive:'rgba(255,215,0,0.7)' },
    neon:    { base: ['#050510','#0a0820'], textActive:'#00fff7', textDim:'rgba(160,220,255,0.7)', textPrev:'rgba(160,220,255,0.2)', progressBg:'rgba(0,255,247,0.1)', progressFg:'#00fff7', shadowActive:'rgba(0,255,247,0.9)' },
    fire:    { base: ['#080000','#220600'], textActive:'#ff7700', textDim:'rgba(255,180,80,0.7)', textPrev:'rgba(255,180,80,0.2)', progressBg:'rgba(255,100,0,0.12)', progressFg:'#ff6600', shadowActive:'rgba(255,130,0,0.9)' },
    ocean:   { base: ['#000d1a','#001c3a'], textActive:'#00d4ff', textDim:'rgba(150,220,255,0.7)', textPrev:'rgba(150,220,255,0.2)', progressBg:'rgba(0,212,255,0.1)', progressFg:'#00d4ff', shadowActive:'rgba(0,212,255,0.8)' },
    minimal: { base: ['#0e0e0e','#1a1a1a'], textActive:'#ffffff', textDim:'rgba(255,255,255,0.55)', textPrev:'rgba(255,255,255,0.18)', progressBg:'rgba(255,255,255,0.1)', progressFg:'#fff', shadowActive:'rgba(255,255,255,0.5)' },
    violeta: { base: ['#0c0020','#1a0040'], textActive:'#e040fb', textDim:'rgba(220,150,255,0.7)', textPrev:'rgba(220,150,255,0.2)', progressBg:'rgba(224,64,251,0.1)', progressFg:'#e040fb', shadowActive:'rgba(224,64,251,0.9)' },
    dorado:  { base: ['#140e00','#241600'], textActive:'#FFC107', textDim:'rgba(255,215,90,0.65)', textPrev:'rgba(255,215,90,0.2)', progressBg:'rgba(255,193,7,0.12)', progressFg:'#FFC107', shadowActive:'rgba(255,193,7,0.8)' },
    hielo:   { base: ['#ddeeff','#c0d8f5'], textActive:'#0055bb', textDim:'rgba(0,60,160,0.65)', textPrev:'rgba(0,60,160,0.2)', progressBg:'rgba(0,80,200,0.12)', progressFg:'#0055bb', shadowActive:'rgba(0,80,200,0.7)' },
  };

  const ANIMATIONS = {
    none: () => {},

    galaxia: (ctx, W, H, t) => {
      const cx = W*0.5, cy = H*0.5;
      const cg = ctx.createRadialGradient(cx,cy,0,cx,cy,W*0.38);
      cg.addColorStop(0,'rgba(220,180,255,0.22)'); cg.addColorStop(0.3,'rgba(120,80,220,0.09)'); cg.addColorStop(1,'transparent');
      ctx.fillStyle=cg; ctx.fillRect(0,0,W,H);
      DATA.stars.forEach(s => {
        const ang=Math.atan2(s.y-0.5,s.x-0.5)+t*(0.04+s.a*0.07);
        const dist=Math.hypot(s.x-0.5,s.y-0.5)*Math.min(W,H)*0.94;
        const px=cx+Math.cos(ang)*dist, py=cy+Math.sin(ang)*dist*0.58;
        const tw=0.4+0.6*Math.abs(Math.sin(t*s.spd+s.ph));
        ctx.globalAlpha=s.a*tw*0.75;
        ctx.fillStyle=s.a>0.7?'#fff':s.a>0.5?'#c8a0ff':'#8070dd';
        ctx.beginPath(); ctx.arc(px,py,s.r+tw*0.5,0,6.28); ctx.fill();
      });
      ctx.globalAlpha=1;
    },

    matrix: (ctx, W, H, t) => {
      ctx.fillStyle='rgba(0,0,0,0.14)'; ctx.fillRect(0,0,W,H);
      const colW=W/DATA.mCols.length, charH=colW*1.45;
      ctx.textAlign='center';
      DATA.mCols.forEach(col => {
        const x=col.xFrac*W+colW*0.5;
        for (let row=0; row<28; row++) {
          const rawY=(t*col.spd*charH+col.off*charH-row*charH);
          const y=((rawY%(H+charH*28))+H+charH*28)%(H+charH*28)-charH;
          if (y<-charH||y>H+charH) continue;
          const fade=1-row/28;
          ctx.globalAlpha=fade*col.al;
          ctx.fillStyle=row===0?'#ffffff':row<4?'#aaffe0':'#00ee44';
          ctx.font=`bold ${Math.round(colW*1.05)}px monospace`;
          const ci=Math.abs(Math.floor(t*col.spd*4+row+col.off*9))%MCHARS.length;
          ctx.fillText(MCHARS[ci],x,y);
        }
      });
      ctx.globalAlpha=1; ctx.textAlign='left';
    },

    aurora: (ctx, W, H, t) => {
      const bands=[
        {c1:'rgba(0,255,140,0.2)',c2:'rgba(0,190,255,0.1)',f:0.8,ph:0,spd:0.14},
        {c1:'rgba(120,60,255,0.15)',c2:'rgba(0,140,255,0.07)',f:1.3,ph:1.5,spd:0.21},
        {c1:'rgba(255,60,200,0.11)',c2:'rgba(80,0,255,0.06)',f:0.5,ph:3.2,spd:0.09},
      ];
      bands.forEach(b => {
        for (let x=0; x<=W; x+=3) {
          const w1=Math.sin(x/W*Math.PI*2*b.f+t*b.spd+b.ph);
          const y=H*0.28+w1*H*0.14, bH=H*0.28+Math.sin(x/W*Math.PI+t*b.spd*0.6)*H*0.06;
          const g=ctx.createLinearGradient(0,y-bH*0.4,0,y+bH*1.6);
          g.addColorStop(0,'transparent'); g.addColorStop(0.3,b.c1); g.addColorStop(0.65,b.c2); g.addColorStop(1,'transparent');
          ctx.fillStyle=g; ctx.fillRect(x,y-bH*0.4,3,bH*2);
        }
      });
    },

    particulas: (ctx, W, H, t) => {
      DATA.orbs.forEach(p => {
        const y=1-((p.y+t*p.spd)%1), x=p.x+Math.sin(t*p.wob*55+p.ph)*0.038;
        const px=x*W, py=y*H;
        const glow=ctx.createRadialGradient(px,py,0,px,py,p.r*4);
        glow.addColorStop(0,`hsla(${p.hue},100%,80%,0.55)`); glow.addColorStop(0.5,`hsla(${p.hue},100%,60%,0.18)`); glow.addColorStop(1,'transparent');
        ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(px,py,p.r*4,0,6.28); ctx.fill();
        ctx.globalAlpha=0.92; ctx.fillStyle=`hsl(${p.hue},100%,88%)`; ctx.beginPath(); ctx.arc(px,py,p.r,0,6.28); ctx.fill();
        ctx.globalAlpha=1;
      });
    },

    hipnotico: (ctx, W, H, t) => {
      const cx=W/2, cy=H/2;
      for (let ring=1; ring<=9; ring++) {
        const sides=3+ring, rBase=(ring/10)*Math.min(W,H)*0.46;
        const pulse=1+Math.sin(t*1.2+ring*0.6)*0.04, r=rBase*pulse;
        const rot=t*(ring%2===0?0.28:-0.22)+ring*0.55, hue=(t*35+ring*33)%360;
        ctx.beginPath();
        for (let j=0; j<=sides; j++) { const a=(j/sides)*Math.PI*2+rot; j===0?ctx.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r):ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r); }
        ctx.closePath(); ctx.strokeStyle=`hsla(${hue},100%,70%,0.28)`; ctx.lineWidth=1.5; ctx.stroke();
      }
      const g=ctx.createRadialGradient(cx,cy,0,cx,cy,30);
      g.addColorStop(0,`hsla(${(t*60)%360},100%,80%,0.35)`); g.addColorStop(1,'transparent');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,30,0,6.28); ctx.fill();
    },

    confeti: (ctx, W, H, t) => {
      DATA.conf.forEach(c => {
        const yFrac=(c.y+t*c.spd)%1, xFrac=c.x+Math.sin(t*0.7+c.rot)*0.04;
        ctx.save(); ctx.translate(xFrac*W,yFrac*H); ctx.rotate(c.rot+t*c.spin);
        ctx.globalAlpha=0.82; ctx.fillStyle=`hsl(${c.hue},92%,65%)`; ctx.fillRect(-c.w/2,-c.h/2,c.w,c.h);
        ctx.restore(); ctx.globalAlpha=1;
      });
    },

    cosmos: (ctx, W, H, t) => {
      [{x:0.2,y:0.3,r:0.22,hue:280,ph:0},{x:0.76,y:0.6,r:0.19,hue:200,ph:2},{x:0.5,y:0.82,r:0.16,hue:320,ph:4}]
        .forEach(n => {
          const pulse=0.5+0.5*Math.sin(t*0.3+n.ph);
          const g=ctx.createRadialGradient(n.x*W,n.y*H,0,n.x*W,n.y*H,n.r*W);
          g.addColorStop(0,`hsla(${n.hue},80%,50%,${0.07+pulse*0.05})`); g.addColorStop(1,'transparent');
          ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
        });
      DATA.stars.slice(0,160).forEach(s => {
        const tw=0.3+0.7*Math.abs(Math.sin(t*s.spd+s.ph)); ctx.globalAlpha=s.a*tw*0.9;
        ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(s.x*W,s.y*H,s.r*0.7,0,6.28); ctx.fill();
      });
      DATA.shoots.forEach(ss => {
        const cycle=(t+ss.startFrac*13)%ss.interval;
        if (cycle<1.8) {
          const p=cycle/1.8, x1=ss.x0*W, y1=ss.y0*H, len=W*0.16, ang=Math.PI*0.26;
          const x2=x1+Math.cos(ang)*len*p, y2=y1+Math.sin(ang)*len*p;
          const grad=ctx.createLinearGradient(x1,y1,x2,y2);
          grad.addColorStop(0,'rgba(255,255,255,0.9)'); grad.addColorStop(1,'transparent');
          ctx.strokeStyle=grad; ctx.lineWidth=2; ctx.globalAlpha=1-p*0.5; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
        }
      });
      ctx.globalAlpha=1;
    },

    destellos: (ctx, W, H, t) => {
      DATA.sparks.forEach(s => {
        const pulse=Math.abs(Math.sin(t*s.spd+s.ph));
        if (pulse<0.38) return;
        const a=(pulse-0.38)/0.62, hue=(t*28+s.ph*58)%360;
        ctx.globalAlpha=a*0.85;
        const x=s.x*W, y=s.y*H, r=0.6+a*2.5;
        ctx.fillStyle=`hsl(${hue},100%,92%)`;
        ctx.beginPath();
        for (let j=0; j<8; j++) { const ang=(j/8)*Math.PI*2, rr=j%2===0?r*4:r*1.2; j===0?ctx.moveTo(x+Math.cos(ang)*rr,y+Math.sin(ang)*rr):ctx.lineTo(x+Math.cos(ang)*rr,y+Math.sin(ang)*rr); }
        ctx.closePath(); ctx.fill(); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(x,y,r*0.7,0,6.28); ctx.fill();
      });
      ctx.globalAlpha=1;
    },

    prisma: (ctx, W, H, t) => {
      DATA.prisms.forEach(pr => {
        const hue=(pr.hue+t*pr.spdH)%360, baseX=(pr.baseX+Math.sin(t*0.1+pr.ph)*pr.spdX)*W, spr=pr.spread*W;
        const grad=ctx.createLinearGradient(baseX,0,baseX,H*0.85);
        grad.addColorStop(0,`hsla(${hue},100%,75%,0.2)`); grad.addColorStop(0.5,`hsla(${(hue+40)%360},100%,60%,0.08)`); grad.addColorStop(1,'transparent');
        ctx.beginPath(); ctx.moveTo(baseX-spr*0.08,0); ctx.lineTo(baseX+spr*0.08,0); ctx.lineTo(baseX+spr*0.9,H*0.88); ctx.lineTo(baseX-spr*0.9,H*0.88); ctx.closePath();
        ctx.fillStyle=grad; ctx.fill();
      });
    },

    olas: (ctx, W, H, t) => {
      for (let layer=0; layer<6; layer++) {
        const freq=0.5+layer*0.35, amp=H*(0.055+layer*0.018), yBase=H*(0.45+layer*0.09);
        const spd=0.35+layer*0.14, hue=(200+layer*22+t*7)%360;
        ctx.beginPath(); ctx.moveTo(0,H);
        for (let x=0; x<=W; x+=3) {
          const y=yBase+Math.sin(x/W*Math.PI*2*freq+t*spd)*amp+Math.sin(x/W*Math.PI*3*freq+t*spd*0.65+1.2)*amp*0.38;
          ctx.lineTo(x,y);
        }
        ctx.lineTo(W,H); ctx.closePath(); ctx.fillStyle=`hsla(${hue},78%,42%,0.1)`; ctx.fill();
      }
    },
  };

  const ANIMATION_LIST = [
    { id: 'none',       label: 'Sin animación', emoji: '⬜' },
    { id: 'galaxia',    label: 'Galaxia',       emoji: '🌌' },
    { id: 'matrix',     label: 'Matrix',        emoji: '💻' },
    { id: 'aurora',     label: 'Aurora',        emoji: '🌈' },
    { id: 'particulas', label: 'Partículas',    emoji: '✨' },
    { id: 'hipnotico',  label: 'Hipnótico',     emoji: '🌀' },
    { id: 'confeti',    label: 'Confeti',        emoji: '🎊' },
    { id: 'cosmos',     label: 'Cosmos',        emoji: '🚀' },
    { id: 'destellos',  label: 'Destellos',     emoji: '⭐' },
    { id: 'prisma',     label: 'Prisma',        emoji: '🔮' },
    { id: 'olas',       label: 'Olas',          emoji: '🌊' },
  ];

  const THEME_LIST = [
    { id: 'classic', label: 'Clásico',  emoji: '🌌' },
    { id: 'neon',    label: 'Neón',     emoji: '⚡' },
    { id: 'fire',    label: 'Fuego',    emoji: '🔥' },
    { id: 'ocean',   label: 'Océano',   emoji: '💙' },
    { id: 'minimal', label: 'Minimal',  emoji: '◻' },
    { id: 'violeta', label: 'Violeta',  emoji: '💜' },
    { id: 'dorado',  label: 'Dorado',   emoji: '🏆' },
    { id: 'hielo',   label: 'Hielo',    emoji: '❄️' },
  ];

  /* ── Foreground overlay effects (render AFTER text) ── */
  const OVERLAYS = {
    none: () => {},

    notas: (ctx, W, H, t) => {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      DATA.noteParts.forEach(n => {
        const y = 1 - ((n.y + t * n.spd) % 1);
        const x = n.x + Math.sin(t * 0.9 + n.ph) * n.drift * 4;
        const fade = Math.min(1, Math.min(y * 9, (1 - y) * 9)) * 0.4;
        if (fade < 0.02) return;
        ctx.globalAlpha = fade;
        const sz = Math.round(n.sz * 20 * W / 1920);
        ctx.font = `${sz}px serif`;
        ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 4;
        ctx.fillText(n.ch, x * W, y * H);
      });
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    },

    brasas: (ctx, W, H, t) => {
      DATA.embers.forEach(e => {
        const y = 1 - ((e.y + t * e.spd) % 1);
        const x = e.x + Math.sin(t * 1.4 + e.ph) * e.drift * 4;
        const fade = Math.min(1, Math.min(y * 9, (1 - y) * 9));
        if (fade < 0.02) return;
        const pulse = 0.55 + 0.45 * Math.sin(t * 5 + e.ph);
        const pr = e.r * W / 800;
        ctx.globalAlpha = fade * pulse * 0.7;
        const glow = ctx.createRadialGradient(x*W, y*H, 0, x*W, y*H, pr*5);
        glow.addColorStop(0, `hsla(${e.hue},100%,95%,0.9)`);
        glow.addColorStop(0.4, `hsla(${e.hue},100%,65%,0.45)`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x*W, y*H, pr*5, 0, 6.28); ctx.fill();
        ctx.globalAlpha = fade * pulse;
        ctx.fillStyle = `hsl(${e.hue},100%,96%)`; ctx.beginPath(); ctx.arc(x*W, y*H, pr, 0, 6.28); ctx.fill();
      });
      ctx.globalAlpha = 1;
    },

    nieve: (ctx, W, H, t) => {
      DATA.snow.forEach(s => {
        const y = (s.y + t * s.spd) % 1;
        const x = s.x + Math.sin(t * 0.6 + s.ph) * s.drift * 4;
        const fade = Math.min(1, Math.min(y * 14, (1 - y) * 14)) * 0.62;
        if (fade < 0.02) return;
        const r2 = s.r * W / 1920;
        ctx.globalAlpha = fade;
        ctx.fillStyle = '#fff'; ctx.shadowColor = '#c8e0ff'; ctx.shadowBlur = r2 * 3;
        ctx.beginPath(); ctx.arc(x*W, y*H, r2, 0, 6.28); ctx.fill();
      });
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    },

    burbujas: (ctx, W, H, t) => {
      DATA.snow.forEach((s, i) => {
        const y = 1 - ((s.y + t * s.spd * 0.65) % 1);
        const x = s.x + Math.sin(t * 0.4 + s.ph) * s.drift * 5;
        const fade = Math.min(1, Math.min(y * 10, (1 - y) * 10)) * 0.52;
        if (fade < 0.02) return;
        const r2 = (s.r + 1) * W / 1400;
        const hue = (i * 17 + t * 12) % 360;
        ctx.globalAlpha = fade;
        ctx.strokeStyle = `hsla(${hue},80%,85%,0.7)`; ctx.lineWidth = r2 * 0.35;
        ctx.beginPath(); ctx.arc(x*W, y*H, r2, 0, 6.28); ctx.stroke();
        ctx.fillStyle = `hsla(${hue},60%,90%,0.12)`;
        ctx.beginPath(); ctx.arc(x*W, y*H, r2, 0, 6.28); ctx.fill();
      });
      ctx.globalAlpha = 1;
    },
  };

  const OVERLAY_LIST = [
    { id: 'none',     label: 'Ninguno',  emoji: '⬜' },
    { id: 'notas',    label: 'Notas',    emoji: '🎵' },
    { id: 'brasas',   label: 'Brasas',   emoji: '🔥' },
    { id: 'nieve',    label: 'Nieve',    emoji: '❄️' },
    { id: 'burbujas', label: 'Burbujas', emoji: '🫧' },
  ];

  function drawFrame(canvas, opts) {
    const { time=0, duration=1, lines=[], theme='classic', animation='none', fontSize=56, songTitle='', activeColorOverride, inactiveColorOverride, textPosition='center', glowIntensity=1, overlayEffect='none', showProgressBar=true, showTitle=true } = opts;
    const W=canvas.width, H=canvas.height, ctx=canvas.getContext('2d');
    const T=THEMES[theme]||THEMES.classic;
    const GI=clampN(glowIntensity,0,3);

    const bg=ctx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0,T.base[0]); bg.addColorStop(1,T.base[1]);
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

    ctx.save(); (ANIMATIONS[animation]||ANIMATIONS.none)(ctx,W,H,time); ctx.restore();
    ctx.fillStyle='rgba(0,0,0,0.28)'; ctx.fillRect(0,0,W,H);

    let activeIdx=-1;
    for (let i=0; i<lines.length; i++) { if (lines[i].time<=time) activeIdx=i; }
    const prevLine=activeIdx>0?lines[activeIdx-1]:null;
    const currLine=activeIdx>=0?lines[activeIdx]:null;
    const nextLine=activeIdx>=0&&activeIdx<lines.length-1?lines[activeIdx+1]:null;
    const activeColor=activeColorOverride||T.textActive, inactiveColor=inactiveColorOverride||T.textDim;
    const cx=W/2, fsLg=Math.max(22,Math.round(fontSize*W/1920)), fsMd=Math.max(16,Math.round(fsLg*0.62)), fsSm=Math.max(12,Math.round(fsLg*0.44));
    const midY = textPosition==='lower' ? H*0.72 : textPosition==='upper' ? H*0.28 : H*0.5;

    if (showTitle && songTitle) {
      ctx.font=`500 ${fsSm}px 'Segoe UI', sans-serif`; ctx.fillStyle='rgba(255,255,255,0.38)';
      ctx.textAlign='left'; ctx.textBaseline='alphabetic'; ctx.fillText(songTitle,28,36);
    }

    if (showProgressBar) {
      const pbH=Math.max(4,Math.round(H*0.007)), pbY=H-pbH-18;
      ctx.fillStyle=T.progressBg; ctx.beginPath(); ctx.roundRect(28,pbY,W-56,pbH,pbH/2); ctx.fill();
      const pPct=duration>0?clampN(time/duration,0,1):0;
      if (pPct>0) {
        const pg=ctx.createLinearGradient(28,0,W-56,0); pg.addColorStop(0,T.progressFg); pg.addColorStop(1,activeColor);
        ctx.fillStyle=pg; ctx.beginPath(); ctx.roundRect(28,pbY,(W-56)*pPct,pbH,pbH/2); ctx.fill();
      }
      ctx.font=`300 ${fsSm}px monospace`; ctx.fillStyle='rgba(255,255,255,0.38)';
      ctx.textAlign='right'; ctx.textBaseline='alphabetic'; ctx.fillText(`${formatTime(time)} / ${formatTime(duration)}`,W-28,pbY-8);
    }

    if (prevLine) {
      ctx.font=`300 ${fsSm}px 'Segoe UI', sans-serif`; ctx.fillStyle=T.textPrev;
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(_fit(ctx,prevLine.text,W-80),cx,midY-fsLg*1.65);
    }
    if (nextLine) {
      ctx.font=`400 ${fsMd}px 'Segoe UI', sans-serif`; ctx.fillStyle=inactiveColor;
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.shadowColor='transparent'; ctx.shadowBlur=0;
      ctx.fillText(_fit(ctx,nextLine.text,W-80),cx,midY+fsLg*1.05);
    }
    if (currLine) {
      const lineEnd=nextLine?nextLine.time:duration;
      const linePct=lineEnd>currLine.time?clampN((time-currLine.time)/(lineEnd-currLine.time),0,1):1;
      const txt=_fit(ctx,currLine.text,W-80);
      ctx.font=`700 ${fsLg}px 'Segoe UI', sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.shadowColor=T.shadowActive; ctx.shadowBlur=(28+Math.sin(time*4.5)*7)*GI; ctx.fillStyle=activeColor; ctx.fillText(txt,cx,midY);
      const txtW=ctx.measureText(txt).width, startX=cx-txtW/2;
      ctx.save(); ctx.beginPath(); ctx.rect(startX-2,midY-fsLg*1.1,(txtW+2)*linePct,fsLg*2.2); ctx.clip();
      ctx.shadowColor=activeColor; ctx.shadowBlur=14*GI; ctx.fillStyle='#ffffff'; ctx.fillText(txt,cx,midY); ctx.restore();
      ctx.shadowBlur=0; ctx.textBaseline='alphabetic';
    } else {
      ctx.font=`300 ${fsMd}px 'Segoe UI', sans-serif`; ctx.fillStyle='rgba(255,255,255,0.22)';
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('♪  ♪  ♪',cx,midY); ctx.textBaseline='alphabetic';
    }
    // Foreground overlay (renders atop text)
    ctx.save(); (OVERLAYS[overlayEffect]||OVERLAYS.none)(ctx,W,H,time); ctx.restore();
  }

  function _fit(ctx, text, maxW) {
    if (!text) return '';
    if (ctx.measureText(text).width<=maxW) return text;
    let t=text;
    while (t.length>3&&ctx.measureText(t+'…').width>maxW) t=t.slice(0,-1);
    return t+'…';
  }

  return { drawFrame, THEMES, ANIMATIONS, OVERLAY_LIST, ANIMATION_LIST, THEME_LIST };
})();

export default Renderer;
