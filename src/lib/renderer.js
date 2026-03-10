/* ============================================================
   renderer.js — Canvas karaoke video renderer (ES module)
   ============================================================ */

import logoUrl from '../logo.svg';

const Renderer = (() => {

  // Categoría «Canciones» — desactivar con VITE_ENABLE_CANCIONES=false en .env
  const ENABLE_CANCIONES = (typeof import.meta !== 'undefined' && import.meta.env)
    ? import.meta.env.VITE_ENABLE_CANCIONES !== 'false'
    : true;

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
    // Extra data for new animations
    rain: Array.from({ length: 120 }, (_, i) => ({
      x: sr(i*6+700), y: sr(i*6+701), spd: sr(i*6+702)*0.12+0.06,
      len: sr(i*6+703)*0.04+0.02, al: sr(i*6+704)*0.4+0.2,
    })),
    diamonds: Array.from({ length: 18 }, (_, i) => ({
      x: sr(i*9+800), y: sr(i*9+801), spd: sr(i*9+802)*0.3+0.1,
      sz: sr(i*9+803)*0.04+0.015, ph: sr(i*9+804)*6.28,
      hue: i*20, rot: sr(i*9+806)*6.28, rotSpd: (sr(i*9+807)-0.5)*0.8,
    })),
    laserLines: Array.from({ length: 8 }, (_, i) => ({
      y: sr(i*5+900)*0.8+0.1, hue: i*45, spd: (sr(i*5+901)-0.5)*0.04,
      ph: sr(i*5+902)*6.28, thick: sr(i*5+903)*2+0.5,
    })),
    hearts: Array.from({ length: 22 }, (_, i) => ({
      x: sr(i*8+1000), y: sr(i*8+1001), spd: sr(i*8+1002)*0.03+0.01,
      sz: sr(i*8+1003)*0.04+0.018, ph: sr(i*8+1004)*6.28,
      hue: sr(i*8+1005)*40+330,
    })),
    sparks2: Array.from({ length: 80 }, (_, i) => ({
      x: sr(i*5+1100), y: sr(i*5+1101), ph: sr(i*5+1102)*6.28,
      spd: sr(i*5+1103)*3+0.5, hue: sr(i*5+1104)*60+200,
    })),
    flameParticles: Array.from({ length: 50 }, (_, i) => ({
      x: sr(i*7+1200), spd: sr(i*7+1201)*0.08+0.04,
      ph: sr(i*7+1202)*6.28, hue: sr(i*7+1203)*30+8,
      sz: sr(i*7+1204)*0.04+0.015, wob: (sr(i*7+1205)-0.5)*0.04,
    })),
    eqBars: Array.from({ length: 28 }, (_, i) => ({
      ph: sr(i*4+1300)*6.28, spd: sr(i*4+1301)*5+1.5, hue: (i/28)*260+180,
    })),
    lightSeeds: Array.from({ length: 5 }, (_, i) => ({
      x: sr(i*6+1400)*0.7+0.15, interval: sr(i*6+1401)*8+4,
      off: sr(i*6+1402)*5, segs: Math.floor(sr(i*6+1403)*4)+3,
    })),
    crystalShards: Array.from({ length: 14 }, (_, i) => ({
      x: sr(i*9+1500), y: sr(i*9+1501), hue: i*26,
      sz: sr(i*9+1503)*0.06+0.025, ph: sr(i*9+1504)*6.28,
      rot: sr(i*9+1506)*6.28, rotSpd: (sr(i*9+1507)-0.5)*0.6,
      spd: sr(i*9+1508)*0.35+0.08,
    })),
    flowers: Array.from({ length: 18 }, (_, i) => ({
      x: sr(i*8+1600), y: sr(i*8+1601), spd: sr(i*8+1602)*0.03+0.01,
      sz: sr(i*8+1603)*0.04+0.016, ph: sr(i*8+1604)*6.28,
      hue: sr(i*8+1605)*80+280, rot: sr(i*8+1606)*6.28, rotSpd: (sr(i*8+1607)-0.5)*0.3,
    })),
    confPieces: Array.from({ length: 70 }, (_, i) => ({
      x: sr(i*9+1700), y: sr(i*9+1701), spd: sr(i*9+1702)*0.07+0.025,
      w: sr(i*9+1703)*12+4, h: sr(i*9+1704)*7+2, hue: sr(i*9+1705)*360,
      rot: sr(i*9+1706)*6.28, spin: (sr(i*9+1707)-0.5)*0.12, dx: (sr(i*9+1708)-0.5)*0.022,
    })),
    meteors: Array.from({ length: 16 }, (_, i) => ({
      x0: sr(i*7+2000), y0: sr(i*7+2001)*0.45,
      interval: sr(i*7+2002)*8+3, off: sr(i*7+2003)*11,
      len: sr(i*7+2004)*0.18+0.09,
      ang: Math.PI*0.28+sr(i*7+2005)*0.14,
    })),
    plasmaBlobs: Array.from({ length: 6 }, (_, i) => ({
      x: sr(i*5+2100)*0.6+0.2, y: sr(i*5+2101)*0.6+0.2,
      hue: i*60, r: sr(i*5+2103)*0.25+0.15,
      spdX: (sr(i*5+2104)-0.5)*0.04, spdY: (sr(i*5+2105)-0.5)*0.03,
      ph: sr(i*5+2106)*6.28,
    })),
    balloons: Array.from({ length: 14 }, (_, i) => ({
      x: sr(i*6+2200), y: sr(i*6+2201), spd: sr(i*6+2202)*0.025+0.01,
      sz: sr(i*6+2203)*0.025+0.015, hue: sr(i*6+2204)*360,
      ph: sr(i*6+2205)*6.28, drift: (sr(i*6+2206)-0.5)*0.01,
    })),
    butterflies: Array.from({ length: 12 }, (_, i) => ({
      x: sr(i*8+2300), y: sr(i*8+2301), spd: sr(i*8+2302)*0.022+0.008,
      sz: sr(i*8+2303)*0.032+0.012, hue: sr(i*8+2304)*180+120,
      ph: sr(i*8+2305)*6.28, wob: sr(i*8+2306)*0.04+0.02,
    })),
    leaves: Array.from({ length: 28 }, (_, i) => ({
      x: sr(i*7+2400), y: sr(i*7+2401), spd: sr(i*7+2402)*0.03+0.01,
      sz: sr(i*7+2403)*0.022+0.01, hue: sr(i*7+2404)*60+60,
      rot: sr(i*7+2405)*6.28, spin: (sr(i*7+2406)-0.5)*0.08,
      drift: (sr(i*7+2407)-0.5)*0.015,
    })),
  };

  const MCHARS = 'ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ012345679';

  const THEMES = {
    // ── Oscuros
    classic:    { base: ['#07051a','#12093a'], textActive:'#FFD700', textDim:'rgba(255,230,160,0.6)', textPrev:'rgba(255,230,160,0.18)', progressBg:'rgba(255,255,255,0.08)', progressFg:'#9c6dff', shadowActive:'rgba(255,215,0,0.85)' },
    neon:       { base: ['#02020f','#060418'], textActive:'#00ffe5', textDim:'rgba(100,220,255,0.65)', textPrev:'rgba(100,220,255,0.18)', progressBg:'rgba(0,255,229,0.08)', progressFg:'#00ffe5', shadowActive:'rgba(0,255,229,1)' },
    fire:       { base: ['#0a0100','#1e0400'], textActive:'#ff8c00', textDim:'rgba(255,180,80,0.65)', textPrev:'rgba(255,130,30,0.18)', progressBg:'rgba(255,100,0,0.1)', progressFg:'#ff5500', shadowActive:'rgba(255,110,0,1)' },
    ocean:      { base: ['#000810','#00152e'], textActive:'#00d4ff', textDim:'rgba(120,210,255,0.65)', textPrev:'rgba(120,210,255,0.18)', progressBg:'rgba(0,212,255,0.08)', progressFg:'#00aaff', shadowActive:'rgba(0,212,255,0.95)' },
    violeta:    { base: ['#080015','#130030'], textActive:'#d966ff', textDim:'rgba(210,140,255,0.65)', textPrev:'rgba(210,140,255,0.18)', progressBg:'rgba(200,60,255,0.08)', progressFg:'#c840ff', shadowActive:'rgba(210,60,255,1)' },
    esmeralda:  { base: ['#010e08','#011e10'], textActive:'#00ffaa', textDim:'rgba(100,255,180,0.62)', textPrev:'rgba(100,255,180,0.17)', progressBg:'rgba(0,255,160,0.08)', progressFg:'#00dd88', shadowActive:'rgba(0,255,160,0.9)' },
    atardecer:  { base: ['#0d0005','#200010'], textActive:'#ff6eb0', textDim:'rgba(255,160,200,0.62)', textPrev:'rgba(255,160,200,0.18)', progressBg:'rgba(255,80,160,0.08)', progressFg:'#ff4090', shadowActive:'rgba(255,80,180,0.9)' },
    noir:       { base: ['#080808','#111111'], textActive:'#f0f0f0', textDim:'rgba(200,200,200,0.5)', textPrev:'rgba(200,200,200,0.15)', progressBg:'rgba(255,255,255,0.06)', progressFg:'#888', shadowActive:'rgba(255,255,255,0.55)' },
    // ── Claros
    minimal:    { base: ['#0d0d0d','#161616'], textActive:'#ffffff', textDim:'rgba(255,255,255,0.52)', textPrev:'rgba(255,255,255,0.16)', progressBg:'rgba(255,255,255,0.08)', progressFg:'#ccc', shadowActive:'rgba(255,255,255,0.6)' },
    dorado:     { base: ['#110900','#1e1000'], textActive:'#ffcf2e', textDim:'rgba(255,210,80,0.6)', textPrev:'rgba(255,210,80,0.17)', progressBg:'rgba(255,200,0,0.1)', progressFg:'#ffb800', shadowActive:'rgba(255,200,0,0.9)' },
    retro:      { base: ['#1a0d26','#2b1040'], textActive:'#ff77aa', textDim:'rgba(255,160,220,0.62)', textPrev:'rgba(255,160,220,0.17)', progressBg:'rgba(255,100,200,0.08)', progressFg:'#ff55bb', shadowActive:'rgba(255,100,200,0.85)' },
    sakura:     { base: ['#f5e8f0','#e8d4e8'], textActive:'#b5006e', textDim:'rgba(160,0,100,0.58)', textPrev:'rgba(160,0,100,0.17)', progressBg:'rgba(180,0,90,0.1)', progressFg:'#cc0080', shadowActive:'rgba(180,0,100,0.55)' },
    hielo:      { base: ['#d6eeff','#b8d8f8'], textActive:'#003faa', textDim:'rgba(0,50,140,0.6)', textPrev:'rgba(0,50,140,0.18)', progressBg:'rgba(0,70,180,0.1)', progressFg:'#0055cc', shadowActive:'rgba(0,70,200,0.65)' },
    aurora:     { base: ['#001410','#002018'], textActive:'#7fff8a', textDim:'rgba(160,255,200,0.6)', textPrev:'rgba(160,255,200,0.16)', progressBg:'rgba(0,255,120,0.07)', progressFg:'#55ffaa', shadowActive:'rgba(100,255,160,0.9)' },
    // ── Claros adicionales
    campo_dia:  { bgFn(ctx,W,H) {
      const sky=ctx.createLinearGradient(0,0,0,H*0.62); sky.addColorStop(0,'#6fb4e0'); sky.addColorStop(1,'#c6e8f8'); ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);
      const grs=ctx.createLinearGradient(0,H*0.62,0,H); grs.addColorStop(0,'#5ab86c'); grs.addColorStop(1,'#2d7a3a'); ctx.fillStyle=grs; ctx.fillRect(0,H*0.62,W,H*0.38);
      const sun=ctx.createRadialGradient(W*0.82,H*0.14,0,W*0.82,H*0.14,W*0.28); sun.addColorStop(0,'rgba(255,245,160,0.9)'); sun.addColorStop(0.3,'rgba(255,230,80,0.3)'); sun.addColorStop(1,'rgba(255,210,50,0)');
      ctx.fillStyle=sun; ctx.fillRect(0,0,W,H);
    }, base:['#6fb4e0','#5ab86c'], textActive:'#0a2200', textDim:'rgba(10,40,0,0.55)', textPrev:'rgba(10,40,0,0.18)', progressBg:'rgba(10,80,10,0.12)', progressFg:'#1a6622', shadowActive:'rgba(0,60,10,0.65)' },
    cielo:      { bgFn(ctx,W,H) {
      const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#b8def5'); g.addColorStop(0.5,'#d8eefa'); g.addColorStop(1,'#eef6ff'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      // Fluffy clouds
      const drawCloud=(cx,cy,r)=>{ ctx.save(); ctx.globalAlpha=0.45; ctx.fillStyle='#fff'; ctx.shadowColor='#cce8ff'; ctx.shadowBlur=18;
        [[0,0,r],[r*0.7,-r*0.3,r*0.72],[r*1.3,0,r*0.65],[-r*0.7,-r*0.25,r*0.68],[-r*1.25,0,r*0.58]].forEach(([dx,dy,dr])=>{ ctx.beginPath(); ctx.arc(cx+dx,cy+dy,dr,0,Math.PI*2); ctx.fill(); }); ctx.restore(); };
      const cr=Math.max(30,W*0.06);
      drawCloud(W*0.18,H*0.18,cr); drawCloud(W*0.55,H*0.1,cr*1.2); drawCloud(W*0.82,H*0.22,cr*0.9);
    }, base:['#b8def5','#eef6ff'], textActive:'#002a5e', textDim:'rgba(0,40,90,0.58)', textPrev:'rgba(0,40,90,0.18)', progressBg:'rgba(0,70,160,0.1)', progressFg:'#0055bb', shadowActive:'rgba(0,70,180,0.6)' },
    papiro:     { bgFn(ctx,W,H) {
      const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#f5e9c9'); g.addColorStop(1,'#e0cc96'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      ctx.save(); ctx.globalAlpha=0.06;
      for(let i=0;i<200;i++){ const gr=((i*9301+49297)%233280)/233280; ctx.fillStyle='rgba(120,80,20,0.5)'; ctx.fillRect(gr*W,(((i*6271+3571)%15973)/15973)*H,((i*4799+2791)%7989)/7989*3+0.5,0.5); }
      ctx.restore();
      const vi=ctx.createRadialGradient(W*.5,H*.5,H*.3,W*.5,H*.5,W*.65); vi.addColorStop(0,'transparent'); vi.addColorStop(1,'rgba(100,60,0,0.22)'); ctx.fillStyle=vi; ctx.fillRect(0,0,W,H);
    }, base:['#f5e9c9','#e0cc96'], textActive:'#3a1a00', textDim:'rgba(70,30,0,0.58)', textPrev:'rgba(70,30,0,0.18)', progressBg:'rgba(100,55,0,0.12)', progressFg:'#6a3600', shadowActive:'rgba(80,40,0,0.60)' },
    coral:      { bgFn(ctx,W,H) {
      const g=ctx.createLinearGradient(0,0,W,H); g.addColorStop(0,'#ffcab8'); g.addColorStop(0.5,'#ffa88a'); g.addColorStop(1,'#ff8870'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      const rg=ctx.createRadialGradient(W*.2,H*.2,0,W*.2,H*.2,W*.55); rg.addColorStop(0,'rgba(255,255,200,0.22)'); rg.addColorStop(1,'transparent'); ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);
    }, base:['#ffcab8','#ff8870'], textActive:'#5a0e00', textDim:'rgba(100,15,0,0.60)', textPrev:'rgba(100,15,0,0.18)', progressBg:'rgba(140,30,0,0.12)', progressFg:'#8a2000', shadowActive:'rgba(130,25,0,0.65)' },
    menta:      { bgFn(ctx,W,H) {
      const g=ctx.createLinearGradient(0,0,W,H); g.addColorStop(0,'#c6f0da'); g.addColorStop(0.5,'#a8e5c2'); g.addColorStop(1,'#88d8a8'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      const rg=ctx.createRadialGradient(W*.8,H*.15,0,W*.8,H*.15,W*.4); rg.addColorStop(0,'rgba(255,255,255,0.28)'); rg.addColorStop(1,'transparent'); ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);
    }, base:['#c6f0da','#88d8a8'], textActive:'#003d1a', textDim:'rgba(0,65,25,0.58)', textPrev:'rgba(0,65,25,0.18)', progressBg:'rgba(0,90,35,0.10)', progressFg:'#005c22', shadowActive:'rgba(0,80,30,0.60)' },
    lavanda:    { bgFn(ctx,W,H) {
      const g=ctx.createLinearGradient(0,0,W,H); g.addColorStop(0,'#ead8f8'); g.addColorStop(0.5,'#d8bef5'); g.addColorStop(1,'#c8a8ef'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      const rg=ctx.createRadialGradient(W*.25,H*.2,0,W*.25,H*.2,W*.5); rg.addColorStop(0,'rgba(255,255,255,0.30)'); rg.addColorStop(1,'transparent'); ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);
    }, base:['#ead8f8','#c8a8ef'], textActive:'#3a0060', textDim:'rgba(60,0,90,0.58)', textPrev:'rgba(60,0,90,0.18)', progressBg:'rgba(80,0,120,0.10)', progressFg:'#6800a8', shadowActive:'rgba(70,0,110,0.60)' },
    // ── Oscuros adicionales
    medianoche: { base: ['#00010d','#010318'], bgFn(ctx,W,H) {
      ctx.fillStyle='#00010d'; ctx.fillRect(0,0,W,H);
      const rg=ctx.createRadialGradient(W*.5,H*.5,0,W*.5,H*.5,W*.65);
      rg.addColorStop(0,'rgba(10,20,80,0.72)'); rg.addColorStop(0.55,'rgba(2,6,30,0.55)'); rg.addColorStop(1,'rgba(0,0,8,0)');
      ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);
      const vg=ctx.createRadialGradient(W*.5,H*.5,H*.18,W*.5,H*.5,W*.72);
      vg.addColorStop(0,'transparent'); vg.addColorStop(1,'rgba(0,0,6,0.62)');
      ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
    }, textActive:'#6699ff', textDim:'rgba(138,170,255,0.62)', textPrev:'rgba(138,170,255,0.17)', progressBg:'rgba(80,120,255,0.08)', progressFg:'#4477ff', shadowActive:'rgba(80,140,255,0.90)' },
    terciopelo: { base: ['#0e0018','#1c0040'], bgFn(ctx,W,H) {
      const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#0a0014'); g.addColorStop(1,'#180035');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      const rg=ctx.createRadialGradient(W*.5,H*.4,0,W*.5,H*.4,W*.6);
      rg.addColorStop(0,'rgba(120,50,200,0.30)'); rg.addColorStop(0.45,'rgba(80,20,160,0.12)'); rg.addColorStop(1,'transparent');
      ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);
      const vg=ctx.createRadialGradient(W*.5,H*.5,H*.14,W*.5,H*.5,W*.82);
      vg.addColorStop(0,'transparent'); vg.addColorStop(1,'rgba(0,0,10,0.72)');
      ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
    }, textActive:'#cc88ff', textDim:'rgba(200,150,255,0.60)', textPrev:'rgba(200,150,255,0.16)', progressBg:'rgba(160,70,255,0.09)', progressFg:'#aa55ff', shadowActive:'rgba(180,80,255,0.92)' },
    carbon: { base: ['#121212','#1a1a1a'], bgFn(ctx,W,H) {
      ctx.fillStyle='#121212'; ctx.fillRect(0,0,W,H);
      const rg=ctx.createRadialGradient(W*.5,H*.5,H*.05,W*.5,H*.5,W*.72);
      rg.addColorStop(0,'rgba(32,32,32,0.88)'); rg.addColorStop(0.5,'rgba(16,16,16,0.55)'); rg.addColorStop(1,'rgba(2,2,2,0.80)');
      ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);
      const bg2=ctx.createLinearGradient(0,H*.65,0,H);
      bg2.addColorStop(0,'transparent'); bg2.addColorStop(1,'rgba(0,0,0,0.48)');
      ctx.fillStyle=bg2; ctx.fillRect(0,H*.65,W,H*.35);
    }, textActive:'#dddddd', textDim:'rgba(180,180,180,0.50)', textPrev:'rgba(165,165,165,0.14)', progressBg:'rgba(255,255,255,0.06)', progressFg:'#888888', shadowActive:'rgba(220,220,220,0.62)' },
    // ── Vibrante
    sunset: { base: ['#07000f','#8a2200'], bgFn(ctx,W,H) {
      const g=ctx.createLinearGradient(0,0,W*.8,H);
      g.addColorStop(0,'#06000e'); g.addColorStop(0.28,'#280618'); g.addColorStop(0.55,'#721408'); g.addColorStop(0.78,'#b83808'); g.addColorStop(1,'#7a2000');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      const sh=ctx.createRadialGradient(W*.6,H*.65,0,W*.6,H*.65,W*.58);
      sh.addColorStop(0,'rgba(255,120,20,0.24)'); sh.addColorStop(0.6,'rgba(185,50,5,0.08)'); sh.addColorStop(1,'transparent');
      ctx.fillStyle=sh; ctx.fillRect(0,0,W,H);
      const tv=ctx.createLinearGradient(0,0,0,H*.28);
      tv.addColorStop(0,'rgba(0,0,0,0.38)'); tv.addColorStop(1,'transparent');
      ctx.fillStyle=tv; ctx.fillRect(0,0,W,H*.28);
    }, textActive:'#ffcc44', textDim:'rgba(255,210,130,0.62)', textPrev:'rgba(255,185,80,0.18)', progressBg:'rgba(255,120,30,0.10)', progressFg:'#ff7020', shadowActive:'rgba(255,195,55,0.92)' },
    aurora_norte: { base: ['#000e0a','#001a10'], bgFn(ctx,W,H) {
      ctx.fillStyle='#000d09'; ctx.fillRect(0,0,W,H);
      [[0.08,0.15,0.52,165,0],[0.62,0.18,0.48,185,2.1],[0.25,0.25,0.40,140,4.2]].forEach(([bx,by,br,bh])=> {
        const ng=ctx.createRadialGradient(bx*W,by*H,0,bx*W,by*H,br*W);
        ng.addColorStop(0,`hsla(${bh},90%,52%,0.32)`); ng.addColorStop(0.45,`hsla(${bh+14},80%,42%,0.10)`); ng.addColorStop(1,'transparent');
        ctx.fillStyle=ng; ctx.fillRect(0,0,W,H);
      });
      const hg=ctx.createLinearGradient(0,H*.12,0,H*.55);
      hg.addColorStop(0,'transparent'); hg.addColorStop(0.4,'rgba(0,220,150,0.07)'); hg.addColorStop(1,'transparent');
      ctx.fillStyle=hg; ctx.fillRect(0,0,W,H);
      const vg=ctx.createRadialGradient(W*.5,H*.5,H*.10,W*.5,H*.5,W*.80);
      vg.addColorStop(0,'transparent'); vg.addColorStop(1,'rgba(0,0,6,0.72)');
      ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
    }, textActive:'#44ffaa', textDim:'rgba(100,255,190,0.60)', textPrev:'rgba(100,255,190,0.16)', progressBg:'rgba(0,240,150,0.08)', progressFg:'#22dd88', shadowActive:'rgba(60,255,170,0.92)' },
    amanecer: { base: ['#060012','#c04800'], bgFn(ctx,W,H) {
      const g=ctx.createLinearGradient(0,0,0,H);
      g.addColorStop(0,'#060012'); g.addColorStop(0.22,'#1a0840'); g.addColorStop(0.44,'#5c0e6a'); g.addColorStop(0.64,'#c82820'); g.addColorStop(0.82,'#e06410'); g.addColorStop(1,'#c84800');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      const hg=ctx.createRadialGradient(W*.5,H*.68,0,W*.5,H*.68,W*.65);
      hg.addColorStop(0,'rgba(255,180,30,0.22)'); hg.addColorStop(0.5,'rgba(210,80,10,0.07)'); hg.addColorStop(1,'transparent');
      ctx.fillStyle=hg; ctx.fillRect(0,0,W,H);
    }, textActive:'#ffeeaa', textDim:'rgba(255,230,160,0.62)', textPrev:'rgba(255,210,120,0.18)', progressBg:'rgba(255,160,40,0.10)', progressFg:'#ff8820', shadowActive:'rgba(255,230,80,0.92)' },
    tropico: { base: ['#000c12','#002236'], bgFn(ctx,W,H) {
      const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#000c12'); g.addColorStop(1,'#001828');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      const rg=ctx.createRadialGradient(W*.5,H*.45,0,W*.5,H*.45,W*.52);
      rg.addColorStop(0,'rgba(0,200,210,0.24)'); rg.addColorStop(0.45,'rgba(0,140,180,0.09)'); rg.addColorStop(1,'transparent');
      ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);
      const bg2=ctx.createLinearGradient(0,H*.58,0,H);
      bg2.addColorStop(0,'transparent'); bg2.addColorStop(1,'rgba(0,4,22,0.62)');
      ctx.fillStyle=bg2; ctx.fillRect(0,H*.58,W,H*.42);
      const vg=ctx.createRadialGradient(W*.5,H*.5,H*.12,W*.5,H*.5,W*.75);
      vg.addColorStop(0,'transparent'); vg.addColorStop(1,'rgba(0,2,12,0.62)');
      ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
    }, textActive:'#00eeff', textDim:'rgba(80,235,255,0.62)', textPrev:'rgba(80,235,255,0.17)', progressBg:'rgba(0,200,230,0.09)', progressFg:'#00bbdd', shadowActive:'rgba(0,230,255,0.95)' },
    candy: { base: ['#180820','#0c0830'], bgFn(ctx,W,H) {
      ctx.fillStyle='#110618'; ctx.fillRect(0,0,W,H);
      let rg=ctx.createRadialGradient(W*.08,H*.18,0,W*.08,H*.18,W*.55);
      rg.addColorStop(0,'rgba(255,80,180,0.34)'); rg.addColorStop(0.5,'rgba(200,40,140,0.10)'); rg.addColorStop(1,'transparent');
      ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);
      rg=ctx.createRadialGradient(W*.56,H*.52,0,W*.56,H*.52,W*.50);
      rg.addColorStop(0,'rgba(140,80,255,0.30)'); rg.addColorStop(0.5,'rgba(100,50,200,0.09)'); rg.addColorStop(1,'transparent');
      ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);
      rg=ctx.createRadialGradient(W*.9,H*.85,0,W*.9,H*.85,W*.42);
      rg.addColorStop(0,'rgba(40,200,240,0.24)'); rg.addColorStop(0.5,'rgba(20,150,220,0.08)'); rg.addColorStop(1,'transparent');
      ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);
      const vg=ctx.createRadialGradient(W*.5,H*.5,H*.08,W*.5,H*.5,W*.80);
      vg.addColorStop(0,'transparent'); vg.addColorStop(1,'rgba(8,2,18,0.66)');
      ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
    }, textActive:'#ff88dd', textDim:'rgba(255,180,230,0.62)', textPrev:'rgba(255,170,225,0.17)', progressBg:'rgba(255,100,200,0.09)', progressFg:'#ff55cc', shadowActive:'rgba(255,120,210,0.92)' },
    electrico: { base: ['#000508','#001020'], bgFn(ctx,W,H) {
      const g=ctx.createLinearGradient(W,0,0,H);
      g.addColorStop(0,'#000508'); g.addColorStop(0.45,'#001422'); g.addColorStop(1,'#000320');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      let rg=ctx.createRadialGradient(W*.18,H*.22,0,W*.18,H*.22,W*.45);
      rg.addColorStop(0,'rgba(0,150,255,0.32)'); rg.addColorStop(0.5,'rgba(0,100,220,0.10)'); rg.addColorStop(1,'transparent');
      ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);
      rg=ctx.createRadialGradient(W*.82,H*.78,0,W*.82,H*.78,W*.42);
      rg.addColorStop(0,'rgba(0,220,255,0.24)'); rg.addColorStop(0.5,'rgba(0,180,240,0.07)'); rg.addColorStop(1,'transparent');
      ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);
      const vg=ctx.createRadialGradient(W*.5,H*.5,H*.10,W*.5,H*.5,W*.78);
      vg.addColorStop(0,'transparent'); vg.addColorStop(1,'rgba(0,2,10,0.70)');
      ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
    }, textActive:'#44ccff', textDim:'rgba(100,210,255,0.62)', textPrev:'rgba(100,210,255,0.17)', progressBg:'rgba(0,180,255,0.09)', progressFg:'#0099ee', shadowActive:'rgba(40,200,255,0.95)' },
    // ── Efectos & Textura
    malla: { base: ['#060012','#00080e'], bgFn(ctx,W,H) {
      ctx.fillStyle='#040010'; ctx.fillRect(0,0,W,H);
      const hues=[260,200,295,170], pos=[[0.08,0.10],[0.92,0.10],[0.08,0.90],[0.92,0.90]];
      hues.forEach((h,i)=>{
        const rg=ctx.createRadialGradient(pos[i][0]*W,pos[i][1]*H,0,pos[i][0]*W,pos[i][1]*H,W*.65);
        rg.addColorStop(0,`hsla(${h},90%,55%,0.30)`); rg.addColorStop(0.5,`hsla(${h+20},80%,40%,0.10)`); rg.addColorStop(1,'transparent');
        ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);
      });
      const cg=ctx.createRadialGradient(W*.5,H*.5,0,W*.5,H*.5,W*.35);
      cg.addColorStop(0,'rgba(0,0,20,0.46)'); cg.addColorStop(1,'transparent');
      ctx.fillStyle=cg; ctx.fillRect(0,0,W,H);
      const vg=ctx.createRadialGradient(W*.5,H*.5,H*.12,W*.5,H*.5,W*.82);
      vg.addColorStop(0,'transparent'); vg.addColorStop(1,'rgba(0,0,10,0.72)');
      ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
    }, textActive:'#cc99ff', textDim:'rgba(200,160,255,0.60)', textPrev:'rgba(200,160,255,0.16)', progressBg:'rgba(160,80,255,0.09)', progressFg:'#9944ff', shadowActive:'rgba(180,100,255,0.92)' },
    magma: { base: ['#060100','#100200'], bgFn(ctx,W,H) {
      ctx.fillStyle='#050101'; ctx.fillRect(0,0,W,H);
      let rg=ctx.createRadialGradient(W*.5,H*.72,0,W*.5,H*.72,W*.58);
      rg.addColorStop(0,'rgba(220,70,0,0.40)'); rg.addColorStop(0.4,'rgba(160,30,0,0.18)'); rg.addColorStop(0.75,'rgba(80,10,0,0.08)'); rg.addColorStop(1,'transparent');
      ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);
      rg=ctx.createRadialGradient(W*.80,H*.28,0,W*.80,H*.28,W*.35);
      rg.addColorStop(0,'rgba(200,60,0,0.24)'); rg.addColorStop(0.5,'rgba(140,20,0,0.08)'); rg.addColorStop(1,'transparent');
      ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);
      rg=ctx.createRadialGradient(W*.5,H*.5,0,W*.5,H*.5,W*.26);
      rg.addColorStop(0,'rgba(20,4,2,0.68)'); rg.addColorStop(1,'transparent');
      ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);
      const tv=ctx.createLinearGradient(0,0,0,H*.35);
      tv.addColorStop(0,'rgba(0,0,0,0.72)'); tv.addColorStop(1,'transparent');
      ctx.fillStyle=tv; ctx.fillRect(0,0,W,H*.35);
    }, textActive:'#ff9944', textDim:'rgba(255,170,90,0.62)', textPrev:'rgba(255,140,60,0.18)', progressBg:'rgba(255,100,20,0.10)', progressFg:'#ee5500', shadowActive:'rgba(255,140,20,0.92)' },
    prismatico: { base: ['#04040a','#08061a'], bgFn(ctx,W,H) {
      ctx.fillStyle='#04040a'; ctx.fillRect(0,0,W,H);
      const hues=[270,220,180,140,70,30,0];
      hues.forEach((h,i)=>{
        const x0=W*(i/hues.length), bw=W/hues.length+2;
        const g=ctx.createLinearGradient(x0,0,x0+bw,H);
        g.addColorStop(0,`hsla(${h},100%,60%,0.12)`); g.addColorStop(1,`hsla(${(h+50)%360},100%,50%,0.07)`);
        ctx.fillStyle=g; ctx.fillRect(x0,0,bw,H);
      });
      ctx.fillStyle='rgba(4,4,8,0.52)'; ctx.fillRect(0,0,W,H);
      const vg=ctx.createRadialGradient(W*.5,H*.5,H*.08,W*.5,H*.5,W*.78);
      vg.addColorStop(0,'transparent'); vg.addColorStop(1,'rgba(2,2,8,0.68)');
      ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
    }, textActive:'#ffffff', textDim:'rgba(240,240,255,0.55)', textPrev:'rgba(240,240,255,0.16)', progressBg:'rgba(200,200,255,0.08)', progressFg:'#aaaaff', shadowActive:'rgba(255,255,255,0.65)' },
    cobre: { base: ['#0e0600','#1c0c02'], bgFn(ctx,W,H) {
      const g=ctx.createLinearGradient(0,0,W,H);
      g.addColorStop(0,'#0a0500'); g.addColorStop(0.38,'#1a0a02'); g.addColorStop(0.68,'#2c1206'); g.addColorStop(1,'#180800');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      const sg=ctx.createLinearGradient(W*.2,0,W*.8,H);
      sg.addColorStop(0,'transparent'); sg.addColorStop(0.4,'rgba(180,100,20,0.22)'); sg.addColorStop(0.6,'rgba(200,120,30,0.12)'); sg.addColorStop(1,'transparent');
      ctx.fillStyle=sg; ctx.fillRect(0,0,W,H);
      const tg=ctx.createRadialGradient(W*.35,H*.25,0,W*.35,H*.25,W*.45);
      tg.addColorStop(0,'rgba(200,110,20,0.20)'); tg.addColorStop(0.6,'rgba(160,70,10,0.07)'); tg.addColorStop(1,'transparent');
      ctx.fillStyle=tg; ctx.fillRect(0,0,W,H);
      const vg=ctx.createRadialGradient(W*.5,H*.5,H*.10,W*.5,H*.5,W*.80);
      vg.addColorStop(0,'transparent'); vg.addColorStop(1,'rgba(6,2,0,0.65)');
      ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
    }, textActive:'#ffbb44', textDim:'rgba(255,190,100,0.62)', textPrev:'rgba(255,175,80,0.17)', progressBg:'rgba(210,120,20,0.10)', progressFg:'#cc7710', shadowActive:'rgba(255,190,60,0.92)' },
    vino: { base: ['#0e0004','#200010'], bgFn(ctx,W,H) {
      const g=ctx.createLinearGradient(0,0,0,H);
      g.addColorStop(0,'#0a0004'); g.addColorStop(0.5,'#1c000e'); g.addColorStop(1,'#120018');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      const rg=ctx.createRadialGradient(W*.5,H*.5,0,W*.5,H*.5,W*.55);
      rg.addColorStop(0,'rgba(180,0,60,0.24)'); rg.addColorStop(0.45,'rgba(120,0,30,0.09)'); rg.addColorStop(1,'transparent');
      ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);
      const vg=ctx.createRadialGradient(W*.5,H*.5,H*.12,W*.5,H*.5,W*.80);
      vg.addColorStop(0,'transparent'); vg.addColorStop(1,'rgba(4,0,6,0.72)');
      ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
    }, textActive:'#ff6699', textDim:'rgba(255,140,175,0.60)', textPrev:'rgba(255,130,165,0.17)', progressBg:'rgba(220,30,80,0.09)', progressFg:'#cc2255', shadowActive:'rgba(255,80,130,0.92)' },
    // ── Gradientes & Motivos
    arcoiris: { base: ['#0a0010','#000a10'], bgFn(ctx,W,H) {
      ctx.fillStyle='#06000e'; ctx.fillRect(0,0,W,H);
      const g=ctx.createLinearGradient(0,H,W,0);
      g.addColorStop(0,'#1a0030'); g.addColorStop(0.16,'rgba(120,0,180,0.85)'); g.addColorStop(0.33,'rgba(0,50,220,0.8)'); g.addColorStop(0.50,'rgba(0,160,130,0.8)'); g.addColorStop(0.67,'rgba(50,190,0,0.7)'); g.addColorStop(0.83,'rgba(220,180,0,0.75)'); g.addColorStop(1,'rgba(200,0,60,0.85)');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      ctx.fillStyle='rgba(0,0,10,0.46)'; ctx.fillRect(0,0,W,H);
      const vg=ctx.createRadialGradient(W*.5,H*.5,H*.08,W*.5,H*.5,W*.82);
      vg.addColorStop(0,'transparent'); vg.addColorStop(1,'rgba(0,0,6,0.60)');
      ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
    }, textActive:'#ffffff', textDim:'rgba(255,255,255,0.55)', textPrev:'rgba(255,255,255,0.16)', progressBg:'rgba(200,100,255,0.10)', progressFg:'#cc44ff', shadowActive:'rgba(255,255,255,0.80)' },
    oceano_profundo: { base: ['#020814','#000c1a'], bgFn(ctx,W,H) {
      const g=ctx.createLinearGradient(0,0,0,H);
      g.addColorStop(0,'#020814'); g.addColorStop(0.45,'#001428'); g.addColorStop(1,'#000c1c');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      // Light rays from above
      ctx.save(); ctx.globalAlpha=0.14;
      for(let r=0;r<7;r++){
        const rx=W*(0.15+r*0.12); const rg2=ctx.createLinearGradient(rx,0,rx+W*0.04,H*0.7);
        rg2.addColorStop(0,'rgba(60,180,255,0.4)'); rg2.addColorStop(1,'transparent');
        ctx.fillStyle=rg2; ctx.beginPath(); ctx.moveTo(rx-W*0.02,0); ctx.lineTo(rx+W*0.06,H*0.7); ctx.lineTo(rx,H*0.7); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      const cg=ctx.createRadialGradient(W*.5,H*.3,0,W*.5,H*.3,W*.5);
      cg.addColorStop(0,'rgba(0,100,200,0.20)'); cg.addColorStop(1,'transparent');
      ctx.fillStyle=cg; ctx.fillRect(0,0,W,H);
      const vg=ctx.createRadialGradient(W*.5,H*.5,H*.10,W*.5,H*.5,W*.80);
      vg.addColorStop(0,'transparent'); vg.addColorStop(1,'rgba(0,2,10,0.72)');
      ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
    }, textActive:'#44ddff', textDim:'rgba(80,210,255,0.60)', textPrev:'rgba(80,200,255,0.17)', progressBg:'rgba(0,150,255,0.09)', progressFg:'#0099ee', shadowActive:'rgba(40,220,255,0.95)' },
    llamarada: { base: ['#0e0006','#140010'], bgFn(ctx,W,H) {
      ctx.fillStyle='#0c0008'; ctx.fillRect(0,0,W,H);
      const g=ctx.createLinearGradient(0,H,W,0);
      g.addColorStop(0,'rgba(220,30,0,0.90)'); g.addColorStop(0.4,'rgba(180,0,80,0.80)'); g.addColorStop(0.7,'rgba(120,0,160,0.70)'); g.addColorStop(1,'rgba(60,0,80,0.50)');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      // Centre glow
      const cg=ctx.createRadialGradient(W*.55,H*.45,0,W*.55,H*.45,W*.5);
      cg.addColorStop(0,'rgba(255,80,20,0.22)'); cg.addColorStop(0.5,'rgba(200,0,60,0.08)'); cg.addColorStop(1,'transparent');
      ctx.fillStyle=cg; ctx.fillRect(0,0,W,H);
      const vg=ctx.createRadialGradient(W*.5,H*.5,H*.10,W*.5,H*.5,W*.82);
      vg.addColorStop(0,'transparent'); vg.addColorStop(1,'rgba(4,0,4,0.70)');
      ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
    }, textActive:'#ff8844', textDim:'rgba(255,160,100,0.60)', textPrev:'rgba(255,140,80,0.17)', progressBg:'rgba(220,60,0,0.10)', progressFg:'#dd3300', shadowActive:'rgba(255,160,40,0.95)' },
    noche_estrellada: { base: ['#020412','#04081e'], bgFn(ctx,W,H) {
      const g=ctx.createLinearGradient(0,0,W*0.3,H);
      g.addColorStop(0,'#020415'); g.addColorStop(0.5,'#04081e'); g.addColorStop(1,'#060a28');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      // Milky way band
      const mw=ctx.createLinearGradient(W*0.1,0,W*0.7,H);
      mw.addColorStop(0,'transparent'); mw.addColorStop(0.35,'rgba(140,100,255,0.14)'); mw.addColorStop(0.55,'rgba(160,120,255,0.18)'); mw.addColorStop(1,'transparent');
      ctx.fillStyle=mw; ctx.fillRect(0,0,W,H);
      // Stars using seeded positions
      ctx.save(); ctx.fillStyle='#fff';
      for(let s=0;s<180;s++){
        const sx=((s*213.7)%1)*W; const sy=((s*137.5)%1)*H;
        const sr_=0.4+((s*97)%3)*0.4; const sa=0.3+((s*53)%10)*0.06;
        ctx.globalAlpha=sa; ctx.beginPath(); ctx.arc(sx,sy,sr_,0,Math.PI*2); ctx.fill();
      }
      ctx.restore();
      const vg=ctx.createRadialGradient(W*.5,H*.5,H*.12,W*.5,H*.5,W*.82);
      vg.addColorStop(0,'transparent'); vg.addColorStop(1,'rgba(0,0,8,0.65)');
      ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
    }, textActive:'#c8aaff', textDim:'rgba(200,180,255,0.55)', textPrev:'rgba(190,170,255,0.16)', progressBg:'rgba(120,80,255,0.09)', progressFg:'#7744ee', shadowActive:'rgba(200,160,255,0.90)' },
    vhs: { base: ['#040808','#000c0a'], bgFn(ctx,W,H) {
      ctx.fillStyle='#040808'; ctx.fillRect(0,0,W,H);
      // Scanlines
      ctx.save(); ctx.globalAlpha=0.07;
      for(let y=0;y<H;y+=3){ ctx.fillStyle='#000'; ctx.fillRect(0,y,W,1); }
      ctx.restore();
      // Green-teal vignette
      const rg=ctx.createRadialGradient(W*.5,H*.5,0,W*.5,H*.5,W*.55);
      rg.addColorStop(0,'rgba(0,140,100,0.20)'); rg.addColorStop(0.6,'rgba(0,80,60,0.06)'); rg.addColorStop(1,'transparent');
      ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);
      // Color bleed (red fringe left, cyan right, subtle)
      const bl=ctx.createLinearGradient(0,0,W*.12,0);
      bl.addColorStop(0,'rgba(200,0,0,0.09)'); bl.addColorStop(1,'transparent');
      ctx.fillStyle=bl; ctx.fillRect(0,0,W*.12,H);
      const br=ctx.createLinearGradient(W*.88,0,W,0);
      br.addColorStop(0,'transparent'); br.addColorStop(1,'rgba(0,200,200,0.08)');
      ctx.fillStyle=br; ctx.fillRect(W*.88,0,W*.12,H);
      const vg=ctx.createRadialGradient(W*.5,H*.5,H*.12,W*.5,H*.5,W*.80);
      vg.addColorStop(0,'transparent'); vg.addColorStop(1,'rgba(0,4,2,0.72)');
      ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
    }, textActive:'#88ffcc', textDim:'rgba(140,255,210,0.58)', textPrev:'rgba(130,250,200,0.16)', progressBg:'rgba(0,200,130,0.09)', progressFg:'#00bb88', shadowActive:'rgba(80,255,180,0.90)' },
    vintage_sepia: { base: ['#1a1005','#120c02'], bgFn(ctx,W,H) {
      const g=ctx.createLinearGradient(0,0,0,H);
      g.addColorStop(0,'#16100a'); g.addColorStop(0.5,'#1e1408'); g.addColorStop(1,'#120c04');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      // Sepia tint
      ctx.save(); ctx.globalAlpha=0.28; ctx.fillStyle='rgba(160,110,40,1)'; ctx.fillRect(0,0,W,H); ctx.restore();
      // Grain overlay
      ctx.save(); ctx.globalAlpha=0.05;
      for(let i=0;i<400;i++){
        const gx=Math.random()*W; const gy=Math.random()*H;
        ctx.fillStyle=Math.random()>0.5?'#fff':'#000';
        ctx.fillRect(gx,gy,1,1);
      }
      ctx.restore();
      // Vignette
      const vg=ctx.createRadialGradient(W*.5,H*.5,H*.15,W*.5,H*.5,W*.75);
      vg.addColorStop(0,'transparent'); vg.addColorStop(1,'rgba(8,4,0,0.78)');
      ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
    }, textActive:'#f5e0a0', textDim:'rgba(240,210,140,0.60)', textPrev:'rgba(235,200,130,0.17)', progressBg:'rgba(160,110,20,0.10)', progressFg:'#bb8812', shadowActive:'rgba(250,220,130,0.88)' },
    nevada: { base: ['#040c14','#061020'], bgFn(ctx,W,H) {
      const g=ctx.createLinearGradient(0,0,0,H);
      g.addColorStop(0,'#040c18'); g.addColorStop(0.5,'#08142a'); g.addColorStop(1,'#040c1c');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      // Aurora-like cold blue-white glow on horizon
      const ag=ctx.createLinearGradient(0,H*.55,0,H*.85);
      ag.addColorStop(0,'transparent'); ag.addColorStop(0.5,'rgba(100,200,255,0.12)'); ag.addColorStop(1,'transparent');
      ctx.fillStyle=ag; ctx.fillRect(0,H*.55,W,H*.3);
      // Snowflakes (static)
      ctx.save(); ctx.fillStyle='rgba(220,235,255,0.8)';
      for(let s=0;s<120;s++){
        const sx=((s*197.3)%1)*W; const sy=((s*113.5)%1)*H;
        const ss=0.5+((s*79)%3)*0.5; ctx.globalAlpha=0.25+((s*43)%10)*0.065;
        ctx.beginPath(); ctx.arc(sx,sy,ss,0,Math.PI*2); ctx.fill();
      }
      ctx.restore();
      const vg=ctx.createRadialGradient(W*.5,H*.5,H*.10,W*.5,H*.5,W*.80);
      vg.addColorStop(0,'transparent'); vg.addColorStop(1,'rgba(0,2,8,0.70)');
      ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
    }, textActive:'#d0eeff', textDim:'rgba(200,230,255,0.58)', textPrev:'rgba(190,225,255,0.16)', progressBg:'rgba(100,200,255,0.10)', progressFg:'#60b8ee', shadowActive:'rgba(220,240,255,0.90)' },
    nebulosa_cosmica: { base: ['#04020e','#08041a'], bgFn(ctx,W,H) {
      ctx.fillStyle='#04020e'; ctx.fillRect(0,0,W,H);
      // Multi-color nebula blobs
      const blobs=[{x:0.3,y:0.35,r:0.45,h:280,a:0.22},{x:0.72,y:0.6,r:0.4,h:310,a:0.18},{x:0.55,y:0.2,r:0.35,h:200,a:0.16},{x:0.15,y:0.75,r:0.30,h:250,a:0.14}];
      blobs.forEach(b=>{
        const rg=ctx.createRadialGradient(b.x*W,b.y*H,0,b.x*W,b.y*H,b.r*W);
        rg.addColorStop(0,`hsla(${b.h},90%,65%,${b.a*1.8})`); rg.addColorStop(0.4,`hsla(${(b.h+30)%360},80%,50%,${b.a})`); rg.addColorStop(0.75,`hsla(${(b.h+60)%360},70%,40%,${b.a*0.4})`); rg.addColorStop(1,'transparent');
        ctx.fillStyle=rg; ctx.fillRect(0,0,W,H);
      });
      // Star field
      ctx.save(); ctx.fillStyle='#fff';
      for(let s=0;s<160;s++){
        const sx=((s*211.7)%1)*W; const sy=((s*141.5)%1)*H; const sr_=0.3+((s*89)%4)*0.3;
        ctx.globalAlpha=0.2+((s*57)%10)*0.07; ctx.beginPath(); ctx.arc(sx,sy,sr_,0,Math.PI*2); ctx.fill();
      }
      ctx.restore();
      const vg=ctx.createRadialGradient(W*.5,H*.5,H*.10,W*.5,H*.5,W*.82);
      vg.addColorStop(0,'transparent'); vg.addColorStop(1,'rgba(2,0,8,0.70)');
      ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
    }, textActive:'#ee99ff', textDim:'rgba(230,170,255,0.58)', textPrev:'rgba(220,160,255,0.16)', progressBg:'rgba(180,60,255,0.10)', progressFg:'#aa22ee', shadowActive:'rgba(240,160,255,0.92)' },
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

    lluvia: (ctx, W, H, t) => {
      DATA.rain.forEach(r => {
        const y = (r.y + t * r.spd) % 1;
        const x = r.x;
        const px = x * W, py = y * H;
        const plen = r.len * H;
        ctx.globalAlpha = r.al * Math.min(1, y * 12, (1 - y) * 12);
        const g = ctx.createLinearGradient(px, py, px - plen * 0.18, py + plen);
        g.addColorStop(0, 'rgba(180,220,255,0.9)'); g.addColorStop(1, 'transparent');
        ctx.strokeStyle = g; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - plen * 0.18, py + plen); ctx.stroke();
      });
      ctx.globalAlpha = 1;
    },

    tunel: (ctx, W, H, t) => {
      const cx = W * 0.5, cy = H * 0.5;
      for (let ring = 20; ring > 0; ring--) {
        const prog = ((ring / 20 + t * 0.22) % 1);
        const r = prog * Math.min(W, H) * 0.65;
        const hue = (t * 30 + ring * 18) % 360;
        const al = (1 - prog) * 0.18;
        ctx.globalAlpha = al;
        ctx.strokeStyle = `hsl(${hue},100%,70%)`;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.rect(cx - r * 0.88, cy - r * 0.5, r * 1.76, r); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },

    latido: (ctx, W, H, t) => {
      const cx = W * 0.5, cy = H * 0.5;
      const beat = 0.5 + 0.5 * Math.sin(t * 4.8);
      for (let i = 0; i < 5; i++) {
        const r = (0.12 + i * 0.09) * Math.min(W, H) * (0.9 + beat * 0.1);
        const hue = 350 + i * 8;
        const al = (0.3 - i * 0.05) * (0.4 + beat * 0.6);
        ctx.globalAlpha = al;
        const g = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r);
        g.addColorStop(0, `hsla(${hue},100%,65%,0.6)`);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.28); ctx.fill();
      }
      ctx.globalAlpha = 1;
    },

    diamante: (ctx, W, H, t) => {
      DATA.diamonds.forEach(d => {
        const yFrac = (d.y + t * d.spd) % 1;
        const px = d.x * W, py = yFrac * H, sz = d.sz * W;
        const rot = d.rot + t * d.rotSpd;
        const hue = (d.hue + t * 20) % 360;
        const fade = Math.min(1, Math.min(yFrac * 8, (1 - yFrac) * 8));
        ctx.globalAlpha = fade * 0.7;
        ctx.save(); ctx.translate(px, py); ctx.rotate(rot);
        const g = ctx.createLinearGradient(-sz, -sz, sz, sz);
        g.addColorStop(0, `hsla(${hue},100%,90%,0.9)`);
        g.addColorStop(0.5, `hsla(${(hue+60)%360},100%,70%,0.6)`);
        g.addColorStop(1, `hsla(${(hue+120)%360},100%,90%,0.9)`);
        ctx.strokeStyle = g; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0,-sz); ctx.lineTo(sz*0.6,0); ctx.lineTo(0,sz); ctx.lineTo(-sz*0.6,0); ctx.closePath(); ctx.stroke();
        ctx.fillStyle = `hsla(${hue},100%,90%,0.08)`; ctx.fill();
        ctx.restore();
      });
      ctx.globalAlpha = 1;
    },

    vortex: (ctx, W, H, t) => {
      const cx = W * 0.5, cy = H * 0.5;
      for (let i = 0; i < 180; i++) {
        const ang = (i / 180) * Math.PI * 2 + t * 0.4;
        const radius = (i / 180) * Math.min(W, H) * 0.42;
        const spiral = radius + Math.sin(i * 0.18 + t * 2.2) * 12;
        const px = cx + Math.cos(ang) * spiral;
        const py = cy + Math.sin(ang) * spiral * 0.55;
        const hue = (i * 2 + t * 40) % 360;
        ctx.globalAlpha = 0.22 * (i / 180);
        ctx.fillStyle = `hsl(${hue},100%,72%)`;
        const sz = (i / 180) * 2.2 + 0.4;
        ctx.beginPath(); ctx.arc(px, py, sz, 0, 6.28); ctx.fill();
      }
      ctx.globalAlpha = 1;
    },

    nebulosa: (ctx, W, H, t) => {
      const clouds = [
        {x:0.15,y:0.2,r:0.38,hue:260,spd:0.04,ph:0},
        {x:0.75,y:0.55,r:0.32,hue:180,spd:0.06,ph:2.1},
        {x:0.45,y:0.8,r:0.28,hue:320,spd:0.05,ph:4.2},
        {x:0.85,y:0.15,r:0.22,hue:60,spd:0.07,ph:1.0},
      ];
      clouds.forEach(c => {
        const pulse = 0.6 + 0.4 * Math.sin(t * c.spd * 8 + c.ph);
        const cx2 = c.x * W + Math.sin(t * c.spd + c.ph) * W * 0.04;
        const cy2 = c.y * H + Math.cos(t * c.spd * 0.7 + c.ph) * H * 0.04;
        const g = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, c.r * W);
        g.addColorStop(0, `hsla(${c.hue},80%,60%,${0.12 * pulse})`);
        g.addColorStop(0.4, `hsla(${(c.hue+40)%360},70%,50%,${0.06 * pulse})`);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      });
      DATA.stars.slice(0,80).forEach(s => {
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * s.spd + s.ph));
        ctx.globalAlpha = s.a * tw * 0.55;
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x*W, s.y*H, s.r*0.6, 0, 6.28); ctx.fill();
      });
      ctx.globalAlpha = 1;
    },

    fuego: (ctx, W, H, t) => {
      DATA.flameParticles.forEach(f => {
        const y = 1 - ((t * f.spd + f.ph / 6.28) % 1);
        const x = f.x + Math.sin(t * 1.2 + f.ph + y * 3) * f.wob;
        const fade = Math.min(1, y * 10) * (1 - Math.pow(y, 1.5));
        if (fade < 0.02) return;
        const sz = (f.sz + (1 - y) * f.sz * 1.5) * W;
        const hue = f.hue + y * 40;
        ctx.globalAlpha = fade * 0.72;
        const g = ctx.createRadialGradient(x*W, y*H, 0, x*W, y*H, sz);
        g.addColorStop(0, `hsla(${hue+40},100%,92%,1)`);
        g.addColorStop(0.4, `hsla(${hue},100%,60%,0.65)`);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x*W, y*H, sz, 0, 6.28); ctx.fill();
      });
      ctx.globalAlpha = 1;
    },

    humo: (ctx, W, H, t) => {
      DATA.orbs.slice(0, 30).forEach(p => {
        const y = 1 - ((p.y + t * p.spd * 0.5) % 1);
        const x = p.x + Math.sin(t * 0.3 + p.ph) * 0.06;
        const fade = Math.min(1, Math.min(y * 5, (1 - y) * 5)) * 0.22;
        if (fade < 0.01) return;
        const r = (p.r * 6 + y * 38) * W / 400;
        ctx.globalAlpha = fade;
        ctx.fillStyle = 'rgba(190,185,210,0.45)';
        ctx.beginPath(); ctx.arc(x * W, y * H, r, 0, 6.28); ctx.fill();
      });
      ctx.globalAlpha = 1;
    },

    eq_bars: (ctx, W, H, t) => {
      const n = DATA.eqBars.length, gap = W / n, bw = gap * 0.72;
      for (let i = 0; i < n; i++) {
        const b = DATA.eqBars[i];
        const h = (0.08 + 0.58 * (0.5 + 0.5 * Math.sin(t * b.spd + b.ph))) * H;
        const x = i * gap + (gap - bw) / 2;
        const hue = (b.hue + t * 18) % 360;
        const g = ctx.createLinearGradient(0, H, 0, H - h);
        g.addColorStop(0, `hsla(${hue},100%,55%,0.38)`);
        g.addColorStop(0.7, `hsla(${(hue+40)%360},100%,72%,0.2)`);
        g.addColorStop(1, `hsla(${hue},100%,92%,0.06)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.roundRect(x, H - h, bw, h, bw / 4); ctx.fill();
      }
    },

    relampage: (ctx, W, H, t) => {
      DATA.lightSeeds.forEach(ls => {
        const phase = (t + ls.off) % ls.interval;
        if (phase > 0.55) return;
        const flash = 1 - phase / 0.55;
        ctx.globalAlpha = flash * 0.75;
        let lx = ls.x * W, ly = 0;
        ctx.strokeStyle = `rgba(255,255,200,${flash})`;
        ctx.lineWidth = Math.max(1.5, 2.5 * flash * W / 1920);
        ctx.shadowColor = '#ffffaa'; ctx.shadowBlur = 22 * flash;
        ctx.beginPath(); ctx.moveTo(lx, ly);
        const segH = H / ls.segs;
        for (let i = 0; i < ls.segs; i++) {
          lx += (sr(i + ls.x * 1000 + Math.floor(t / ls.interval) * 17) - 0.5) * W * 0.18;
          ly += segH;
          ctx.lineTo(clampN(lx, 0, W), ly);
        }
        ctx.stroke(); ctx.shadowBlur = 0;
      });
      ctx.globalAlpha = 1; ctx.lineWidth = 1;
    },

    pixeles: (ctx, W, H, t) => {
      const sz = Math.round(W / 56), cols = Math.ceil(W / sz), rows = Math.ceil(H / sz);
      for (let r = 0; r < rows; r += 2) {
        for (let c = 0; c < cols; c += 2) {
          const blink = Math.abs(Math.sin(t * (sr(r * 97 + c) * 3.5 + 0.4) + sr(c * 97 + r) * 6.28));
          if (blink < 0.74) continue;
          const hue = (r * 7 + c * 11 + t * 22) % 360;
          ctx.globalAlpha = (blink - 0.74) * 0.32;
          ctx.fillStyle = `hsl(${hue},90%,72%)`;
          ctx.fillRect(c * sz, r * sz, sz - 1, sz - 1);
        }
      }
      ctx.globalAlpha = 1;
    },

    cristal: (ctx, W, H, t) => {
      DATA.crystalShards.forEach(s => {
        const yFrac = (s.y + t * s.spd) % 1;
        const x = s.x * W, y = yFrac * H, sz = s.sz * W;
        const rot = s.rot + t * s.rotSpd;
        const hue = (s.hue + t * 18) % 360;
        const fade = Math.min(1, Math.min(yFrac * 8, (1 - yFrac) * 8)) * 0.65;
        ctx.globalAlpha = fade;
        ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
        const pts = [[0,-sz],[sz*0.55,-sz*0.2],[sz*0.45,sz*0.7],[0,sz*0.4],[-sz*0.45,sz*0.7],[-sz*0.55,-sz*0.2]];
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
        pts.slice(1).forEach(p => ctx.lineTo(p[0], p[1])); ctx.closePath();
        const g = ctx.createLinearGradient(-sz, -sz, sz, sz);
        g.addColorStop(0, `hsla(${hue},90%,95%,0.6)`);
        g.addColorStop(0.5, `hsla(${(hue+60)%360},80%,70%,0.22)`);
        g.addColorStop(1, `hsla(${(hue+120)%360},90%,90%,0.5)`);
        ctx.fillStyle = g; ctx.fill();
        ctx.strokeStyle = `hsla(${hue},100%,90%,0.7)`; ctx.lineWidth = 1; ctx.stroke();
        ctx.restore();
      });
      ctx.globalAlpha = 1;
    },

    // ── Espacio ─────────────────────────────
    meteoritos: (ctx, W, H, t) => {
      DATA.meteors.forEach(m => {
        const cycle = (t + m.off) % m.interval;
        if (cycle > 2.2) return;
        const p = cycle / 2.2;
        const x1 = m.x0 * W, y1 = m.y0 * H;
        const len = m.len * W;
        const x2 = x1 + Math.cos(m.ang) * len * p;
        const y2 = y1 + Math.sin(m.ang) * len * p;
        ctx.globalAlpha = (1 - p * 0.85) * 0.9;
        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, 'rgba(255,255,255,0.95)');
        grad.addColorStop(0.3, 'rgba(180,200,255,0.5)');
        grad.addColorStop(1, 'transparent');
        ctx.strokeStyle = grad; ctx.lineWidth = (2.5 - p * 1.5) * W / 1920;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        if (p < 0.15) {
          const gF = (0.15 - p) / 0.15;
          ctx.globalAlpha = gF * 0.8;
          const glow = ctx.createRadialGradient(x1, y1, 0, x1, y1, 14 * W / 1920);
          glow.addColorStop(0, 'rgba(255,255,220,0.85)'); glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x1, y1, 14 * W / 1920, 0, 6.28); ctx.fill();
        }
      });
      ctx.globalAlpha = 1; ctx.lineWidth = 1;
    },

    agujero_negro: (ctx, W, H, t) => {
      const cx = W * 0.5, cy = H * 0.5;
      const maxR = Math.min(W, H) * 0.44;
      // Disco de acreción con múltiples capas y distorsión
      for (let layer = 0; layer < 3; layer++) {
        for (let i = 0; i < 180; i++) {
          const spiralSpeed = 0.6 - layer * 0.15;
          const ang = (i / 180) * Math.PI * 2 + t * spiralSpeed + layer * 0.8;
          const spiralT = ((i / 180) + t * (0.12 - layer * 0.02)) % 1;
          const baseR = (0.25 + layer * 0.25) * maxR;
          const r = baseR + spiralT * maxR * (0.5 - layer * 0.1);
          // Distorsión gravitacional
          const distortFactor = 1 + (1 - spiralT) * 0.4 * Math.sin(ang * 3 + t * 2);
          const rx = cx + Math.cos(ang) * r * distortFactor;
          const ry = cy + Math.sin(ang) * r * 0.25 * distortFactor;
          const hue = (240 + layer * 30 + i * 0.8 + t * 20) % 360;
          const intensity = (1 - spiralT) * (0.9 - layer * 0.2);
          ctx.globalAlpha = intensity * 0.35;
          const particleSize = (1.8 + (1 - spiralT) * 2.5 - layer * 0.3) * W / 1920;
          // Glow effect
          const glowG = ctx.createRadialGradient(rx, ry, 0, rx, ry, particleSize * 2);
          glowG.addColorStop(0, `hsla(${hue},100%,${65 + intensity * 20}%,${intensity})`);
          glowG.addColorStop(0.5, `hsla(${hue},90%,50%,${intensity * 0.5})`);
          glowG.addColorStop(1, 'transparent');
          ctx.fillStyle = glowG;
          ctx.beginPath(); ctx.arc(rx, ry, particleSize * 2, 0, 6.28); ctx.fill();
        }
      }
      // Anillo de fotones más brillante
      const photonRing = maxR * 0.38;
      for (let i = 0; i < 120; i++) {
        const ang = (i / 120) * Math.PI * 2 + t * 1.2;
        const wobble = 1 + Math.sin(ang * 5 + t * 3) * 0.08;
        const rx = cx + Math.cos(ang) * photonRing * wobble;
        const ry = cy + Math.sin(ang) * photonRing * 0.25 * wobble;
        const pulse = 0.7 + 0.3 * Math.sin(t * 4 + i * 0.1);
        ctx.globalAlpha = 0.6 * pulse;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#88ccff'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(rx, ry, 2.5 * W / 1920, 0, 6.28); ctx.fill();
      }
      ctx.shadowBlur = 0;
      // Horizonte de eventos con gradiente más suave
      const ehR = 62 * W / 1920;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, ehR * 1.5);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(0.4, 'rgba(0,0,0,0.98)');
      g.addColorStop(0.7, 'rgba(5,5,15,0.85)');
      g.addColorStop(1, 'transparent');
      ctx.globalAlpha = 1; ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, ehR * 1.5, 0, 6.28); ctx.fill();
      // Borde del horizonte con glow azulado
      ctx.globalAlpha = 0.4;
      const edgeG = ctx.createRadialGradient(cx, cy, ehR * 0.95, cx, cy, ehR * 1.1);
      edgeG.addColorStop(0, 'transparent');
      edgeG.addColorStop(0.5, 'rgba(100,150,255,0.3)');
      edgeG.addColorStop(1, 'transparent');
      ctx.fillStyle = edgeG;
      ctx.beginPath(); ctx.arc(cx, cy, ehR * 1.1, 0, 6.28); ctx.fill();
      ctx.globalAlpha = 1;
    },

    // ── Naturaleza ──────────────────────────
    tormenta: (ctx, W, H, t) => {
      ctx.fillStyle = 'rgba(0,5,20,0.06)'; ctx.fillRect(0, 0, W, H);
      DATA.rain.forEach(r => {
        const y = (r.y + t * r.spd * 2.2) % 1;
        const px = r.x * W, py = y * H, plen = r.len * H * 1.8;
        ctx.globalAlpha = r.al * Math.min(1, y * 10) * 0.7;
        const g = ctx.createLinearGradient(px, py, px - plen * 0.15, py + plen);
        g.addColorStop(0, 'rgba(160,190,255,0.9)'); g.addColorStop(1, 'transparent');
        ctx.strokeStyle = g; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - plen * 0.15, py + plen); ctx.stroke();
      });
      DATA.lightSeeds.forEach(ls => {
        const phase = (t * 0.85 + ls.off * 0.5) % ls.interval;
        if (phase > 0.35) return;
        const flash = 1 - phase / 0.35;
        ctx.globalAlpha = flash * 0.85;
        let lx = ls.x * W, ly = 0;
        ctx.strokeStyle = `rgba(200,220,255,${flash})`; ctx.lineWidth = Math.max(1, 2 * flash * W / 1920);
        ctx.shadowColor = '#aaccff'; ctx.shadowBlur = 30 * flash;
        ctx.beginPath(); ctx.moveTo(lx, ly);
        for (let i = 0; i < ls.segs + 2; i++) {
          lx += (sr(i + ls.x * 800 + Math.floor(t * 0.85 / ls.interval) * 31) - 0.5) * W * 0.2;
          ly += H / (ls.segs + 2);
          ctx.lineTo(clampN(lx, 0, W), ly);
        }
        ctx.stroke(); ctx.shadowBlur = 0;
      });
      ctx.globalAlpha = 1; ctx.lineWidth = 1;
    },

    // ── Energía ─────────────────────────────
    plasma: (ctx, W, H, t) => {
      DATA.plasmaBlobs.forEach(b => {
        const bx = ((b.x + Math.sin(t * b.spdX * 6 + b.ph) * 0.3) + 1) % 1;
        const by2 = ((b.y + Math.sin(t * b.spdY * 5 + b.ph * 1.3) * 0.3) + 1) % 1;
        const g = ctx.createRadialGradient(bx * W, by2 * H, 0, bx * W, by2 * H, b.r * W);
        g.addColorStop(0, `hsla(${(b.hue + t * 25) % 360},100%,68%,0.38)`);
        g.addColorStop(0.45, `hsla(${(b.hue + 60 + t * 15) % 360},90%,55%,0.16)`);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx * W, by2 * H, b.r * W, 0, 6.28); ctx.fill();
      });
    },

    ondas: (ctx, W, H, t) => {
      const cx = W * 0.5, cy = H * 0.5;
      for (let wave = 0; wave < 8; wave++) {
        const prog = ((wave / 8) + t * 0.28) % 1;
        const r = prog * Math.min(W, H) * 0.55;
        const hue = (t * 30 + wave * 45) % 360;
        const al = (1 - prog) * 0.25;
        const grad = ctx.createRadialGradient(cx, cy, r * 0.95, cx, cy, r);
        grad.addColorStop(0, `hsla(${hue},100%,70%,${al * 1.6})`);
        grad.addColorStop(1, `hsla(${hue},100%,70%,0)`);
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.28); ctx.fill();
      }
    },

    // ── Geométrico ──────────────────────────
    mandala: (ctx, W, H, t) => {
      const cx = W * 0.5, cy = H * 0.5, sym = 8;
      ctx.save(); ctx.translate(cx, cy);
      for (let layer = 1; layer <= 5; layer++) {
        const rot = t * (layer % 2 === 0 ? 0.25 : -0.18) + layer * 0.4;
        const r = layer * Math.min(W, H) * 0.07;
        const hue = (t * 20 + layer * 72) % 360;
        for (let k = 0; k < sym; k++) {
          ctx.save(); ctx.rotate((k / sym) * Math.PI * 2 + rot);
          ctx.globalAlpha = 0.2;
          ctx.strokeStyle = `hsl(${hue},100%,70%)`; ctx.lineWidth = 1.2;
          ctx.beginPath();
          for (let j = 0; j <= sym; j++) {
            const a = (j / sym) * Math.PI * 2, rr = r * (0.65 + 0.35 * Math.sin(a * 3 + t));
            j === 0 ? ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
          }
          ctx.closePath(); ctx.stroke();
          ctx.globalAlpha = 0.14;
          ctx.beginPath(); ctx.ellipse(r * 1.5, 0, r * 0.55, r * 0.22, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(${(hue + 40) % 360},100%,80%,0.4)`; ctx.stroke();
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1; ctx.restore();
    },

    espiral: (ctx, W, H, t) => {
      const cx = W * 0.5, cy = H * 0.5;
      ctx.save(); ctx.translate(cx, cy);
      for (let arm = 0; arm < 3; arm++) {
        const armRot = (arm / 3) * Math.PI * 2 + t * 0.2;
        for (let i = 1; i < 120; i++) {
          const ang = armRot + (i / 120) * Math.PI * 5;
          const r = (i / 120) * Math.min(W, H) * 0.44;
          const hue = (arm * 120 + i * 2.5 + t * 25) % 360;
          ctx.globalAlpha = (i / 120) * 0.22;
          ctx.fillStyle = `hsl(${hue},100%,72%)`;
          ctx.beginPath(); ctx.arc(Math.cos(ang) * r, Math.sin(ang) * r * 0.55, (i / 120) * 2.2 + 0.5, 0, 6.28); ctx.fill();
        }
      }
      ctx.globalAlpha = 1; ctx.restore();
    },

    // ── Digital ─────────────────────────────
    glitch: (ctx, W, H, t) => {
      const glitchCycle = (t * 1.8) % 3;
      if (glitchCycle > 0.55) return;
      const intensity = 1 - glitchCycle / 0.55;
      const bands = 4 + Math.floor(intensity * 9);
      for (let i = 0; i < bands; i++) {
        const gy = sr(i * 3 + Math.floor(t * 7) * 13) * H;
        const gh = sr(i * 3 + 1 + Math.floor(t * 7) * 13) * H * 0.08 + 3;
        const shift = (sr(i * 3 + 2) - 0.5) * W * 0.07 * intensity;
        const hue = sr(i + Math.floor(t * 5)) * 360;
        ctx.globalAlpha = intensity * 0.22;
        ctx.fillStyle = `hsl(${hue},100%,70%)`;
        ctx.fillRect(shift, gy, W - Math.abs(shift), gh);
      }
      ctx.globalAlpha = 1;
    },

    binario: (ctx, W, H, t) => {
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, 0, W, H);
      const colW = W / DATA.mCols.length, charH = colW * 1.3;
      ctx.textAlign = 'center';
      DATA.mCols.forEach(col => {
        const x = col.xFrac * W + colW * 0.5;
        for (let row = 0; row < 25; row++) {
          const rawY = (t * col.spd * 0.7 * charH + col.off * charH - row * charH);
          const y = ((rawY % (H + charH * 25)) + H + charH * 25) % (H + charH * 25) - charH;
          if (y < -charH || y > H + charH) continue;
          const fade = 1 - row / 25;
          ctx.globalAlpha = fade * col.al * 0.9;
          ctx.fillStyle = row === 0 ? '#ffffff' : row < 3 ? '#88ffcc' : '#00aa44';
          ctx.font = `bold ${Math.round(colW * 0.95)}px monospace`;
          const bit = Math.floor(sr(row + col.xFrac * 1000 + Math.floor(t * col.spd * 2)) * 2);
          ctx.fillText(bit.toString(), x, y);
        }
      });
      ctx.globalAlpha = 1; ctx.textAlign = 'left';
    },

    // ── Música ──────────────────────────────
    vinilo: (ctx, W, H, t) => {
      const cx = W * 0.5, cy = H * 0.5, radius = Math.min(W, H) * 0.28;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.8);
      ctx.globalAlpha = 0.55;
      const diskG = ctx.createRadialGradient(0, 0, radius * 0.08, 0, 0, radius);
      diskG.addColorStop(0, 'rgba(40,20,60,0.75)'); diskG.addColorStop(0.14, 'rgba(20,10,40,0.6)');
      diskG.addColorStop(0.15, 'rgba(80,50,120,0.5)'); diskG.addColorStop(1, 'rgba(15,8,30,0.65)');
      ctx.fillStyle = diskG; ctx.beginPath(); ctx.arc(0, 0, radius, 0, 6.28); ctx.fill();
      for (let g2 = 3; g2 < 14; g2++) {
        ctx.globalAlpha = 0.08;
        ctx.strokeStyle = `hsl(${t * 20 + g2 * 25},80%,70%)`; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.arc(0, 0, radius * (g2 / 14), 0, 6.28); ctx.stroke();
      }
      ctx.globalAlpha = 0.6;
      const lbl = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.15);
      lbl.addColorStop(0, `hsl(${(t * 30) % 360},90%,65%)`);
      lbl.addColorStop(1, `hsl(${(t * 30 + 120) % 360},80%,45%)`);
      ctx.fillStyle = lbl; ctx.beginPath(); ctx.arc(0, 0, radius * 0.15, 0, 6.28); ctx.fill();
      ctx.restore(); ctx.globalAlpha = 1;
    },

    ondas_sonido: (ctx, W, H, t) => {
      for (let li = 0; li < 3; li++) {
        const yBase = H * 0.5 + (li - 1) * H * 0.12;
        const hue = (li * 120 + t * 20) % 360;
        const amp = H * (0.06 + 0.04 * Math.sin(t * 1.2 + li));
        ctx.beginPath(); ctx.moveTo(0, yBase);
        for (let x = 0; x <= W; x += 4) {
          const y = yBase
            + Math.sin(x / W * Math.PI * 2 * (4 + li * 2.5) + t * (1.4 + li * 0.3)) * amp
            + Math.sin(x / W * Math.PI * 3 + t * 0.8) * amp * 0.3;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `hsla(${hue},100%,72%,0.25)`; ctx.lineWidth = 1.8; ctx.stroke();
        ctx.lineTo(W, yBase); ctx.lineTo(0, yBase);
        ctx.fillStyle = `hsla(${hue},100%,60%,0.05)`; ctx.fill();
      }
      ctx.globalAlpha = 1;
    },

    // ── Parlantes Neon ─────────────────────────
    parlantes_neon: (ctx, W, H, t) => {
      const π2 = Math.PI * 2, mWH = Math.min(W, H), lw = W / 1920;

      // ── Dos parlantes: izquierdo y derecho ──
      const spks = [
        { cx: W * 0.048, cy: H * 0.5, openDir: 0,          hBase: 195 },
        { cx: W * 0.952, cy: H * 0.5, openDir: Math.PI,    hBase: 295 },
      ];

      spks.forEach((sp, si) => {
        const spHue  = (sp.hBase + t * 22) % 360;
        const coneR  = mWH * 0.068;
        const cabW   = mWH * 0.052;
        const cabH   = mWH * 0.200;
        const cabX   = sp.cx - cabW * 0.5;
        const cabY   = sp.cy - cabH * 0.5;

        ctx.save();
        ctx.shadowColor = `hsl(${spHue},100%,58%)`;
        ctx.shadowBlur   = 18 * lw;
        ctx.globalAlpha  = 0.84;

        // Caja del parlante
        const cabG = ctx.createLinearGradient(cabX, cabY, cabX + cabW, cabY + cabH);
        cabG.addColorStop(0, `hsla(${spHue},80%,9%,0.88)`);
        cabG.addColorStop(1, `hsla(${spHue},70%,5%,0.94)`);
        ctx.fillStyle   = cabG;
        ctx.strokeStyle = `hsl(${spHue},100%,60%)`;
        ctx.lineWidth   = 1.8 * lw;
        ctx.beginPath(); ctx.roundRect(cabX, cabY, cabW, cabH, mWH * 0.011); ctx.fill(); ctx.stroke();

        // Wófer: círculos concéntricos
        const coneY = sp.cy + mWH * 0.010;
        for (let ring = 4; ring >= 0; ring--) {
          const rR      = coneR * (0.17 + ring * 0.20);
          const ringHue = (spHue + ring * 18) % 360;
          ctx.globalAlpha  = 0.48 - ring * 0.06;
          ctx.strokeStyle  = `hsl(${ringHue},100%,${62 + ring * 4}%)`;
          ctx.lineWidth    = (1.2 - ring * 0.10) * lw;
          ctx.shadowColor  = `hsl(${ringHue},100%,60%)`;
          ctx.shadowBlur   = 6 * lw;
          ctx.beginPath(); ctx.arc(sp.cx, coneY, rR, 0, π2); ctx.stroke();
        }
        // Relleno del wófer
        ctx.globalAlpha = 0.88; ctx.shadowBlur = 0;
        const cG = ctx.createRadialGradient(sp.cx - coneR * 0.22, coneY - coneR * 0.22, 0, sp.cx, coneY, coneR);
        cG.addColorStop(0, `hsla(${spHue},100%,74%,0.38)`);
        cG.addColorStop(0.5, `hsla(${spHue},90%,42%,0.25)`);
        cG.addColorStop(1, `hsla(${spHue},80%,12%,0.62)`);
        ctx.fillStyle = cG; ctx.beginPath(); ctx.arc(sp.cx, coneY, coneR, 0, π2); ctx.fill();

        // Tweeter (pequeño, arriba)
        const twY = sp.cy - mWH * 0.060, twR = mWH * 0.014;
        const twH  = (sp.hBase + 35 + t * 22) % 360;
        ctx.globalAlpha  = 0.82;
        ctx.strokeStyle  = `hsl(${twH},100%,70%)`;
        ctx.lineWidth    = 1.5 * lw;
        ctx.shadowColor  = `hsl(${twH},100%,68%)`;
        ctx.shadowBlur   = 10 * lw;
        ctx.beginPath(); ctx.arc(sp.cx, twY, twR, 0, π2); ctx.stroke();
        ctx.fillStyle   = `hsla(${twH},100%,78%,0.28)`; ctx.fill();
        // Punto central del tweeter
        ctx.globalAlpha = 0.92;
        ctx.shadowBlur  = 14 * lw;
        const twG = ctx.createRadialGradient(sp.cx, twY, 0, sp.cx, twY, twR * 1.6);
        twG.addColorStop(0, `hsla(${twH},100%,95%,0.90)`);
        twG.addColorStop(1, 'transparent');
        ctx.fillStyle = twG; ctx.beginPath(); ctx.arc(sp.cx, twY, twR * 1.6, 0, π2); ctx.fill();
        ctx.fillStyle = `hsl(${twH},100%,92%)`;
        ctx.beginPath(); ctx.arc(sp.cx, twY, twR * 0.28, 0, π2); ctx.fill();

        ctx.shadowBlur = 0; ctx.restore();

        // ── Ondas de sonido en arco ──
        for (let w = 0; w < 9; w++) {
          const phase  = ((t * 0.52 + w / 9) % 1);
          const wR     = phase * W * 0.78;
          const wHue   = (sp.hBase + w * 44 + t * 28) % 360;
          const alpha  = Math.pow(1 - phase, 1.7) * 0.52;
          if (alpha < 0.01) continue;
          ctx.save();
          ctx.globalAlpha  = alpha;
          ctx.shadowColor  = `hsl(${wHue},100%,62%)`;
          ctx.shadowBlur   = 8 * (1 - phase) * lw * 1920 / W; // scale-neutral blur
          ctx.strokeStyle  = `hsl(${wHue},100%,68%)`;
          ctx.lineWidth    = (3.0 - phase * 2.0) * lw;
          ctx.beginPath();
          ctx.arc(sp.cx, sp.cy, wR, sp.openDir - Math.PI * 0.5, sp.openDir + Math.PI * 0.5);
          ctx.stroke();
          ctx.shadowBlur = 0; ctx.restore();
        }
      });

      // ── Barras de ecualizador neon, centro inferior ──
      const eqN = 28, eqTW = W * 0.44, eqX0 = W * 0.28;
      const eqBW = (eqTW / eqN) * 0.64, eqGap = eqTW / eqN;
      const maxBH = H * 0.092, eqY = H * 0.906;
      for (let i = 0; i < eqN; i++) {
        const b    = DATA.eqBars[i];
        const barH = (0.11 + 0.89 * (0.5 + 0.5 * Math.sin(t * b.spd + b.ph))) * maxBH;
        const bx   = eqX0 + i * eqGap;
        const hue  = (174 + i * (188 / eqN) + t * 25) % 360;
        ctx.save();
        ctx.globalAlpha  = 0.80;
        ctx.shadowColor  = `hsl(${hue},100%,62%)`;
        ctx.shadowBlur   = 7 * lw;
        const bg = ctx.createLinearGradient(0, eqY, 0, eqY - barH);
        bg.addColorStop(0, `hsla(${hue},100%,52%,0.92)`);
        bg.addColorStop(1, `hsla(${(hue + 58) % 360},100%,80%,0.55)`);
        ctx.fillStyle = bg;
        ctx.beginPath(); ctx.roundRect(bx, eqY - barH, eqBW, barH, eqBW * 0.38); ctx.fill();
        ctx.shadowBlur = 0; ctx.restore();
      }
      ctx.globalAlpha = 1;
    },

    // ── Festivo ─────────────────────────────
    globos: (ctx, W, H, t) => {
      ctx.save();
      DATA.balloons.forEach(b => {
        const yFrac = 1 - ((b.y + t * b.spd) % 1);
        const xFrac = b.x + Math.sin(t * 0.4 + b.ph) * b.drift * 10;
        const fade = Math.min(1, Math.min(yFrac * 6, (1 - yFrac) * 6)) * 0.7;
        if (fade < 0.02) return;
        const sz = b.sz * W, px = xFrac * W, py = yFrac * H;
        const hue = (b.hue + t * 5) % 360;
        ctx.globalAlpha = fade;
        const ellG = ctx.createRadialGradient(px - sz * 0.2, py - sz * 0.25, sz * 0.05, px, py, sz);
        ellG.addColorStop(0, `hsla(${hue},90%,85%,0.9)`);
        ellG.addColorStop(1, `hsla(${hue},80%,50%,0.7)`);
        ctx.fillStyle = ellG;
        ctx.beginPath(); ctx.ellipse(px, py, sz * 0.55, sz * 0.65, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `hsla(${hue},60%,60%,0.4)`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(px, py + sz * 0.65);
        ctx.bezierCurveTo(px + sz * 0.2, py + sz * 0.9, px - sz * 0.1, py + sz * 1.1, px, py + sz * 1.3);
        ctx.stroke();
      });
      ctx.globalAlpha = 1; ctx.restore();
    },

    fuegos_artificiales: (ctx, W, H, t) => {
      const bursts = [
        { x: 0.25, y: 0.3, interval: 4, off: 0, hue: 0 },
        { x: 0.7, y: 0.25, interval: 5, off: 1.7, hue: 120 },
        { x: 0.5, y: 0.15, interval: 6, off: 3.1, hue: 240 },
        { x: 0.82, y: 0.4, interval: 4.5, off: 0.8, hue: 60 },
      ];
      bursts.forEach(b => {
        const phase = (t + b.off) % b.interval;
        if (phase > 1.6) return;
        const p = phase / 1.6, cx2 = b.x * W, cy2 = b.y * H;
        const maxR = Math.min(W, H) * 0.18, numParts = 24;
        for (let i = 0; i < numParts; i++) {
          const ang = (i / numParts) * Math.PI * 2;
          const r = maxR * p, fade = (1 - p) * (1 - p);
          const hue = (b.hue + i * 6 + t * 20) % 360;
          ctx.globalAlpha = fade * 0.7;
          const px2 = cx2 + Math.cos(ang) * r;
          const py2 = cy2 + Math.sin(ang) * r + r * 0.25 * p;
          ctx.strokeStyle = `hsl(${hue},100%,72%)`; ctx.lineWidth = 1.5 * (1 - p);
          ctx.beginPath();
          ctx.moveTo(cx2 + Math.cos(ang) * r * 0.82, cy2 + Math.sin(ang) * r * 0.82 + r * 0.25 * p * 0.82);
          ctx.lineTo(px2, py2); ctx.stroke();
          ctx.fillStyle = `hsl(${hue},100%,90%)`;
          ctx.beginPath(); ctx.arc(px2, py2, 2.5 * (1 - p) * W / 1920, 0, 6.28); ctx.fill();
        }
        if (p < 0.2) {
          const gF = (0.2 - p) / 0.2;
          const glow = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, 40 * W / 1920);
          glow.addColorStop(0, `hsla(${b.hue},100%,95%,${gF * 0.7})`); glow.addColorStop(1, 'transparent');
          ctx.globalAlpha = gF; ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx2, cy2, 40 * W / 1920, 0, 6.28); ctx.fill();
        }
      });
      ctx.globalAlpha = 1; ctx.lineWidth = 1;
    },

    // ── Luna ────────────────────────────────
    luna: (ctx, W, H, t) => {
      const cx = W * 0.82, cy = H * 0.18, radius = Math.min(W, H) * 0.11;
      const phase = (Math.sin(t * 0.15) + 1) * 0.5; // 0-1 (llena a nueva)
      const glow = ctx.createRadialGradient(cx, cy, radius * 0.6, cx, cy, radius * 2.5);
      glow.addColorStop(0, `rgba(255,255,245,${0.08 * (1 - phase * 0.5)})`);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, radius * 2.5, 0, 6.28); ctx.fill();
      const moonG = ctx.createRadialGradient(cx - radius * 0.25, cy - radius * 0.25, radius * 0.1, cx, cy, radius);
      moonG.addColorStop(0, '#fffef5'); moonG.addColorStop(1, '#e8e7d8');
      ctx.fillStyle = moonG; ctx.beginPath(); ctx.arc(cx, cy, radius, 0, 6.28); ctx.fill();
      if (phase > 0.05) {
        const shadowX = cx + (0.5 - phase) * radius * 2;
        ctx.save(); ctx.globalCompositeOperation = 'destination-out';
        const shadowG = ctx.createRadialGradient(shadowX, cy, 0, shadowX, cy, radius * 1.05);
        shadowG.addColorStop(0, 'rgba(0,0,0,0.92)'); shadowG.addColorStop(1, 'rgba(0,0,0,0.6)');
        ctx.fillStyle = shadowG; ctx.beginPath(); ctx.arc(shadowX, cy, radius * 1.05, 0, 6.28); ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 0.35;
      for (let i = 0; i < 4; i++) {
        const cr = [0.4, 0.25, 0.15, 0.2][i], cox = [-0.3, 0.4, -0.15, 0.25][i], coy = [0.2, -0.25, -0.4, 0.35][i];
        ctx.fillStyle = 'rgba(160,155,145,0.6)'; 
        ctx.beginPath(); ctx.arc(cx + cox * radius, cy + coy * radius, cr * radius * 0.18, 0, 6.28); ctx.fill();
      }
      ctx.globalAlpha = 1;
    },

    // ── Synthwave ───────────────────────────
    synthwave: (ctx, W, H, t) => {
      // Estrellas en movimiento
      DATA.stars.slice(0, 40).forEach(s => {
        const starY = (s.y + t * 0.015) % 1;
        ctx.globalAlpha = s.br * (0.6 + 0.4 * Math.sin(t * 2 + s.x * 10));
        ctx.fillStyle = s.x < 0.5 ? '#ff00ff' : '#00ffff';
        ctx.beginPath(); ctx.arc(s.x * W, starY * H * 0.45, s.r * 1.2, 0, 6.28); ctx.fill();
      });
      // Sol con efecto de escaneo
      const sunY = H * 0.3, sunR = Math.min(W, H) * 0.24;
      const sunPulse = 0.95 + 0.05 * Math.sin(t * 1.5);
      const sunG = ctx.createRadialGradient(W * 0.5, sunY, sunR * 0.2, W * 0.5, sunY, sunR * sunPulse);
      sunG.addColorStop(0, '#ff0088'); sunG.addColorStop(0.3, '#ff00ff'); 
      sunG.addColorStop(0.6, '#ff0088'); sunG.addColorStop(1, 'transparent');
      ctx.globalAlpha = 1; ctx.fillStyle = sunG; 
      ctx.beginPath(); ctx.arc(W * 0.5, sunY, sunR * sunPulse, 0, 6.28); ctx.fill();
      // Líneas horizontales del sol con animación
      for (let i = 1; i <= 14; i++) {
        const y = sunY + i * sunR * 0.16;
        if (y > H * 0.6) break;
        const scanLine = (t * 3) % 14;
        const intensity = Math.abs(i - scanLine) < 2 ? 0.7 : 0.4;
        const lw = Math.max(1, 3.5 - i * 0.18) * W / 1920;
        const gr = ctx.createLinearGradient(0, y, W, y);
        gr.addColorStop(0, 'transparent'); 
        gr.addColorStop(0.5, `rgba(255,0,255,${intensity - i * 0.025})`); 
        gr.addColorStop(1, 'transparent');
        ctx.strokeStyle = gr; ctx.lineWidth = lw; 
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      // Grid con movimiento de carretera
      const gridSpacing = H * 0.055; const gridStart = H * 0.52;
      const roadScroll = (t * 0.8) % (gridSpacing / H);
      for (let gy = gridStart - roadScroll * H; gy < H; gy += gridSpacing) {
        const perspective = (gy - gridStart) / (H - gridStart);
        if (perspective < 0) continue;
        const lw = (1 + perspective * 2.2) * W / 1920;
        const al = 0.15 + perspective * 0.55;
        ctx.globalAlpha = al;
        const glowColor = perspective > 0.75 ? '#00ffff' : '#ff00ff';
        ctx.strokeStyle = glowColor; ctx.lineWidth = lw;
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
      }
      // Grid vertical con perspectiva animada
      for (let gx = 0; gx < 28; gx++) {
        const xFrac = gx / 27;
        const x1 = W * 0.5 + (xFrac - 0.5) * W * 0.38;
        const x2 = W * 0.5 + (xFrac - 0.5) * W * 3.2;
        const edgeFade = Math.min(xFrac, 1 - xFrac) * 2;
        ctx.globalAlpha = 0.12 * edgeFade;
        ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 1.2 * W / 1920;
        ctx.beginPath(); ctx.moveTo(x1, gridStart); ctx.lineTo(x2, H); ctx.stroke();
      }
      // Palmeras silueta a los lados
      const palmPositions = [{x:0.08,scale:0.8},{x:0.15,scale:1},{x:0.85,scale:1},{x:0.92,scale:0.8}];
      palmPositions.forEach((palm, i) => {
        const px = palm.x * W, py = H * 0.48;
        const palmH = H * 0.22 * palm.scale, palmW = W * 0.015 * palm.scale;
        ctx.globalAlpha = 0.35;
        const palmG = ctx.createLinearGradient(px, py, px, py + palmH);
        palmG.addColorStop(0, 'rgba(255,0,255,0.6)'); palmG.addColorStop(1, 'rgba(0,0,0,0.8)');
        ctx.fillStyle = palmG; ctx.fillRect(px - palmW / 2, py, palmW, palmH);
        // Hojas
        for (let leaf = 0; leaf < 6; leaf++) {
          const ang = (leaf / 6) * Math.PI * 2 + Math.sin(t + i) * 0.15;
          ctx.save(); ctx.translate(px, py); ctx.rotate(ang);
          ctx.fillStyle = 'rgba(255,0,128,0.4)';
          ctx.beginPath(); ctx.ellipse(0, -palmH * 0.15, palmW * 3, palmW * 0.8, 0, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
      });
      ctx.globalAlpha = 1; ctx.lineWidth = 1;
    },

    // ── Planetas ────────────────────────────
    planetas: (ctx, W, H, t) => {
      const cx = W * 0.5, cy = H * 0.45; // Centro de perspectiva
      const planets = [
        {orbitR:0.25, orbitSpeed:0.4, rotSpeed:0.8, size:0.075, hue:200, tilt:0.3, rings:false, moons:0},
        {orbitR:0.42, orbitSpeed:0.25, rotSpeed:0.4, size:0.14, hue:30, tilt:0.2, rings:true, moons:2},
        {orbitR:0.58, orbitSpeed:0.18, rotSpeed:0.6, size:0.065, hue:120, tilt:0.4, rings:false, moons:1},
        {orbitR:0.75, orbitSpeed:0.12, rotSpeed:0.35, size:0.095, hue:280, tilt:0.15, rings:false, moons:0},
      ];
      // Referencia de estrella central
      ctx.globalAlpha = 0.15;
      const starG = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.08);
      starG.addColorStop(0, 'rgba(255,250,200,0.4)');
      starG.addColorStop(1, 'transparent');
      ctx.fillStyle = starG;
      ctx.beginPath(); ctx.arc(cx, cy, Math.min(W, H) * 0.08, 0, 6.28); ctx.fill();
      ctx.globalAlpha = 1;
      // Planetas con órbita y rotación
      planets.forEach((p, idx) => {
        const orbitAng = t * p.orbitSpeed + idx * 1.57;
        const orbitR = p.orbitR * Math.min(W, H);
        // Gran angular: más distorsión en los bordes
        const distortX = 1 + Math.abs(Math.cos(orbitAng)) * 0.3;
        const px = cx + Math.cos(orbitAng) * orbitR * distortX;
        const py = cy + Math.sin(orbitAng) * orbitR * p.tilt;
        const depth = (Math.sin(orbitAng) + 1) * 0.5; // 0 = lejos, 1 = cerca
        const pr = p.size * Math.min(W, H) * (0.8 + depth * 0.4); // Perspectiva de tamaño
        // Glow atmosférico
        const pGlow = ctx.createRadialGradient(px, py, pr * 0.4, px, py, pr * 2.2);
        pGlow.addColorStop(0, `hsla(${p.hue},85%,65%,${0.2 * (0.7 + depth * 0.3)})`);
        pGlow.addColorStop(0.6, `hsla(${p.hue},80%,55%,${0.08 * (0.7 + depth * 0.3)})`);
        pGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = pGlow;
        ctx.beginPath(); ctx.arc(px, py, pr * 2.2, 0, 6.28); ctx.fill();
        // Superficie con rotación
        const rotAng = t * p.rotSpeed;
        ctx.save(); ctx.translate(px, py);
        // Gradiente base del planeta
        const pSurf = ctx.createRadialGradient(-pr * 0.35, -pr * 0.35, pr * 0.1, 0, 0, pr * 1.05);
        pSurf.addColorStop(0, `hsl(${p.hue},85%,75%)`);
        pSurf.addColorStop(0.5, `hsl(${p.hue},75%,55%)`);
        pSurf.addColorStop(1, `hsl(${p.hue},65%,30%)`);
        ctx.fillStyle = pSurf;
        ctx.beginPath(); ctx.arc(0, 0, pr, 0, 6.28); ctx.fill();
        // Bandas/características de superficie rotando
        ctx.globalAlpha = 0.35;
        for (let band = 0; band < 4; band++) {
          const bandY = (band - 1.5) * pr * 0.4;
          const bandPhase = (rotAng + band * 0.7) % (Math.PI * 2);
          for (let seg = 0; seg < 8; seg++) {
            const segAng = (seg / 8) * Math.PI * 2 + bandPhase;
            const visibility = (Math.cos(segAng) + 1) * 0.5; // Solo visible en la cara frontal
            if (visibility < 0.3) continue;
            const segX = Math.sin(segAng) * pr * 0.85;
            const segW = pr * 0.25;
            const segH = pr * 0.12;
            ctx.globalAlpha = 0.25 * visibility;
            ctx.fillStyle = `hsl(${(p.hue + band * 15) % 360},70%,${40 + band * 5}%)`;
            ctx.beginPath();
            ctx.ellipse(segX, bandY, segW * Math.abs(Math.sin(segAng)), segH, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        // Cráteres
        for (let crater = 0; crater < 5; crater++) {
          const cAng = (crater / 5) * Math.PI * 2 + rotAng * 0.5 + idx;
          const cDist = pr * (0.4 + sr(idx * 7 + crater) * 0.45);
          const cX = Math.sin(cAng) * cDist;
          const cY = (sr(idx * 9 + crater) - 0.5) * pr * 0.7;
          const cR = pr * (0.08 + sr(idx * 11 + crater) * 0.1);
          const cVis = (Math.cos(cAng) + 1) * 0.5;
          if (cVis < 0.3) continue;
          ctx.globalAlpha = 0.3 * cVis;
          ctx.fillStyle = `hsl(${p.hue},50%,25%)`;
          ctx.beginPath(); ctx.arc(cX, cY, cR, 0, 6.28); ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.restore();
        // Anillos
        if (p.rings) {
          ctx.save(); ctx.translate(px, py);
          const ringTilt = Math.abs(Math.sin(orbitAng) * 0.6) + 0.4; // Asegurar que sea positivo
          for (let ri = 0; ri < 4; ri++) {
            const ringR = pr * (1.35 + ri * 0.12);
            const ringThick = pr * 0.06;
            ctx.globalAlpha = (0.25 - ri * 0.04) * (0.7 + depth * 0.3);
            const ringG = ctx.createLinearGradient(-ringR, 0, ringR, 0);
            ringG.addColorStop(0, 'transparent');
            ringG.addColorStop(0.3, `hsl(${(p.hue+50)%360},80%,${70-ri*5}%)`);
            ringG.addColorStop(0.7, `hsl(${(p.hue+50)%360},80%,${70-ri*5}%)`);
            ringG.addColorStop(1, 'transparent');
            ctx.strokeStyle = ringG;
            ctx.lineWidth = ringThick;
            ctx.beginPath();
            ctx.ellipse(0, 0, ringR, ringR * ringTilt * 0.25, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.restore();
        }
        // Lunas
        for (let m = 0; m < p.moons; m++) {
          const moonOrbit = pr * (1.6 + m * 0.4);
          const moonAng = orbitAng * 2 + t * (1.2 + m * 0.3) + m * Math.PI;
          const moonX = px + Math.cos(moonAng) * moonOrbit;
          const moonY = py + Math.sin(moonAng) * moonOrbit * 0.3;
          const moonR = pr * 0.15;
          ctx.globalAlpha = 0.6;
          ctx.fillStyle = '#cccccc';
          ctx.beginPath(); ctx.arc(moonX, moonY, moonR, 0, 6.28); ctx.fill();
        }
        ctx.globalAlpha = 1;
      });
    },

    // ── Anime ───────────────────────────────
    anime: (ctx, W, H, t) => {
      // Speed lines estilo manga
      const speedLineCount = 35;
      for (let i = 0; i < speedLineCount; i++) {
        const angle = (i / speedLineCount) * Math.PI * 2 + t * 0.5;
        const lineSpeed = (t * 2 + i * 0.1) % 1;
        const startR = Math.min(W, H) * 0.15;
        const endR = Math.min(W, H) * (0.55 + lineSpeed * 0.25);
        const cx = W * 0.5, cy = H * 0.4;
        const sx = cx + Math.cos(angle) * startR;
        const sy = cy + Math.sin(angle) * startR;
        const ex = cx + Math.cos(angle) * endR;
        const ey = cy + Math.sin(angle) * endR;
        ctx.globalAlpha = (1 - lineSpeed) * 0.2;
        const lineG = ctx.createLinearGradient(sx, sy, ex, ey);
        lineG.addColorStop(0, 'transparent');
        lineG.addColorStop(0.3, 'rgba(255,100,150,0.6)');
        lineG.addColorStop(1, 'transparent');
        ctx.strokeStyle = lineG;
        ctx.lineWidth = (2 + (1 - lineSpeed) * 3) * W / 1920;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // Explosión de poder en el centro
      const powerPulse = Math.abs(Math.sin(t * 1.5));
      const powerG = ctx.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.4, Math.min(W, H) * 0.18 * powerPulse);
      powerG.addColorStop(0, `rgba(255,200,255,${0.4 * powerPulse})`);
      powerG.addColorStop(0.5, `rgba(255,100,200,${0.2 * powerPulse})`);
      powerG.addColorStop(1, 'transparent');
      ctx.fillStyle = powerG;
      ctx.beginPath(); ctx.arc(W * 0.5, H * 0.4, Math.min(W, H) * 0.18 * powerPulse, 0, 6.28); ctx.fill();
      // Efectos de impacto estilo manga (líneas radiantes)
      for (let burst = 0; burst < 8; burst++) {
        const burstAng = (burst / 8) * Math.PI * 2 + t * 0.8;
        const burstPhase = (Math.sin(t * 2 + burst * 0.5) + 1) * 0.5;
        const burstDist = Math.min(W, H) * (0.25 + burstPhase * 0.15);
        const bx = W * 0.5 + Math.cos(burstAng) * burstDist;
        const by = H * 0.4 + Math.sin(burstAng) * burstDist;
        ctx.globalAlpha = 0.4 * (1 - burstPhase);
        ctx.save(); ctx.translate(bx, by); ctx.rotate(burstAng);
        ctx.fillStyle = '#ffccff';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(W * 0.04, -W * 0.012);
        ctx.lineTo(W * 0.04, W * 0.012);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      // Sakura estilizados (formas simples, no texto)
      DATA.orbs.slice(0, 25).forEach((p, i) => {
        const y = (p.y + t * p.spd * 0.4) % 1;
        const x = p.x + Math.sin(t * 0.5 + p.ph) * 0.05;
        const fade = Math.min(1, Math.min(y * 10, (1 - y) * 10)) * 0.6;
        if (fade < 0.02) return;
        const hue = (320 + i * 15) % 360;
        ctx.save(); ctx.translate(x * W, y * H); ctx.rotate(t * 0.3 + p.ph);
        ctx.globalAlpha = fade;
        // Pétalos simples sin texto
        for (let petal = 0; petal < 5; petal++) {
          const pAng = (petal / 5) * Math.PI * 2;
          ctx.save(); ctx.rotate(pAng);
          ctx.fillStyle = `hsl(${hue},90%,80%)`;
          ctx.beginPath();
          ctx.ellipse(0, -p.r * 2, p.r * 1.5, p.r * 2.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();
      });
      // Onda de energía circular (impacto visual)
      const waveCount = 3;
      for (let w = 0; w < waveCount; w++) {
        const wavePhase = ((t * 0.8 + w * 0.33) % 1);
        const waveR = Math.min(W, H) * (0.15 + wavePhase * 0.35);
        ctx.globalAlpha = (1 - wavePhase) * 0.25;
        ctx.strokeStyle = w % 2 === 0 ? '#ff88cc' : '#88ccff';
        ctx.lineWidth = (5 - wavePhase * 3) * W / 1920;
        ctx.beginPath();
        ctx.arc(W * 0.5, H * 0.4, waveR, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Chispas/brillos aleatorios
      for (let spark = 0; spark < 20; spark++) {
        const sparkPhase = ((t * 2 + spark * 0.15) % 1);
        const sparkAng = sr(spark * 7) * Math.PI * 2;
        const sparkDist = Math.min(W, H) * (0.2 + sr(spark * 11) * 0.25);
        const sx = W * 0.5 + Math.cos(sparkAng) * sparkDist;
        const sy = H * 0.4 + Math.sin(sparkAng) * sparkDist;
        const sparkSize = (3 + sr(spark * 13) * 4) * W / 1920;
        ctx.globalAlpha = (1 - sparkPhase) * (0.4 + sr(spark * 17) * 0.4);
        ctx.fillStyle = sr(spark * 19) > 0.5 ? '#ffccff' : '#ccffff';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(sx, sy, sparkSize * (1 - sparkPhase * 0.5), 0, 6.28);
        ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    },

    // ── Metal ───────────────────────────────
    metal: (ctx, W, H, t) => {
      // Fuego intenso
      DATA.flameParticles.slice(0, 55).forEach(f => {
        const y = 1 - ((t * f.spd * 1.4 + f.ph / 6.28) % 1);
        const x = f.x + Math.sin(t * 1.8 + f.ph + y * 4) * f.wob * 1.3;
        const fade = Math.min(1, y * 14) * (1 - Math.pow(y, 1.2));
        if (fade < 0.02) return;
        const sz = (f.sz + (1 - y) * f.sz * 2.5) * W;
        ctx.globalAlpha = fade * 0.9;
        const g = ctx.createRadialGradient(x*W, y*H, 0, x*W, y*H, sz);
        g.addColorStop(0, '#fff8e0'); g.addColorStop(0.2, '#ffee44'); 
        g.addColorStop(0.45, '#ff4400'); g.addColorStop(0.7, '#aa0000'); 
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x*W, y*H, sz, 0, 6.28); ctx.fill();
      });
      // Calaveras como sombras 3D apareciendo/diluyéndose
      const skullPositions = [{x:0.18,y:0.22,phase:0},{x:0.75,y:0.18,phase:1.5},{x:0.35,y:0.55,phase:3},{x:0.82,y:0.65,phase:4.5}];
      skullPositions.forEach((skull, idx) => {
        const appearCycle = (t * 0.4 + skull.phase) % 6;
        let alpha;
        if (appearCycle < 1.5) alpha = appearCycle / 1.5; // Apareciendo
        else if (appearCycle < 4) alpha = 1; // Visible
        else alpha = 1 - (appearCycle - 4) / 2; // Diluyéndose
        if (alpha < 0.05) return;
        const skX = skull.x * W, skY = skull.y * H;
        const skR = Math.min(W, H) * 0.085;
        const depth3d = 0.15 * (1 - Math.abs(Math.sin(t * 0.3 + skull.phase))); // Profundidad 3D
        ctx.save(); ctx.translate(skX, skY);
        // Sombras en capas para efecto 3D
        for (let layer = 5; layer >= 0; layer--) {
          const layerOffset = layer * skR * depth3d * 0.08;
          const layerAlpha = alpha * (0.15 + layer * 0.12);
          ctx.globalAlpha = layerAlpha;
          // Cabeza de calavera (ovalada)
          ctx.fillStyle = layer === 0 ? '#330000' : '#000000';
          ctx.beginPath();
          ctx.ellipse(layerOffset, layerOffset, skR * 0.95, skR * 1.1, 0, 0, Math.PI * 2);
          ctx.fill();
          // Cuencas de ojos
          ctx.fillStyle = layer === 0 ? 'rgba(100,0,0,0.9)' : 'rgba(0,0,0,0.95)';
          ctx.beginPath();
          ctx.ellipse(-skR * 0.35 + layerOffset, -skR * 0.25 + layerOffset, skR * 0.22, skR * 0.3, -0.15, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(skR * 0.35 + layerOffset, -skR * 0.25 + layerOffset, skR * 0.22, skR * 0.3, 0.15, 0, Math.PI * 2);
          ctx.fill();
          // Nariz triangular
          ctx.beginPath();
          ctx.moveTo(layerOffset, skR * 0.05 + layerOffset);
          ctx.lineTo(-skR * 0.12 + layerOffset, skR * 0.35 + layerOffset);
          ctx.lineTo(skR * 0.12 + layerOffset, skR * 0.35 + layerOffset);
          ctx.closePath();
          ctx.fill();
          // Mandíbula (línea curva)
          if (layer <= 2) {
            ctx.globalAlpha = layerAlpha * 0.8;
            ctx.strokeStyle = ctx.fillStyle;
            ctx.lineWidth = skR * 0.08;
            ctx.beginPath();
            ctx.arc(layerOffset, skR * 0.5 + layerOffset, skR * 0.5, 0.3, Math.PI - 0.3);
            ctx.stroke();
            // Dientes
            for (let tooth = 0; tooth < 5; tooth++) {
              const tx = (tooth - 2) * skR * 0.18 + layerOffset;
              const ty = skR * 0.75 + layerOffset;
              ctx.fillRect(tx - skR * 0.05, ty, skR * 0.08, skR * 0.12);
            }
          }
        }
        // Glow rojo pulsante
        const glowPulse = 0.7 + 0.3 * Math.sin(t * 3 + idx * 2);
        ctx.globalAlpha = alpha * 0.25 * glowPulse;
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 25;
        const glowG = ctx.createRadialGradient(0, 0, skR * 0.5, 0, 0, skR * 2);
        glowG.addColorStop(0, 'rgba(255,0,0,0.3)');
        glowG.addColorStop(1, 'transparent');
        ctx.fillStyle = glowG;
        ctx.beginPath(); ctx.arc(0, 0, skR * 2, 0, 6.28); ctx.fill();
        ctx.restore();
      });
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    },

    // ── Seasons: Primavera ──────────────────
    primavera: (ctx, W, H, t) => {
      const flowers = [{x:0.15,y:0.25,r:0.06,hue:330},{x:0.75,y:0.42,r:0.055,hue:50},{x:0.45,y:0.65,r:0.07,hue:290},{x:0.82,y:0.75,r:0.05,hue:170}];
      flowers.forEach((fl, i) => {
        const px = fl.x * W, py = fl.y * H, pr = fl.r * Math.min(W, H);
        const pulse = 0.9 + 0.1 * Math.sin(t * 1.2 + i);
        for (let petal = 0; petal < 5; petal++) {
          const ang = (petal / 5) * Math.PI * 2 + t * 0.1;
          const petalX = px + Math.cos(ang) * pr * 0.7, petalY = py + Math.sin(ang) * pr * 0.7;
          ctx.globalAlpha = 0.4; ctx.fillStyle = `hsl(${fl.hue},85%,75%)`;
          ctx.beginPath(); ctx.ellipse(petalX, petalY, pr * 0.5 * pulse, pr * 0.35 * pulse, ang, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 0.5; ctx.fillStyle = `hsl(${(fl.hue+60)%360},90%,65%)`;
        ctx.beginPath(); ctx.arc(px, py, pr * 0.25, 0, 6.28); ctx.fill();
      });
      DATA.orbs.slice(0, 35).forEach(p => {
        const y = (p.y + t * p.spd * 0.3) % 1, x = p.x + Math.sin(t * 0.4 + p.ph) * 0.03;
        ctx.globalAlpha = 0.25; ctx.fillStyle = '#fff8aa';
        ctx.beginPath(); ctx.arc(x * W, y * H, p.r * 1.5, 0, 6.28); ctx.fill();
      });
      ctx.globalAlpha = 1;
    },

    // ── Seasons: Verano ─────────────────────
    verano: (ctx, W, H, t) => {
      const sunX = W * 0.85, sunY = H * 0.15, sunR = Math.min(W, H) * 0.095;
      // Resplandor solar externo animado
      const glowPulse = 0.9 + 0.1 * Math.sin(t * 1.5);
      const sunGlowG = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.5 * glowPulse);
      sunGlowG.addColorStop(0, 'rgba(255,245,150,0.5)');
      sunGlowG.addColorStop(0.3, 'rgba(255,230,80,0.3)');
      sunGlowG.addColorStop(0.6, 'rgba(255,200,50,0.15)');
      sunGlowG.addColorStop(1, 'transparent');
      ctx.fillStyle = sunGlowG; ctx.beginPath(); ctx.arc(sunX, sunY, sunR * 2.5 * glowPulse, 0, 6.28); ctx.fill();
      // Cuerpo del sol con textura y gradiente realista
      const sunCoreG = ctx.createRadialGradient(sunX - sunR * 0.3, sunY - sunR * 0.3, sunR * 0.1, sunX, sunY, sunR * 1.1);
      sunCoreG.addColorStop(0, '#fffef0');
      sunCoreG.addColorStop(0.3, '#ffeb3b');
      sunCoreG.addColorStop(0.7, '#ffc107');
      sunCoreG.addColorStop(1, '#ff9800');
      ctx.fillStyle = sunCoreG; ctx.beginPath(); ctx.arc(sunX, sunY, sunR, 0, 6.28); ctx.fill();
      // Manchas solares animadas (textura)
      for (let spot = 0; spot < 5; spot++) {
        const spotAng = (spot / 5) * Math.PI * 2 + t * 0.05;
        const spotDist = sunR * (0.3 + sr(spot * 3) * 0.4);
        const spotX = sunX + Math.cos(spotAng) * spotDist;
        const spotY = sunY + Math.sin(spotAng) * spotDist;
        const spotR = sunR * (0.08 + sr(spot * 5) * 0.06);
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#ff8f00';
        ctx.beginPath(); ctx.arc(spotX, spotY, spotR, 0, 6.28); ctx.fill();
      }
      // Rayos solares con más detalle
      for (let ray = 0; ray < 16; ray++) {
        const ang = (ray / 16) * Math.PI * 2 + t * 0.25;
        const ext = sunR * (1.9 + 0.3 * Math.sin(t * 2 + ray));
        const rayWidth = (5 - (ray % 2) * 2) * W / 1920;
        ctx.globalAlpha = 0.35 - (ray % 2) * 0.1;
        const rayG = ctx.createLinearGradient(
          sunX + Math.cos(ang) * sunR * 1.15, sunY + Math.sin(ang) * sunR * 1.15,
          sunX + Math.cos(ang) * ext, sunY + Math.sin(ang) * ext
        );
        rayG.addColorStop(0, '#ffeb3b'); rayG.addColorStop(1, 'transparent');
        ctx.strokeStyle = rayG; ctx.lineWidth = rayWidth;
        ctx.beginPath();
        ctx.moveTo(sunX + Math.cos(ang) * sunR * 1.15, sunY + Math.sin(ang) * sunR * 1.15);
        ctx.lineTo(sunX + Math.cos(ang) * ext, sunY + Math.sin(ang) * ext);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // Olas del mar con relleno
      const waveHeights = [0.58, 0.67, 0.75, 0.82, 0.88];
      waveHeights.forEach((wh, w) => {
        const waveY = H * wh, waveAmp = H * (0.035 - w * 0.004);
        const speed = 1 + w * 0.25;
        const waveG = ctx.createLinearGradient(0, waveY - waveAmp * 2, 0, H);
        const alpha = 0.12 + w * 0.03;
        waveG.addColorStop(0, `rgba(66,165,245,0)`);
        waveG.addColorStop(0.3, `rgba(66,165,245,${alpha})`);
        waveG.addColorStop(1, `rgba(33,150,243,${alpha + 0.05})`);
        ctx.fillStyle = waveG;
        ctx.beginPath();
        ctx.moveTo(0, H);
        for (let x = 0; x <= W; x += 3) {
          const y = waveY + Math.sin(x / W * Math.PI * 4 + t * speed + w * 0.5) * waveAmp +
                    Math.sin(x / W * Math.PI * 7 + t * speed * 0.7) * waveAmp * 0.3;
          if (x === 0) ctx.lineTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fill();
        // Cresta de ola brillante
        ctx.globalAlpha = 0.25 + w * 0.05;
        ctx.strokeStyle = `rgba(150, 220, 255, ${0.4 + w * 0.1})`;
        ctx.lineWidth = (2.5 - w * 0.3) * W / 1920;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 3) {
          const y = waveY + Math.sin(x / W * Math.PI * 4 + t * speed + w * 0.5) * waveAmp +
                    Math.sin(x / W * Math.PI * 7 + t * speed * 0.7) * waveAmp * 0.3;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
      ctx.globalAlpha = 1; ctx.lineWidth = 1;
    },

    // ── Seasons: Otoño ──────────────────────
    otono: (ctx, W, H, t) => {
      const leaves = [{ch:'🍂',sz:0.025},{ch:'🍁',sz:0.028},{ch:'🌰',sz:0.02}];
      DATA.conf.forEach((c, i) => {
        const yFrac = (c.y + t * c.spd * 0.4) % 1, xFrac = c.x + Math.sin(t * 0.5 + c.rot) * 0.08;
        const leaf = leaves[i % leaves.length];
        ctx.save(); ctx.translate(xFrac * W, yFrac * H); ctx.rotate(c.rot + t * c.spin * 0.6);
        ctx.globalAlpha = 0.75; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = `${leaf.sz * Math.min(W, H)}px serif`; ctx.fillText(leaf.ch, 0, 0);
        ctx.restore(); ctx.globalAlpha = 1;
      });
      const foliageY = H * 0.82;
      for (let tr = 0; tr < W; tr += W * 0.15) {
        ctx.globalAlpha = 0.25; ctx.fillStyle = '#8d6e63';
        ctx.fillRect(tr, foliageY, W * 0.01, H * 0.18);
        ctx.fillStyle = '#ff6f00'; ctx.beginPath();
        ctx.arc(tr + W * 0.005, foliageY, Math.min(W, H) * 0.04, 0, 6.28); ctx.fill();
      }
      ctx.globalAlpha = 1;
    },

    // ── Seasons: Invierno ───────────────────
    invierno: (ctx, W, H, t) => {
      DATA.snow.forEach(s => {
        const y = (s.y + t * s.spd * 0.5) % 1, x = s.x + Math.sin(t * 0.4 + s.ph) * s.drift * 6;
        const fade = Math.min(1, Math.min(y * 15, (1 - y) * 15)) * 0.75;
        if (fade < 0.02) return;
        const r2 = s.r * W / 1500; ctx.globalAlpha = fade;
        ctx.fillStyle = '#ffffff'; ctx.shadowColor = '#aaccff'; ctx.shadowBlur = 4;
        ctx.beginPath(); ctx.arc(x * W, y * H, r2, 0, 6.28); ctx.fill();
      });
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      const icicles = [{x:0.2,h:0.08},{x:0.4,h:0.06},{x:0.6,h:0.09},{x:0.8,h:0.07}];
      icicles.forEach((ic, i) => {
        const drip = 0.95 + 0.05 * Math.sin(t * 1.5 + i);
        const iH = ic.h * H * drip;
        ctx.globalAlpha = 0.4;
        const icicleG = ctx.createLinearGradient(0, 0, 0, iH);
        icicleG.addColorStop(0, 'rgba(200,230,255,0.7)'); icicleG.addColorStop(1, 'rgba(255,255,255,0.9)');
        ctx.fillStyle = icicleG; ctx.beginPath();
        ctx.moveTo(ic.x * W - W * 0.012, 0); ctx.lineTo(ic.x * W + W * 0.012, 0);
        ctx.lineTo(ic.x * W, iH); ctx.closePath(); ctx.fill();
      });
      ctx.globalAlpha = 1;
    },

    // ── Campo ───────────────────────────────
    campo: (ctx, W, H, t) => {
      const skyG = ctx.createLinearGradient(0, 0, 0, H * 0.6);
      skyG.addColorStop(0, 'rgba(100,180,255,0.15)'); skyG.addColorStop(1, 'rgba(150,220,255,0.05)');
      ctx.fillStyle = skyG; ctx.fillRect(0, 0, W, H * 0.6);
      const cloudY = [0.15, 0.25, 0.32], cloudX = [(t * 0.02) % 1.5 - 0.25, (t * 0.015) % 1.6 - 0.3, (t * 0.018) % 1.7 - 0.35];
      cloudY.forEach((cy, i) => {
        const cx = cloudX[i] * W, cr = Math.min(W, H) * 0.08;
        ctx.globalAlpha = 0.25; ctx.fillStyle = '#ffffff';
        for (let puff = 0; puff < 4; puff++) {
          ctx.beginPath(); ctx.arc(cx + (puff - 1.5) * cr * 0.6, cy * H, cr * (0.6 + puff * 0.1), 0, 6.28); ctx.fill();
        }
      });
      ctx.globalAlpha = 1;
      const hillG = ctx.createLinearGradient(0, H * 0.55, 0, H);
      hillG.addColorStop(0, 'rgba(100,180,80,0.3)'); hillG.addColorStop(1, 'rgba(80,150,70,0.2)');
      ctx.fillStyle = hillG; ctx.beginPath(); ctx.moveTo(0, H * 0.65);
      for (let x = 0; x <= W; x += W * 0.05) {
        const y = H * 0.65 + Math.sin(x / W * Math.PI * 3 + t * 0.1) * H * 0.04;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
      for (let fl = 0; fl < 15; fl++) {
        const fx = (sr(fl * 7) + t * 0.01) % 1, fy = 0.7 + sr(fl * 9) * 0.2;
        const fhue = sr(fl * 11) * 360, fade = 0.4 + 0.3 * Math.sin(t + fl);
        ctx.globalAlpha = fade; ctx.fillStyle = `hsl(${fhue},80%,70%)`;
        ctx.beginPath(); ctx.arc(fx * W, fy * H, Math.min(W, H) * 0.008, 0, 6.28); ctx.fill();
      }
      ctx.globalAlpha = 1;
    },

    // ── Japón (Cerezos) ─────────────────────
    cerezos: (ctx, W, H, t) => {
      const branches = [{x:0.15,y:0.2,len:0.35,ang:-0.3},{x:0.78,y:0.15,len:0.4,ang:0.4},{x:0.5,y:0.6,len:0.3,ang:-0.1}];
      ctx.globalAlpha = 0.35; ctx.strokeStyle = '#5d4037'; ctx.lineWidth = Math.max(2, 5 * W / 1920);
      branches.forEach(br => {
        const bx1 = br.x * W, by1 = br.y * H, bx2 = bx1 + Math.cos(br.ang) * br.len * W;
        const by2 = by1 + Math.sin(br.ang) * br.len * W;
        ctx.beginPath(); ctx.moveTo(bx1, by1); ctx.lineTo(bx2, by2); ctx.stroke();
      });
      ctx.globalAlpha = 1; ctx.lineWidth = 1;
      DATA.orbs.slice(0, 45).forEach(p => {
        const y = (p.y + t * p.spd * 0.2) % 1, x = p.x + Math.sin(t * 0.3 + p.ph) * 0.04;
        const fade = Math.min(1, Math.min(y * 10, (1 - y) * 10)) * 0.65;
        if (fade < 0.02) return;
        ctx.globalAlpha = fade * (0.7 + 0.3 * Math.sin(t * 1.5 + p.ph));
        ctx.fillStyle = `hsl(${330 + p.ph * 20},90%,85%)`;
        for (let petal = 0; petal < 5; petal++) {
          const ang = (petal / 5) * Math.PI * 2 + t * 0.5 + p.ph;
          const petalR = p.r * 2.5;
          ctx.beginPath();
          ctx.ellipse(x * W + Math.cos(ang) * petalR, y * H + Math.sin(ang) * petalR, petalR * 1.2, petalR * 0.7, ang, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;
    },

    // ── Urbano ──────────────────────────────
    urbano: (ctx, W, H, t) => {
      const timeOfDay = (Math.sin(t * 0.08) + 1) * 0.5;
      const skyHue = 220 + timeOfDay * 35, skyLight = 12 + timeOfDay * 22;
      // Cielo con gradiente más complejo
      const skyG = ctx.createLinearGradient(0, 0, 0, H * 0.75);
      skyG.addColorStop(0, `hsla(${skyHue},55%,${skyLight + 5}%,0.45)`);
      skyG.addColorStop(0.4, `hsla(${skyHue - 10},50%,${skyLight}%,0.35)`);
      skyG.addColorStop(1, `hsla(${skyHue - 20},45%,${skyLight - 8}%,0.2)`);
      ctx.fillStyle = skyG; ctx.fillRect(0, 0, W, H * 0.75);
      // Niebla urbana en capas
      for (let fog = 0; fog < 3; fog++) {
        const fogY = H * (0.5 + fog * 0.08);
        const fogG = ctx.createLinearGradient(0, fogY - H * 0.08, 0, fogY + H * 0.08);
        fogG.addColorStop(0, 'transparent');
        fogG.addColorStop(0.5, `rgba(60,60,80,${0.08 * (1 - timeOfDay * 0.5)})`);
        fogG.addColorStop(1, 'transparent');
        ctx.fillStyle = fogG;
        ctx.fillRect(0, fogY - H * 0.08, W, H * 0.16);
      }
      const buildings = [
        {x:0.03,w:0.13,h:0.48,depth:0.9},{x:0.18,w:0.11,h:0.68,depth:1},
        {x:0.32,w:0.15,h:0.55,depth:0.85},{x:0.5,w:0.12,h:0.75,depth:0.95},
        {x:0.65,w:0.14,h:0.62,depth:0.88},{x:0.82,w:0.13,h:0.7,depth:0.92}
      ];
      buildings.forEach((b, i) => {
        const bx = b.x * W, by = H * (1 - b.h), bw = b.w * W, bh = b.h * H;
        const lightness = 18 + i * 3;
        // Sombra del edificio (proyección en el suelo)
        ctx.globalAlpha = 0.25 * b.depth;
        const shadowG = ctx.createLinearGradient(bx, H, bx + bw * 0.3, H - bh * 0.15);
        shadowG.addColorStop(0, 'rgba(0,0,0,0.4)');
        shadowG.addColorStop(1, 'transparent');
        ctx.fillStyle = shadowG;
        ctx.fillRect(bx + bw * 1.05, H - bh * 0.15, bw * 0.3, bh * 0.15);
        // Edificio con 3D (lado frontal)
        ctx.globalAlpha = 1;
        const buildingG = ctx.createLinearGradient(bx, by, bx, by + bh);
        const baseR = Math.floor(lightness + timeOfDay * 12);
        const baseG = Math.floor(lightness + 2 + timeOfDay * 10);
        const baseB = Math.floor(lightness + 8 + timeOfDay * 8);
        buildingG.addColorStop(0, `rgba(${baseR+15},${baseG+15},${baseB+20},${0.85 + b.depth * 0.1})`);
        buildingG.addColorStop(0.6, `rgba(${baseR},${baseG},${baseB},${0.9 + b.depth * 0.08})`);
        buildingG.addColorStop(1, `rgba(${baseR-10},${baseG-10},${baseB-5},${0.95})`);
        ctx.fillStyle = buildingG;
        ctx.fillRect(bx, by, bw, bh);
        // Lado 3D del edificio (profundidad)
        const sideW = bw * 0.18 * b.depth;
        ctx.globalAlpha = 0.6;
        const sideG = ctx.createLinearGradient(bx + bw, by, bx + bw + sideW, by);
        sideG.addColorStop(0, `rgba(${baseR-20},${baseG-20},${baseB-15},0.8)`);
        sideG.addColorStop(1, `rgba(${baseR-35},${baseG-35},${baseB-25},0.85)`);
        ctx.fillStyle = sideG;
        ctx.beginPath();
        ctx.moveTo(bx + bw, by);
        ctx.lineTo(bx + bw + sideW, by + bh * 0.08);
        ctx.lineTo(bx + bw + sideW, by + bh + bh * 0.08);
        ctx.lineTo(bx + bw, by + bh);
        ctx.closePath();
        ctx.fill();
        // Techo con profundidad
        ctx.globalAlpha = 0.4;
        const roofG = ctx.createLinearGradient(bx, by, bx + bw, by);
        roofG.addColorStop(0, `rgba(${baseR-10},${baseG-10},${baseB-5},0.7)`);
        roofG.addColorStop(1, `rgba(${baseR-25},${baseG-25},${baseB-20},0.75)`);
        ctx.fillStyle = roofG;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + bw, by);
        ctx.lineTo(bx + bw + sideW, by + bh * 0.08);
        ctx.lineTo(bx + sideW, by + bh * 0.08);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        // Ventanas con reflejos
        const floors = Math.floor(b.h * 18);
        const winW = bw * 0.11, winH = bh / floors * 0.45;
        const cols = Math.floor(bw / (winW * 1.6));
        for (let floor = 0; floor < floors; floor++) {
          for (let col = 0; col < cols; col++) {
            const wx = bx + (col + 0.6) * (bw / cols) - winW * 0.5;
            const wy = by + floor * (bh / floors) + (bh / floors - winH) * 0.5;
            const lit = sr(i * 157 + floor * 13 + col * 7) > (0.25 + timeOfDay * 0.3);
            const flicker = sr(i * 200 + floor * 20 + col * 10 + Math.floor(t * 3)) > 0.95 ? 0.7 : 1;
            // Marco de ventana
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = '#000000';
            ctx.fillRect(wx - 1, wy - 1, winW + 2, winH + 2);
            // Luz de ventana
            if (lit) {
              ctx.globalAlpha = (0.65 + timeOfDay * 0.25) * flicker * b.depth;
              const winG = ctx.createRadialGradient(wx + winW * 0.5, wy + winH * 0.5, 0, wx + winW * 0.5, wy + winH * 0.5, winW * 0.8);
              winG.addColorStop(0, '#ffffcc');
              winG.addColorStop(0.7, '#ffeeaa');
              winG.addColorStop(1, '#aa9955');
              ctx.fillStyle = winG;
              ctx.fillRect(wx, wy, winW, winH);
              // Glow de ventana
              ctx.globalAlpha = 0.15 * flicker;
              ctx.shadowColor = '#ffeeaa';
              ctx.shadowBlur = 8;
              ctx.fillRect(wx, wy, winW, winH);
              ctx.shadowBlur = 0;
            } else {
              ctx.globalAlpha = 0.12;
              ctx.fillStyle = timeOfDay < 0.3 ? '#334466' : '#223344';
              ctx.fillRect(wx, wy, winW, winH);
            }
          }
        }
      });
      // Luces de la calle (postes)
      for (let light = 0; light < 4; light++) {
        const lx = (0.15 + light * 0.25) * W;
        const ly = H * 0.88;
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(lx - W * 0.003, ly, W * 0.006, H * 0.12);
        // Luz del poste
        const lightOn = (1 - timeOfDay) > 0.4;
        if (lightOn) {
          ctx.globalAlpha = 0.6;
          const streetLightG = ctx.createRadialGradient(lx, ly, 0, lx, ly, Math.min(W, H) * 0.08);
          streetLightG.addColorStop(0, 'rgba(255,240,180,0.4)');
          streetLightG.addColorStop(0.5, 'rgba(255,220,140,0.15)');
          streetLightG.addColorStop(1, 'transparent');
          ctx.fillStyle = streetLightG;
          ctx.beginPath(); ctx.arc(lx, ly, Math.min(W, H) * 0.08, 0, 6.28); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    },

    // ── Nuevas animaciones ───────────────────────────

    psicodelico: (ctx, W, H, t) => {
      // Kaleidoscope-style rotating colored triangles (non-nauseating speed)
      ctx.save();
      const cx = W * 0.5, cy = H * 0.5;
      const sides = 6, slices = 12;
      for (let s = 0; s < slices; s++) {
        const ang = (s / slices) * Math.PI * 2 + t * 0.22;
        const ang2 = ((s + 1) / slices) * Math.PI * 2 + t * 0.22;
        const r1 = Math.min(W, H) * (0.12 + ((s * 37 + Math.floor(t * 0.5)) % 5) * 0.07);
        const r2 = r1 + Math.min(W, H) * (0.08 + ((s * 53) % 4) * 0.06);
        const hue = (s * 30 + t * 25) % 360;
        const alpha = 0.10 + 0.08 * Math.sin(t * 0.8 + s);
        ctx.save();
        ctx.globalAlpha = alpha;
        const grad = ctx.createLinearGradient(cx, cy, cx + Math.cos(ang) * r2, cy + Math.sin(ang) * r2);
        grad.addColorStop(0, `hsla(${hue},100%,65%,0.8)`);
        grad.addColorStop(1, `hsla(${(hue + 60) % 360},90%,50%,0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(ang) * r2, cy + Math.sin(ang) * r2);
        ctx.lineTo(cx + Math.cos(ang2) * r2, cy + Math.sin(ang2) * r2);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      // Rotating outer rings
      for (let ring = 0; ring < 4; ring++) {
        const rr = Math.min(W, H) * (0.25 + ring * 0.11);
        const hue2 = (ring * 80 + t * 20 + 120) % 360;
        const a = 0.06 + 0.04 * Math.sin(t * 1.2 + ring);
        ctx.save(); ctx.globalAlpha = a;
        ctx.strokeStyle = `hsl(${hue2},100%,70%)`; ctx.lineWidth = 2;
        ctx.shadowColor = `hsl(${hue2},100%,70%)`; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    },

    hipnotico_espiral: (ctx, W, H, t) => {
      // Smooth rotating spiral rings — gentle and non-nauseating
      const cx = W * 0.5, cy = H * 0.5;
      const maxR = Math.min(W, H) * 0.44;
      ctx.save();
      const rings = 18;
      for (let r = 0; r < rings; r++) {
        const frac = r / rings;
        const radius = maxR * frac;
        const angle = frac * Math.PI * 6 + t * 0.35;
        const hue = (r * 18 + t * 15) % 360;
        const alpha = 0.06 + 0.05 * Math.sin(t * 0.5 + r * 0.4);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = `hsl(${hue},80%,65%)`;
        ctx.lineWidth = 1.2 + frac * 1.8;
        // Draw an arc segment that rotates
        ctx.beginPath();
        ctx.arc(cx, cy, radius, angle, angle + Math.PI * 1.6);
        ctx.stroke();
        ctx.restore();
      }
      // Central gentle pulse
      const pulse = 0.92 + 0.08 * Math.sin(t * 1.1);
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.22 * pulse);
      cg.addColorStop(0, `hsla(${(t * 20) % 360},80%,70%,0.12)`);
      cg.addColorStop(1, 'transparent');
      ctx.fillStyle = cg; ctx.fillRect(0, 0, W, H);
      ctx.restore();
    },

    ritmo_pulso: (ctx, W, H, t) => {
      // Concentric pulsing rings that beat rhythmically
      const cx = W * 0.5, cy = H * 0.5;
      ctx.save();
      const bpm = 120; // beats per minute
      const beatPhase = (t * bpm / 60) % 1; // 0..1 per beat
      const beatPop = Math.pow(1 - beatPhase, 2.5) * 0.18; // sharp pop on beat
      for (let w = 0; w < 8; w++) {
        const phase = ((t * 1.2 + w / 8) % 1);
        const r = (0.05 + phase * 0.95) * Math.min(W, H) * 0.46 + beatPop * Math.min(W, H) * 0.1;
        const hue = (w * 45 + t * 30) % 360;
        const alpha = Math.pow(1 - phase, 1.6) * 0.22;
        if (alpha < 0.005) continue;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = `hsl(${hue},90%,65%)`;
        ctx.shadowColor = `hsl(${hue},100%,70%)`;
        ctx.shadowBlur = 12;
        ctx.lineWidth = 2.5 - phase * 1.5;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      // Beat flash
      if (beatPhase < 0.1) {
        ctx.save();
        ctx.globalAlpha = (0.1 - beatPhase) * 10 * 0.04;
        ctx.fillStyle = `hsl(${(t * 40) % 360},100%,70%)`;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
      ctx.restore();
    },

    viaje_espacial: (ctx, W, H, t) => {
      // Starfield warp / hyperspace — star streaks radiating from centre
      const cx = W * 0.5, cy = H * 0.5;
      const speed = 0.6; // warp factor (0=slow, 1=hyper)
      ctx.save();
      DATA.stars.forEach((s, i) => {
        const angle = Math.atan2(s.y - 0.5, s.x - 0.5);
        const baseDist = Math.hypot(s.x - 0.5, s.y - 0.5);
        // How far along in "warp" — phase using time + per-star offset
        const phase = ((t * speed * 0.4 + s.ph) % 1);
        const dist = baseDist * (0.05 + phase * 0.95);
        const nx = 0.5 + Math.cos(angle) * dist;
        const ny = 0.5 + Math.sin(angle) * dist;
        // Streak length proportional to speed and phase
        const streakLen = dist * 0.18 * (0.5 + phase * 2);
        const ex = 0.5 + Math.cos(angle) * Math.max(0, dist - streakLen);
        const ey = 0.5 + Math.sin(angle) * Math.max(0, dist - streakLen);
        const alpha = Math.min(1, phase * 4) * s.a;
        if (alpha < 0.02) return;
        const sg = ctx.createLinearGradient(ex * W, ey * H, nx * W, ny * H);
        const col = i % 5 === 0 ? '#aaddff' : i % 3 === 0 ? '#ffeeaa' : '#ffffff';
        sg.addColorStop(0, 'transparent');
        sg.addColorStop(1, col);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = sg;
        ctx.lineWidth = 0.8 + phase * 1.4;
        ctx.beginPath(); ctx.moveTo(ex * W, ey * H); ctx.lineTo(nx * W, ny * H); ctx.stroke();
      });
      // Bluish warp glow in the centre
      const wg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.18);
      wg.addColorStop(0, 'rgba(100,180,255,0.10)');
      wg.addColorStop(1, 'transparent');
      ctx.globalAlpha = 1; ctx.fillStyle = wg; ctx.fillRect(0, 0, W, H);
      ctx.restore();
    },

    laser_show: (ctx, W, H, t) => {
      // Sweeping laser beams with glow
      ctx.save();
      const beams = 6;
      for (let b = 0; b < beams; b++) {
        const baseAngle = (b / beams) * Math.PI * 2;
        const sweep = Math.sin(t * 0.7 + b * 1.1) * 0.6;
        const ang = baseAngle + sweep;
        const hue = (b * 60 + t * 40) % 360;
        const alpha = 0.12 + 0.06 * Math.sin(t * 1.5 + b);
        const cx2 = W * (0.3 + (b % 3) * 0.2), cy2 = H * (0.4 + (b % 2) * 0.2);
        const len = Math.max(W, H) * 1.2;
        ctx.save();
        ctx.globalAlpha = alpha;
        const lg = ctx.createLinearGradient(cx2, cy2, cx2 + Math.cos(ang) * len, cy2 + Math.sin(ang) * len);
        lg.addColorStop(0, `hsl(${hue},100%,70%)`);
        lg.addColorStop(0.6, `hsla(${hue},100%,60%,0.3)`);
        lg.addColorStop(1, 'transparent');
        ctx.strokeStyle = lg;
        ctx.shadowColor = `hsl(${hue},100%,70%)`;
        ctx.shadowBlur = 18;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx2, cy2);
        ctx.lineTo(cx2 + Math.cos(ang) * len, cy2 + Math.sin(ang) * len);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    },

    // ── Canciones ───────────────────────────
    ...(ENABLE_CANCIONES ? {

    camaras_silencio: (ctx, W, H, t) => {
      // Ciclo de 90s: luna tranquila → preparación → salto → flotando → reset
      const π2 = Math.PI * 2;
      const CYCLE = 90;
      const ct = t % CYCLE;
      function ss(a, b, x) { const v = Math.max(0, Math.min(1, (x-a)/(b-a))); return v*v*(3-2*v); }

      const jumpP  = ss(0.44*CYCLE, 0.62*CYCLE, ct);  // arco del salto 0→1
      const floatP = ss(0.62*CYCLE, 0.82*CYCLE, ct);  // flotando 0→1
      const prepP  = ss(0.28*CYCLE, 0.44*CYCLE, ct);  // preparación 0→1
      const resetP = ss(0.82*CYCLE, 1.00*CYCLE, ct);  // reseteo 0→1

      // ── Estrellas ──
      DATA.stars.forEach(s => {
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * s.spd * 0.5 + s.ph));
        ctx.globalAlpha = s.a * tw * 0.82;
        ctx.fillStyle = s.a > 0.7 ? '#fff' : s.a > 0.5 ? '#d8eaff' : '#9090bb';
        ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r * 0.65, 0, π2); ctx.fill();
      });
      ctx.globalAlpha = 1;

      // ── Nebulosas ──
      [[0.72, 0.25, 0.33, 240, 0], [0.18, 0.58, 0.25, 275, 2.1], [0.50, 0.87, 0.20, 210, 4.2]]
        .forEach(([nx, ny, nr, nh, nph]) => {
          const pulse = 0.03 + 0.008 * Math.sin(t * 0.04 + nph);
          const ng = ctx.createRadialGradient(nx*W, ny*H, 0, nx*W, ny*H, nr*W);
          ng.addColorStop(0, `hsla(${nh},80%,62%,${(pulse*3.5).toFixed(3)}`);
          ng.addColorStop(0.5, `hsla(${nh+20},70%,48%,${(pulse*1.2).toFixed(3)}`);
          ng.addColorStop(1, 'transparent');
          ctx.fillStyle = ng; ctx.fillRect(0, 0, W, H);
        });

      // ── Tierra (empieza parcialmente fuera de pantalla, crece al saltar) ──
      const eBaseR = W * 0.30;
      const eR  = eBaseR * (1 + jumpP*0.50 + floatP*0.25 - resetP*0.28);
      const eCX = W  * (1.08 - jumpP*0.26 - floatP*0.08 + resetP*0.10);
      const eCY = H  * (1.18 - jumpP*0.44 - floatP*0.10 + resetP*0.12);

      // Atmósfera
      ctx.save();
      const atmoG = ctx.createRadialGradient(eCX, eCY, eR*0.88, eCX, eCY, eR*1.14);
      atmoG.addColorStop(0, 'rgba(88,152,255,0.27)');
      atmoG.addColorStop(0.5, 'rgba(50,95,215,0.09)');
      atmoG.addColorStop(1, 'transparent');
      ctx.fillStyle = atmoG;
      ctx.beginPath(); ctx.arc(eCX, eCY, eR*1.14, 0, π2); ctx.fill();

      // Cuerpo de la Tierra (clip)
      ctx.beginPath(); ctx.arc(eCX, eCY, eR, 0, π2);
      ctx.save(); ctx.clip();

      // Océano
      const oceanG = ctx.createLinearGradient(eCX-eR, eCY-eR, eCX+eR, eCY+eR);
      oceanG.addColorStop(0, '#193f8a'); oceanG.addColorStop(0.45, '#1e65c4'); oceanG.addColorStop(1, '#0d2055');
      ctx.fillStyle = oceanG; ctx.fillRect(eCX-eR*1.1, eCY-eR*1.1, eR*2.2, eR*2.2);

      // Continentes (rotan despacio)
      const eRot = t * 0.016;
      ctx.save(); ctx.translate(eCX, eCY); ctx.rotate(eRot);
      ctx.fillStyle = '#2d7a38';
      ctx.beginPath(); ctx.ellipse(-eR*0.33, -eR*0.22, eR*0.17, eR*0.24, -0.25, 0, π2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(-eR*0.26,  eR*0.18, eR*0.12, eR*0.21,  0.15, 0, π2); ctx.fill();
      ctx.fillStyle = '#348a40';
      ctx.beginPath(); ctx.ellipse( eR*0.12, -eR*0.12, eR*0.13, eR*0.19,  0.10, 0, π2); ctx.fill();
      ctx.beginPath(); ctx.ellipse( eR*0.16,  eR*0.20, eR*0.11, eR*0.24, -0.05, 0, π2); ctx.fill();
      ctx.fillStyle = '#2d7a38';
      ctx.beginPath(); ctx.ellipse( eR*0.42, -eR*0.18, eR*0.21, eR*0.17,  0.28, 0, π2); ctx.fill();
      ctx.fillStyle = '#dde8f5';
      ctx.beginPath(); ctx.ellipse(0, -eR*0.85, eR*0.31, eR*0.09, 0, 0, π2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0,  eR*0.85, eR*0.44, eR*0.11, 0, 0, π2); ctx.fill();
      ctx.restore();

      // Nubes (giran más rápido)
      ctx.save(); ctx.translate(eCX, eCY); ctx.rotate(t * 0.024);
      ctx.fillStyle = 'rgba(255,255,255,0.44)';
      ctx.beginPath(); ctx.ellipse(-eR*0.06, -eR*0.52, eR*0.30, eR*0.074, 0.35, 0, π2); ctx.fill();
      ctx.beginPath(); ctx.ellipse( eR*0.32,  eR*0.30, eR*0.24, eR*0.062, -0.22, 0, π2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(-eR*0.34,  eR*0.42, eR*0.19, eR*0.055,  0.15, 0, π2); ctx.fill();
      ctx.restore();

      // Terminador (noche al lado derecho)
      const shadG = ctx.createLinearGradient(eCX+eR*0.16, eCY, eCX+eR*0.85, eCY);
      shadG.addColorStop(0, 'transparent');
      shadG.addColorStop(0.5, 'rgba(0,0,14,0.26)');
      shadG.addColorStop(1, 'rgba(0,0,10,0.70)');
      ctx.fillStyle = shadG; ctx.fillRect(eCX-eR*1.1, eCY-eR*1.1, eR*2.2, eR*2.2);

      // Brillo especular
      const specG = ctx.createRadialGradient(eCX-eR*0.28, eCY-eR*0.28, 0, eCX, eCY, eR*0.9);
      specG.addColorStop(0, 'rgba(255,255,255,0.10)'); specG.addColorStop(1, 'transparent');
      ctx.fillStyle = specG; ctx.fillRect(eCX-eR*1.1, eCY-eR*1.1, eR*2.2, eR*2.2);

      ctx.restore(); // fin clip Tierra
      ctx.restore(); // fin save Tierra

      // ── Luna ──
      const moonX  = W * 0.46;
      const moonY  = H * 0.65;
      const moonR  = Math.min(W, H) * 0.095;
      const moonBob = Math.sin(t * 0.55) * 3;
      const moonCY  = moonY + moonBob;

      // Halo lunar
      ctx.save();
      const mHalo = ctx.createRadialGradient(moonX, moonCY, moonR*0.6, moonX, moonCY, moonR*2.0);
      mHalo.addColorStop(0, 'rgba(255,252,210,0.20)');
      mHalo.addColorStop(0.55, 'rgba(240,235,185,0.06)');
      mHalo.addColorStop(1, 'transparent');
      ctx.fillStyle = mHalo;
      ctx.beginPath(); ctx.arc(moonX, moonCY, moonR*2.0, 0, π2); ctx.fill();

      // Cuerpo lunar (clip)
      ctx.beginPath(); ctx.arc(moonX, moonCY, moonR, 0, π2);
      ctx.save(); ctx.clip();
      const mBodyG = ctx.createRadialGradient(moonX-moonR*0.28, moonCY-moonR*0.28, moonR*0.05, moonX+moonR*0.08, moonCY+moonR*0.08, moonR);
      mBodyG.addColorStop(0, '#fffef0');
      mBodyG.addColorStop(0.45, '#e0d8a8');
      mBodyG.addColorStop(0.75, '#c4ba80');
      mBodyG.addColorStop(1,    '#9a9060');
      ctx.fillStyle = mBodyG;
      ctx.fillRect(moonX-moonR, moonCY-moonR, moonR*2, moonR*2);

      // Cráteres
      [[ 0.32,-0.30, 0.16],[-0.30, 0.20, 0.14],[ 0.06, 0.38, 0.10],[-0.44,-0.18, 0.10],[ 0.44, 0.24, 0.09]]
        .forEach(([dx, dy, cr]) => {
          const cx3 = moonX + dx*moonR, cy3 = moonCY + dy*moonR, cr3 = cr*moonR;
          ctx.save(); ctx.beginPath(); ctx.arc(cx3, cy3, cr3, 0, π2); ctx.clip();
          const cg = ctx.createRadialGradient(cx3+cr3*0.2, cy3-cr3*0.3, 0, cx3, cy3, cr3);
          cg.addColorStop(0, 'rgba(235,230,205,0.75)');
          cg.addColorStop(0.65, 'rgba(165,155,112,0.85)');
          cg.addColorStop(1, 'rgba(130,120,80,0.55)');
          ctx.fillStyle = cg; ctx.fillRect(cx3-cr3, cy3-cr3, cr3*2, cr3*2);
          ctx.restore();
        });

      ctx.restore(); // fin clip Luna

      // Borde iluminado (rim)
      ctx.strokeStyle = 'rgba(255,252,228,0.34)';
      ctx.lineWidth = moonR*0.055;
      ctx.beginPath(); ctx.arc(moonX-moonR*0.14, moonCY-moonR*0.14, moonR*0.82, Math.PI*1.08, Math.PI*1.65); ctx.stroke();
      ctx.restore(); // fin save Luna

      // ── Astronauta ──
      const astH    = moonR * 0.70;           // altura figura
      const moonTopY = moonCY - moonR;        // tangente superior de la luna
      const astStartX = moonX;
      const astStartY = moonTopY - astH * 0.38;
      const arcCtrlX  = moonX + (eCX - moonX) * 0.25;
      const arcCtrlY  = Math.min(astStartY, eCY - eR) - H * 0.20;
      const astEndX   = eCX - eR * 0.28;
      const astEndY   = eCY - eR * 0.90;

      // Bezier cuadrático
      const jp = jumpP;
      const astX2 = (1-jp)*(1-jp)*astStartX + 2*(1-jp)*jp*arcCtrlX + jp*jp*astEndX;
      const astY2 = (1-jp)*(1-jp)*astStartY + 2*(1-jp)*jp*arcCtrlY + jp*jp*astEndY;
      const finX  = jp < 0.001 ? astStartX : astX2;
      const finY  = jp < 0.001 ? astStartY + moonBob : astY2;

      // Rotación: tumble suave durante el salto
      const astRot  = jp * Math.PI * 0.38 + (jp < 0.001 ? Math.sin(t*0.7)*0.04 : 0);
      const astLean = prepP * 0.20;

      // Opacidad: desvanece al llegar a la Tierra, reaparece en reset
      let astAlpha = floatP > 0.85 ? 1 - ss(0.85, 1.0, floatP) : 1;
      if (resetP > 0.30) astAlpha = ss(0.30, 0.65, resetP);

      const s = astH;
      ctx.save();
      ctx.globalAlpha = astAlpha;
      ctx.translate(finX, finY);
      ctx.rotate(astRot + astLean);

      // Mochila de soporte vital
      ctx.fillStyle = '#b2b2b2';
      ctx.fillRect(-s*0.10, -s*0.12, s*0.20, s*0.30);

      // Traje (cuerpo)
      ctx.fillStyle = '#f0f0ec';
      ctx.beginPath(); ctx.ellipse(0, s*0.06, s*0.22, s*0.28, 0, 0, π2); ctx.fill();

      // Detalle central del traje
      ctx.strokeStyle = 'rgba(190,190,190,0.50)';
      ctx.lineWidth = s * 0.024;
      ctx.beginPath(); ctx.moveTo(0, -s*0.14); ctx.lineTo(0, s*0.28); ctx.stroke();

      // Piernas
      ctx.fillStyle = '#e0e0dc';
      ctx.save(); ctx.translate(-s*0.09, s*0.28); ctx.rotate(jp > 0.001 ? 0.22 : 0);
      ctx.fillRect(-s*0.078, 0, s*0.156, s*0.26);
      ctx.fillStyle = '#888880'; ctx.beginPath(); ctx.ellipse(-s*0.014, s*0.27, s*0.082, s*0.048, 0.12, 0, π2); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#e0e0dc';
      ctx.save(); ctx.translate(s*0.09, s*0.28); ctx.rotate(jp > 0.001 ? -0.22 : 0);
      ctx.fillRect(-s*0.078, 0, s*0.156, s*0.26);
      ctx.fillStyle = '#888880'; ctx.beginPath(); ctx.ellipse(s*0.014, s*0.27, s*0.082, s*0.048, -0.12, 0, π2); ctx.fill();
      ctx.restore();

      // Brazos
      ctx.fillStyle = '#e4e4e0';
      ctx.save(); ctx.translate(-s*0.24, 0); ctx.rotate(jp > 0.001 ? -0.74 : astLean > 0.05 ? 0.32 : 0.12);
      ctx.fillRect(-s*0.065, 0, s*0.13, s*0.22);
      ctx.fillStyle = '#aaaaaa'; ctx.beginPath(); ctx.ellipse(0, s*0.23, s*0.066, s*0.046, 0, 0, π2); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#e4e4e0';
      ctx.save(); ctx.translate(s*0.24, 0); ctx.rotate(jp > 0.001 ? 0.74 : astLean > 0.05 ? -0.32 : -0.12);
      ctx.fillRect(-s*0.065, 0, s*0.13, s*0.22);
      ctx.fillStyle = '#aaaaaa'; ctx.beginPath(); ctx.ellipse(0, s*0.23, s*0.066, s*0.046, 0, 0, π2); ctx.fill();
      ctx.restore();

      // Casco
      ctx.fillStyle = '#e8e8e4';
      ctx.beginPath(); ctx.arc(0, -s*0.30, s*0.26, 0, π2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.52)';
      ctx.lineWidth = s * 0.022;
      ctx.beginPath(); ctx.arc(-s*0.07, -s*0.38, s*0.22, Math.PI*1.05, Math.PI*1.62); ctx.stroke();

      // Visor (dorado reflectante)
      ctx.save();
      ctx.beginPath(); ctx.ellipse(0, -s*0.30, s*0.17, s*0.12, 0, 0, π2); ctx.clip();
      const visG = ctx.createLinearGradient(-s*0.17, -s*0.42, s*0.17, -s*0.18);
      visG.addColorStop(0, '#ffd030'); visG.addColorStop(0.55, '#c08010'); visG.addColorStop(1, '#7a5000');
      ctx.fillStyle = visG; ctx.fillRect(-s*0.17, -s*0.42, s*0.34, s*0.24);
      ctx.fillStyle = 'rgba(255,255,255,0.20)';
      ctx.beginPath(); ctx.ellipse(-s*0.065, -s*0.36, s*0.055, s*0.038, -0.38, 0, π2); ctx.fill();
      ctx.restore();

      ctx.restore(); // astronauta

      // ── Estrellas fugaces ocasionales ──
      DATA.shoots.forEach(sh => {
        const cyc = (t * 0.55 + sh.startFrac * 14) % sh.interval;
        if (cyc >= 1.8) return;
        const p = cyc / 1.8;
        const x1=sh.x0*W, y1=sh.y0*H, len=W*0.11;
        const x2=x1+Math.cos(Math.PI*0.26)*len*p, y2=y1+Math.sin(Math.PI*0.26)*len*p;
        const sg = ctx.createLinearGradient(x1, y1, x2, y2);
        sg.addColorStop(0, 'rgba(255,255,255,0.85)'); sg.addColorStop(1, 'transparent');
        ctx.strokeStyle = sg; ctx.lineWidth = 1.5; ctx.globalAlpha = (1 - p*0.45)*0.65;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      });
      ctx.globalAlpha = 1; ctx.lineWidth = 1;
    },

    } : {}),

    // ── Fondos sólidos ───────────────────────────────────────────────
    bg_negro:      (ctx, W, H) => { ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, H); },
    bg_gris_osc:   (ctx, W, H) => { ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, W, H); },
    bg_gris:       (ctx, W, H) => { ctx.fillStyle = '#3a3a4a'; ctx.fillRect(0, 0, W, H); },
    bg_gris_claro: (ctx, W, H) => { ctx.fillStyle = '#888898'; ctx.fillRect(0, 0, W, H); },
    bg_blanco:     (ctx, W, H) => { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H); },
    bg_rojo_osc:   (ctx, W, H) => { ctx.fillStyle = '#6b0000'; ctx.fillRect(0, 0, W, H); },
    bg_rojo:       (ctx, W, H) => { ctx.fillStyle = '#c00000'; ctx.fillRect(0, 0, W, H); },
    bg_naranja:    (ctx, W, H) => { ctx.fillStyle = '#c05000'; ctx.fillRect(0, 0, W, H); },
    bg_amarillo:   (ctx, W, H) => { ctx.fillStyle = '#9a8000'; ctx.fillRect(0, 0, W, H); },
    bg_verde_osc:  (ctx, W, H) => { ctx.fillStyle = '#083d1a'; ctx.fillRect(0, 0, W, H); },
    bg_verde:      (ctx, W, H) => { ctx.fillStyle = '#156330'; ctx.fillRect(0, 0, W, H); },
    bg_cian:       (ctx, W, H) => { ctx.fillStyle = '#085a6a'; ctx.fillRect(0, 0, W, H); },
    bg_azul_osc:   (ctx, W, H) => { ctx.fillStyle = '#081540'; ctx.fillRect(0, 0, W, H); },
    bg_azul:       (ctx, W, H) => { ctx.fillStyle = '#153080'; ctx.fillRect(0, 0, W, H); },
    bg_morado:     (ctx, W, H) => { ctx.fillStyle = '#2e0875'; ctx.fillRect(0, 0, W, H); },
    bg_rosa:       (ctx, W, H) => { ctx.fillStyle = '#7a1040'; ctx.fillRect(0, 0, W, H); },
    bg_marron:     (ctx, W, H) => { ctx.fillStyle = '#3d1e00'; ctx.fillRect(0, 0, W, H); },

    // ── Texturas estáticas ───────────────────────────────────────────
    tex_lunares: (ctx, W, H) => {
      const r = W * 0.011, gx = W * 0.044, gy = gx;
      ctx.fillStyle = 'rgba(255,255,255,0.09)';
      for (let x = gx; x < W + gx; x += gx)
        for (let y = gy; y < H + gy; y += gy) {
          ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.fill();
        }
    },
    tex_puntos: (ctx, W, H) => {
      const gx = W * 0.024, r = W * 0.003;
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      for (let x = gx; x < W; x += gx)
        for (let y = gx; y < H; y += gx) {
          ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.fill();
        }
    },
    tex_rayas_h: (ctx, W, H) => {
      const h = Math.max(2, Math.round(H * 0.016));
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      for (let y = 0; y < H; y += h * 2) ctx.fillRect(0, y, W, h);
    },
    tex_rayas_v: (ctx, W, H) => {
      const w = Math.max(2, Math.round(W * 0.01));
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      for (let x = 0; x < W; x += w * 2) ctx.fillRect(x, 0, w, H);
    },
    tex_cuadros: (ctx, W, H) => {
      const s = W * 0.038;
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      for (let xi = 0; xi * s < W; xi++)
        for (let yi = 0; yi * s < H; yi++)
          if ((xi + yi) % 2 === 0) ctx.fillRect(xi * s, yi * s, s, s);
    },
    tex_hex: (ctx, W, H) => {
      const s = W * 0.026, h = s * Math.sqrt(3);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = Math.max(1, W * 0.0008);
      for (let xi = -1; xi * s * 1.5 < W + s; xi++) {
        for (let yi = -1; yi * h < H + h; yi++) {
          const cx = xi * s * 1.5 + s * 0.75;
          const cy = yi * h + (xi % 2 ? h / 2 : 0);
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = i * Math.PI / 3 - Math.PI / 6;
            i === 0 ? ctx.moveTo(cx + s * Math.cos(a), cy + s * Math.sin(a))
                    : ctx.lineTo(cx + s * Math.cos(a), cy + s * Math.sin(a));
          }
          ctx.closePath(); ctx.stroke();
        }
      }
    },
    tex_diag: (ctx, W, H) => {
      const gap = W * 0.028;
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth = Math.max(1, W * 0.0012);
      for (let d = -H; d < W + H; d += gap) {
        ctx.beginPath(); ctx.moveTo(d, 0); ctx.lineTo(d + H, H); ctx.stroke();
      }
    },
    tex_papel: (ctx, W, H) => {
      const step = Math.max(2, Math.round(W / 220));
      for (let x = 0; x < W; x += step) {
        for (let y = 0; y < H; y += step) {
          const n = (sr((x / step) * 1.7 + (y / step) * 3.1) - 0.5) * 0.14;
          ctx.fillStyle = n > 0 ? `rgba(255,255,255,${n.toFixed(3)})` : `rgba(0,0,0,${(-n).toFixed(3)})`;
          ctx.fillRect(x, y, step, step);
        }
      }
    },
    tex_marmol: (ctx, W, H) => {
      for (let y = 0; y < H; y += 3) {
        const al = Math.max(0, Math.sin((y / H) * Math.PI * 8) * 0.08 + Math.sin((y / H) * Math.PI * 3.7) * 0.04);
        if (al > 0.005) { ctx.fillStyle = `rgba(255,255,255,${al.toFixed(3)})`; ctx.fillRect(0, y, W, 3); }
      }
      ctx.globalAlpha = 0.07;
      for (let i = 0; i < 6; i++) {
        const x0 = sr(i * 7 + 1000) * W;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = W * (0.001 + sr(i * 7 + 1002) * 0.002);
        ctx.beginPath(); ctx.moveTo(x0, 0);
        ctx.bezierCurveTo(x0 + (sr(i*7+1003)-0.5)*W*0.3, H*0.3, x0 + (sr(i*7+1004)-0.5)*W*0.3, H*0.7, x0 + (sr(i*7+1001)-0.5)*W*0.2, H);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },
    tex_madera: (ctx, W, H) => {
      for (let yi = 0; yi < 32; yi++) {
        const baseY = (yi / 32) * H;
        const thick = H * (0.008 + sr(yi * 4 + 200) * 0.01);
        const al = 0.05 + sr(yi * 4 + 201) * 0.07;
        ctx.fillStyle = `rgba(200,140,60,${al.toFixed(3)})`;
        ctx.fillRect(0, baseY, W, thick);
      }
    },
  };

  const ANIMATION_LIST = [
    { id: 'none',              label: 'Ninguna',    emoji: '⬜', cat: 'basico' },
    // Sólidos
    { id: 'bg_negro',      label: 'Negro',        emoji: '⬛', cat: 'solido' },
    { id: 'bg_gris_osc',   label: 'Gris oscuro',  emoji: '🔲', cat: 'solido' },
    { id: 'bg_gris',       label: 'Gris',         emoji: '▪',  cat: 'solido' },
    { id: 'bg_gris_claro', label: 'Gris claro',   emoji: '▫',  cat: 'solido' },
    { id: 'bg_blanco',     label: 'Blanco',       emoji: '⬜', cat: 'solido' },
    { id: 'bg_rojo_osc',   label: 'Rojo oscuro',  emoji: '🟥', cat: 'solido' },
    { id: 'bg_rojo',       label: 'Rojo',         emoji: '🔴', cat: 'solido' },
    { id: 'bg_naranja',    label: 'Naranja',      emoji: '🟠', cat: 'solido' },
    { id: 'bg_amarillo',   label: 'Amarillo',     emoji: '🟡', cat: 'solido' },
    { id: 'bg_verde_osc',  label: 'Verde oscuro', emoji: '🟩', cat: 'solido' },
    { id: 'bg_verde',      label: 'Verde',        emoji: '🟢', cat: 'solido' },
    { id: 'bg_cian',       label: 'Cian',         emoji: '🔵', cat: 'solido' },
    { id: 'bg_azul_osc',   label: 'Azul oscuro',  emoji: '🟦', cat: 'solido' },
    { id: 'bg_azul',       label: 'Azul',         emoji: '💙', cat: 'solido' },
    { id: 'bg_morado',     label: 'Morado',       emoji: '🟣', cat: 'solido' },
    { id: 'bg_rosa',       label: 'Rosa',         emoji: '🩷', cat: 'solido' },
    { id: 'bg_marron',     label: 'Marrón',       emoji: '🟫', cat: 'solido' },
    // Texturas
    { id: 'tex_lunares',   label: 'Lunares',      emoji: '🔘', cat: 'textura' },
    { id: 'tex_puntos',    label: 'Puntos finos', emoji: '⁚',  cat: 'textura' },
    { id: 'tex_rayas_h',   label: 'Rayas horiz.', emoji: '〰', cat: 'textura' },
    { id: 'tex_rayas_v',   label: 'Rayas vert.',  emoji: '⏐',  cat: 'textura' },
    { id: 'tex_cuadros',   label: 'Cuadros',      emoji: '▦',  cat: 'textura' },
    { id: 'tex_hex',       label: 'Hexágonos',    emoji: '🔶', cat: 'textura' },
    { id: 'tex_diag',      label: 'Diagonal',     emoji: '╱',  cat: 'textura' },
    { id: 'tex_papel',     label: 'Papel/ruido',  emoji: '📄', cat: 'textura' },
    { id: 'tex_marmol',    label: 'Mármol',       emoji: '🪨', cat: 'textura' },
    { id: 'tex_madera',    label: 'Madera',       emoji: '🌳', cat: 'textura' },
    // Espacio
    { id: 'galaxia',           label: 'Galaxia',    emoji: '🌌', cat: 'espacio' },
    { id: 'cosmos',            label: 'Cosmos',     emoji: '🚀', cat: 'espacio' },
    { id: 'nebulosa',          label: 'Nebulosa',   emoji: '🌠', cat: 'espacio' },
    { id: 'meteoritos',        label: 'Meteoritos', emoji: '☄️', cat: 'espacio' },
    { id: 'agujero_negro',     label: 'Agujero negro', emoji: '🕳️', cat: 'espacio' },
    // Naturaleza
    { id: 'aurora',            label: 'Aurora',     emoji: '🌈', cat: 'naturaleza' },
    { id: 'olas',              label: 'Olas',       emoji: '🌊', cat: 'naturaleza' },
    { id: 'lluvia',            label: 'Lluvia',     emoji: '🌧️', cat: 'naturaleza' },
    { id: 'fuego',             label: 'Fuego',      emoji: '🔥', cat: 'naturaleza' },
    { id: 'humo',              label: 'Humo',       emoji: '🌫️', cat: 'naturaleza' },
    { id: 'tormenta',          label: 'Tormenta',   emoji: '⛈️', cat: 'naturaleza' },
    // Energía
    { id: 'particulas',        label: 'Partículas', emoji: '✨', cat: 'energia' },
    { id: 'destellos',         label: 'Destellos',  emoji: '⭐', cat: 'energia' },
    { id: 'latido',            label: 'Latido',     emoji: '💗', cat: 'energia' },
    { id: 'vortex',            label: 'Vórtex',     emoji: '🌀', cat: 'energia' },
    { id: 'relampage',         label: 'Relámpago',  emoji: '⚡', cat: 'energia' },
    { id: 'plasma',            label: 'Plasma',     emoji: '🔴', cat: 'energia' },
    { id: 'ondas',             label: 'Ondas',      emoji: '〰️', cat: 'energia' },
    // Geométrico
    { id: 'hipnotico',         label: 'Hipnótico',  emoji: '🔮', cat: 'geometrico' },
    { id: 'tunel',             label: 'Túnel',      emoji: '🔲', cat: 'geometrico' },
    { id: 'diamante',          label: 'Diamantes',  emoji: '💎', cat: 'geometrico' },
    { id: 'prisma',            label: 'Prisma',     emoji: '🔆', cat: 'geometrico' },
    { id: 'cristal',           label: 'Cristal',    emoji: '🔷', cat: 'geometrico' },
    { id: 'mandala',           label: 'Mandala',    emoji: '🌸', cat: 'geometrico' },
    { id: 'espiral',           label: 'Espiral',    emoji: '🌀', cat: 'geometrico' },
    // Digital
    { id: 'matrix',            label: 'Matrix',     emoji: '💻', cat: 'digital' },
    { id: 'pixeles',           label: 'Píxeles',    emoji: '🟦', cat: 'digital' },
    { id: 'glitch',            label: 'Glitch',     emoji: '📺', cat: 'digital' },
    { id: 'binario',           label: 'Binario',    emoji: '01', cat: 'digital' },
    // Música
    { id: 'eq_bars',           label: 'Ecualizador',emoji: '🎧', cat: 'musica' },
    { id: 'vinilo',            label: 'Vinilo',     emoji: '💿', cat: 'musica' },
    { id: 'ondas_sonido',      label: 'Sonido',     emoji: '🎵', cat: 'musica' },
    { id: 'parlantes_neon',    label: 'Parlantes',  emoji: '📣', cat: 'musica' },
    // Festivo
    { id: 'confeti',           label: 'Confeti',    emoji: '🎊', cat: 'festivo' },
    { id: 'globos',            label: 'Globos',     emoji: '🎈', cat: 'festivo' },
    { id: 'fuegos_artificiales', label: 'Fuegos',   emoji: '🎆', cat: 'festivo' },
    // Nuevas animaciones
    { id: 'luna',              label: 'Luna',       emoji: '🌙', cat: 'naturaleza' },
    { id: 'synthwave',         label: 'Synthwave',  emoji: '🌆', cat: 'digital' },
    { id: 'planetas',          label: 'Planetas',   emoji: '🪐', cat: 'espacio' },
    { id: 'anime',             label: 'Anime',      emoji: '🎌', cat: 'tematico' },
    { id: 'metal',             label: 'Metal',      emoji: '🤘', cat: 'tematico' },
    { id: 'primavera',         label: 'Primavera',  emoji: '🌺', cat: 'naturaleza' },
    { id: 'verano',            label: 'Verano',     emoji: '☀️', cat: 'naturaleza' },
    { id: 'otono',             label: 'Otoño',      emoji: '🍂', cat: 'naturaleza' },
    { id: 'invierno',          label: 'Invierno',   emoji: '❄️', cat: 'naturaleza' },
    { id: 'campo',             label: 'Campo',      emoji: '🌾', cat: 'naturaleza' },
    { id: 'cerezos',           label: 'Cerezos',    emoji: '🌸', cat: 'tematico' },
    { id: 'urbano',            label: 'Urbano',     emoji: '🏙️', cat: 'tematico' },
    // Psicodélico / Hipnótico / Espacial
    { id: 'psicodelico',       label: 'Psicodélico',    emoji: '🌀', cat: 'psicodelico' },
    { id: 'hipnotico_espiral', label: 'Hipnótico',      emoji: '🔮', cat: 'psicodelico' },
    { id: 'ritmo_pulso',       label: 'Ritmo & Pulso',  emoji: '💓', cat: 'psicodelico' },
    { id: 'viaje_espacial',    label: 'Viaje Espacial', emoji: '🚀', cat: 'espacio' },
    { id: 'laser_show',        label: 'Láser Show',     emoji: '🔦', cat: 'energia' },
    // Canciones específicas
    ...(ENABLE_CANCIONES ? [
      { id: 'camaras_silencio', label: 'Cámaras de Silencio', emoji: '🌕', cat: 'canciones' },
    ] : []),
  ];

  const ANIMATION_CATEGORIES = [
    { id: 'basico',      label: 'Básico' },
    { id: 'solido',      label: '🎨 Sólido' },
    { id: 'textura',     label: '🧵 Texturas' },
    { id: 'espacio',     label: 'Espacio' },
    { id: 'naturaleza',  label: 'Naturaleza' },
    { id: 'energia',     label: 'Energía' },
    { id: 'geometrico',  label: 'Geométrico' },
    { id: 'digital',     label: 'Digital' },
    { id: 'musica',      label: 'Música' },
    { id: 'festivo',     label: 'Festivo' },
    { id: 'tematico',    label: 'Temático' },
    { id: 'psicodelico', label: '🌀 Psicodélico' },
    ...(ENABLE_CANCIONES ? [{ id: 'canciones', label: '🎵 Canciones' }] : []),
  ];

  const THEME_LIST = [
    // Oscuros
    { id: 'classic',   label: 'Clásico',    emoji: '🌌', cat: 'oscuro' },
    { id: 'neon',      label: 'Neón',       emoji: '⚡', cat: 'oscuro' },
    { id: 'fire',      label: 'Fuego',      emoji: '🔥', cat: 'oscuro' },
    { id: 'ocean',     label: 'Océano',     emoji: '💙', cat: 'oscuro' },
    { id: 'violeta',   label: 'Violeta',    emoji: '💜', cat: 'oscuro' },
    { id: 'esmeralda', label: 'Esmeralda',  emoji: '💚', cat: 'oscuro' },
    { id: 'atardecer', label: 'Atardecer',  emoji: '🌅', cat: 'oscuro' },
    { id: 'noir',      label: 'Noir',       emoji: '◾', cat: 'oscuro' },
    // Suaves / Claros
    { id: 'minimal',   label: 'Minimalista',emoji: '◻',  cat: 'claro' },
    { id: 'dorado',    label: 'Dorado',     emoji: '🏆', cat: 'claro' },
    { id: 'retro',     label: 'Retro',      emoji: '🎀', cat: 'claro' },
    { id: 'sakura',    label: 'Sakura',     emoji: '🌸', cat: 'claro' },
    { id: 'hielo',     label: 'Hielo',      emoji: '❄️', cat: 'claro' },
    { id: 'aurora',    label: 'Aurora',     emoji: '🌿', cat: 'claro' },
    { id: 'campo_dia', label: 'Campo',       emoji: '🌿', cat: 'claro' },
    { id: 'cielo',     label: 'Cielo',       emoji: '☁️', cat: 'claro' },
    { id: 'papiro',    label: 'Papiro',      emoji: '📜', cat: 'claro' },
    { id: 'coral',     label: 'Coral',       emoji: '🌸', cat: 'claro' },
    { id: 'menta',     label: 'Menta',       emoji: '🌱', cat: 'claro' },
    { id: 'lavanda',   label: 'Lavanda',     emoji: '💜', cat: 'claro' },
    // Oscuros adicionales
    { id: 'medianoche', label: 'Medianoche',  emoji: '🌑', cat: 'oscuro' },
    { id: 'terciopelo', label: 'Terciopelo',  emoji: '🟣', cat: 'oscuro' },
    { id: 'carbon',     label: 'Carbón',      emoji: '◼',  cat: 'oscuro' },
    // Vibrante
    { id: 'sunset',      label: 'Sunset',       emoji: '🌅', cat: 'vibrante' },
    { id: 'aurora_norte',label: 'Aurora Norte',  emoji: '🌿', cat: 'vibrante' },
    { id: 'amanecer',    label: 'Amanecer',      emoji: '🌄', cat: 'vibrante' },
    { id: 'tropico',     label: 'Trópico',       emoji: '🌊', cat: 'vibrante' },
    { id: 'candy',       label: 'Candy',         emoji: '🍬', cat: 'vibrante' },
    { id: 'electrico',   label: 'Eléctrico',     emoji: '⚡', cat: 'vibrante' },
    // Efectos & Textura
    { id: 'malla',      label: 'Malla',       emoji: '🎨', cat: 'textura' },
    { id: 'magma',      label: 'Magma',       emoji: '🌋', cat: 'textura' },
    { id: 'prismatico', label: 'Prismático',  emoji: '🌈', cat: 'textura' },
    { id: 'cobre',      label: 'Cobre',       emoji: '🔶', cat: 'textura' },
    { id: 'vino',       label: 'Vino',        emoji: '🍷', cat: 'textura' },
    // Gradientes & Motivos
    { id: 'arcoiris',        label: 'Arcoíris',       emoji: '🌈', cat: 'gradiente' },
    { id: 'oceano_profundo', label: 'Océano Profundo', emoji: '🌊', cat: 'gradiente' },
    { id: 'llamarada',       label: 'Llamarada',       emoji: '🔥', cat: 'gradiente' },
    { id: 'noche_estrellada',label: 'Noche Estrellada',emoji: '🌠', cat: 'gradiente' },
    { id: 'vhs',             label: 'VHS',             emoji: '📼', cat: 'gradiente' },
    { id: 'vintage_sepia',   label: 'Vintage Sepia',   emoji: '☕', cat: 'gradiente' },
    { id: 'nevada',          label: 'Nevada',          emoji: '❄️', cat: 'gradiente' },
    { id: 'nebulosa_cosmica',label: 'Nebulosa Cósmica', emoji: '🔮', cat: 'gradiente' },
  ];

  const THEME_CATEGORIES = [
    { id: 'oscuro',    label: 'Oscuros' },
    { id: 'claro',     label: 'Suaves / Claros' },
    { id: 'vibrante',  label: 'Vibrante' },
    { id: 'textura',   label: 'Efectos & Textura' },
    { id: 'gradiente', label: 'Gradientes & Motivos' },
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

    ondas_neon: (ctx, W, H, t) => {
      // Anillos de pulso neon desde el centro, elegante, sobre el texto
      const cx = W * 0.5, cy = H * 0.5;
      const maxR = Math.hypot(W * 0.5, H * 0.5) * 1.05;
      const lw = W / 1920;
      for (let w = 0; w < 7; w++) {
        const phase = ((t * 0.36 + w / 7) % 1);
        const wR    = 0.08 * maxR + phase * 0.92 * maxR;
        const hue   = (w * 51 + t * 17) % 360;
        const alpha = Math.pow(1 - phase, 2.2) * 0.28;
        if (alpha < 0.008) continue;
        ctx.save();
        ctx.globalAlpha  = alpha;
        ctx.shadowColor  = `hsl(${hue},100%,65%)`;
        ctx.shadowBlur   = 16;
        ctx.strokeStyle  = `hsl(${hue},100%,70%)`;
        ctx.lineWidth    = (2.8 - phase * 1.6) * lw;
        ctx.beginPath(); ctx.arc(cx, cy, wR, 0, Math.PI * 2); ctx.stroke();
        ctx.shadowBlur = 0; ctx.restore();
      }
      // Cuatro fuentes laterales (arriba-abajo, izq-der) para efecto de campo mús
      const anchors = [[0, cy], [W, cy], [cx, 0], [cx, H]];
      anchors.forEach(([ax, ay], ai) => {
        for (let w = 0; w < 4; w++) {
          const phase = ((t * 0.28 + w / 4 + ai * 0.11) % 1);
          const wR    = phase * Math.min(W, H) * 0.40;
          const hue   = (ai * 90 + w * 60 + t * 14) % 360;
          const alpha = Math.pow(1 - phase, 2.4) * 0.18;
          if (alpha < 0.006) continue;
          ctx.save();
          ctx.globalAlpha  = alpha;
          ctx.shadowColor  = `hsl(${hue},100%,65%)`;
          ctx.shadowBlur   = 12;
          ctx.strokeStyle  = `hsl(${hue},100%,72%)`;
          ctx.lineWidth    = (2.0 - phase * 1.2) * lw;
          ctx.beginPath(); ctx.arc(ax, ay, wR, 0, Math.PI * 2); ctx.stroke();
          ctx.shadowBlur = 0; ctx.restore();
        }
      });
      ctx.globalAlpha = 1; ctx.lineWidth = 1;
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

    corazones: (ctx, W, H, t) => {
      ctx.save();
      DATA.hearts.forEach(h => {
        const yFrac = 1 - ((h.y + t * h.spd) % 1);
        const xFrac = h.x + Math.sin(t * 0.5 + h.ph) * 0.025;
        const fade = Math.min(1, Math.min(yFrac * 8, (1 - yFrac) * 8)) * 0.55;
        if (fade < 0.02) return;
        const sz = h.sz * W;
        const px = xFrac * W, py = yFrac * H;
        ctx.globalAlpha = fade;
        ctx.fillStyle = `hsl(${h.hue},85%,70%)`;
        ctx.save(); ctx.translate(px, py); ctx.scale(sz / 12, sz / 12);
        ctx.beginPath();
        ctx.moveTo(0, 3); ctx.bezierCurveTo(-6, -3, -12, 0, -12, 6);
        ctx.bezierCurveTo(-12, 12, 0, 18, 0, 18);
        ctx.bezierCurveTo(0, 18, 12, 12, 12, 6);
        ctx.bezierCurveTo(12, 0, 6, -3, 0, 3);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      });
      ctx.globalAlpha = 1; ctx.restore();
    },

    chispas: (ctx, W, H, t) => {
      DATA.sparks2.forEach(s => {
        const pulse = Math.abs(Math.sin(t * s.spd + s.ph));
        if (pulse < 0.3) return;
        const a = (pulse - 0.3) / 0.7;
        const x = s.x * W, y = s.y * H;
        const r = 0.4 + a * 1.8;
        ctx.globalAlpha = a * 0.7;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * W / 500);
        g.addColorStop(0, `hsla(${s.hue},100%,95%,1)`);
        g.addColorStop(0.5, `hsla(${s.hue},100%,70%,0.4)`);
        g.addColorStop(1, 'transparent');
        const rw = r * W / 500;
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rw * 4, 0, 6.28); ctx.fill();
        // Cross spark
        ctx.strokeStyle = `hsl(${s.hue},100%,90%)`; ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x - rw * 5, y); ctx.lineTo(x + rw * 5, y);
        ctx.moveTo(x, y - rw * 3); ctx.lineTo(x, y + rw * 3);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    },

    estrellas: (ctx, W, H, t) => {
      DATA.stars.forEach(s => {
        const tw = 0.3 + 0.7 * Math.abs(Math.sin(t * s.spd * 2.5 + s.ph));
        if (tw < 0.35) return;
        ctx.globalAlpha = s.a * tw * 0.65;
        const hue = (s.ph * 58 + t * 20) % 360;
        ctx.fillStyle = s.a > 0.6 ? '#fff' : `hsl(${hue},90%,85%)`;
        const r = (s.r + tw * 1.2) * W / 2200;
        ctx.beginPath(); ctx.arc(s.x * W, s.y * H, r, 0, 6.28); ctx.fill();
        // Twinkle cross
        if (tw > 0.7) {
          ctx.globalAlpha = s.a * (tw - 0.7) * 0.5;
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.7;
          const cr = r * 3.5;
          ctx.beginPath();
          ctx.moveTo(s.x*W - cr, s.y*H); ctx.lineTo(s.x*W + cr, s.y*H);
          ctx.moveTo(s.x*W, s.y*H - cr); ctx.lineTo(s.x*W, s.y*H + cr);
          ctx.stroke();
        }
      });
      ctx.globalAlpha = 1;
    },

    laser: (ctx, W, H, t) => {
      DATA.laserLines.forEach(l => {
        const y = (l.y + Math.sin(t * 0.4 + l.ph) * 0.06) * H;
        const hue = (l.hue + t * 20) % 360;
        const al = 0.18 + 0.12 * Math.sin(t * 1.2 + l.ph);
        const grad = ctx.createLinearGradient(0, y, W, y);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.2, `hsla(${hue},100%,70%,${al})`);
        grad.addColorStop(0.5, `hsla(${hue},100%,90%,${al * 1.6})`);
        grad.addColorStop(0.8, `hsla(${hue},100%,70%,${al})`);
        grad.addColorStop(1, 'transparent');
        ctx.strokeStyle = grad;
        ctx.lineWidth = (l.thick * W) / 1920;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        // Core bright line
        ctx.lineWidth = ctx.lineWidth * 0.3;
        ctx.strokeStyle = `hsla(${hue},100%,98%,${al * 0.7})`;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      });
    },

    flores: (ctx, W, H, t) => {
      ctx.save();
      DATA.flowers.forEach(f => {
        const yFrac = 1 - ((f.y + t * f.spd) % 1);
        const xFrac = f.x + Math.sin(t * 0.5 + f.ph) * 0.025;
        const fade = Math.min(1, Math.min(yFrac * 8, (1 - yFrac) * 8)) * 0.52;
        if (fade < 0.02) return;
        const sz = f.sz * W;
        const px = xFrac * W, py = yFrac * H;
        const rot = f.rot + t * f.rotSpd;
        ctx.globalAlpha = fade;
        ctx.save(); ctx.translate(px, py); ctx.rotate(rot);
        const hue = (f.hue + t * 8) % 360;
        for (let p2 = 0; p2 < 5; p2++) {
          const ang = (p2 / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.ellipse(Math.cos(ang)*sz*0.38, Math.sin(ang)*sz*0.38, sz*0.34, sz*0.21, ang, 0, Math.PI*2);
          ctx.fillStyle = `hsla(${hue+p2*10},80%,76%,0.7)`; ctx.fill();
        }
        ctx.beginPath(); ctx.arc(0, 0, sz*0.19, 0, Math.PI*2);
        ctx.fillStyle = `hsl(${(hue+180)%360},90%,86%)`; ctx.fill();
        ctx.restore();
      });
      ctx.globalAlpha = 1; ctx.restore();
    },

    confeti_lluvia: (ctx, W, H, t) => {
      DATA.confPieces.forEach(c => {
        const yFrac = (c.y + t * c.spd) % 1;
        const xFrac = c.x + Math.sin(t * 0.6 + c.rot) * c.dx * 8;
        const fade = Math.min(1, Math.min(yFrac * 6, (1 - yFrac) * 6)) * 0.68;
        if (fade < 0.02) return;
        ctx.save(); ctx.translate(xFrac * W, yFrac * H); ctx.rotate(c.rot + t * c.spin);
        ctx.globalAlpha = fade * 0.65;
        ctx.fillStyle = `hsl(${c.hue},90%,68%)`;
        ctx.fillRect(-c.w/2, -c.h/2, c.w, c.h);
        ctx.restore(); ctx.globalAlpha = 1;
      });
    },

    rayos: (ctx, W, H, t) => {
      DATA.lightSeeds.forEach(ls => {
        const phase = (t * 0.65 + ls.off) % ls.interval;
        if (phase > 0.4) return;
        const flash = Math.pow(1 - phase / 0.4, 2);
        ctx.globalAlpha = flash * 0.5;
        let lx = ls.x * W, ly = 0;
        const hue = (t * 28 + ls.x * 360) % 360;
        ctx.strokeStyle = `hsl(${hue},100%,90%)`;
        ctx.lineWidth = Math.max(1, 1.5 * flash * W / 1920);
        ctx.shadowColor = `hsl(${hue},100%,80%)`; ctx.shadowBlur = 16 * flash;
        ctx.beginPath(); ctx.moveTo(lx, ly);
        const segH = H / ls.segs;
        for (let i = 0; i < ls.segs; i++) {
          lx += (sr(i + ls.x * 1000 + Math.floor(t * 0.65 / ls.interval) * 19) - 0.5) * W * 0.14;
          ly += segH;
          ctx.lineTo(clampN(lx, 0, W), ly);
        }
        ctx.stroke(); ctx.shadowBlur = 0;
      });
      ctx.globalAlpha = 1; ctx.lineWidth = 1;
    },

    mariposas: (ctx, W, H, t) => {
      ctx.save();
      DATA.butterflies.forEach(b => {
        const yFrac = 1 - ((b.y + t * b.spd) % 1);
        const xFrac = b.x + Math.sin(t * 0.5 + b.ph) * b.wob * 5;
        const fade = Math.min(1, Math.min(yFrac * 8, (1 - yFrac) * 8)) * 0.55;
        if (fade < 0.02) return;
        const sz = b.sz * W, px = xFrac * W, py = yFrac * H;
        const flutter = Math.abs(Math.sin(t * 8 + b.ph));
        const hue = (b.hue + t * 6) % 360;
        ctx.globalAlpha = fade;
        ctx.save(); ctx.translate(px, py);
        const wingW = sz * (0.3 + flutter * 0.7);
        ctx.fillStyle = `hsla(${hue},85%,72%,0.65)`;
        ctx.beginPath(); ctx.ellipse(-wingW * 0.5, -sz * 0.18, wingW * 0.55, sz * 0.42, -0.4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(wingW * 0.5, -sz * 0.18, wingW * 0.55, sz * 0.42, 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `hsla(${(hue + 40) % 360},80%,60%,0.42)`;
        ctx.beginPath(); ctx.ellipse(-wingW * 0.35, sz * 0.28, wingW * 0.38, sz * 0.32, 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(wingW * 0.35, sz * 0.28, wingW * 0.38, sz * 0.32, -0.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `hsla(${hue},60%,30%,0.7)`;
        ctx.beginPath(); ctx.ellipse(0, 0, sz * 0.06, sz * 0.52, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
      ctx.globalAlpha = 1; ctx.restore();
    },

    hojas: (ctx, W, H, t) => {
      ctx.save();
      DATA.leaves.forEach(l => {
        const yFrac = (l.y + t * l.spd) % 1;
        const xFrac = l.x + Math.sin(t * 0.55 + l.rot) * l.drift * 6;
        const fade = Math.min(1, Math.min(yFrac * 6, (1 - yFrac) * 6)) * 0.6;
        if (fade < 0.02) return;
        const sz = l.sz * W, px = xFrac * W, py = yFrac * H;
        const rot = l.rot + t * l.spin, hue = (l.hue + t * 3) % 360;
        ctx.globalAlpha = fade;
        ctx.save(); ctx.translate(px, py); ctx.rotate(rot);
        ctx.fillStyle = `hsla(${hue},70%,45%,0.7)`;
        ctx.beginPath();
        ctx.moveTo(0, -sz); ctx.bezierCurveTo(sz * 0.7, -sz * 0.5, sz * 0.6, sz * 0.5, 0, sz);
        ctx.bezierCurveTo(-sz * 0.6, sz * 0.5, -sz * 0.7, -sz * 0.5, 0, -sz);
        ctx.fill();
        ctx.strokeStyle = `hsla(${hue},55%,52%,0.4)`; ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(0, -sz); ctx.lineTo(0, sz); ctx.stroke();
        ctx.restore();
      });
      ctx.globalAlpha = 1; ctx.restore();
    },

    gotas: (ctx, W, H, t) => {
      DATA.snow.forEach((s, i) => {
        const y = (s.y + t * s.spd * 1.5) % 1;
        const x = s.x + Math.sin(t * 0.3 + s.ph) * s.drift * 2;
        const fade = Math.min(1, Math.min(y * 10, (1 - y) * 10)) * 0.45;
        if (fade < 0.02) return;
        const r = (s.r + 0.5) * W / 1800;
        ctx.globalAlpha = fade;
        ctx.save(); ctx.translate(x * W, y * H);
        ctx.fillStyle = `rgba(150,210,255,0.6)`;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath(); ctx.ellipse(-r * 0.25, -r * 0.25, r * 0.28, r * 0.18, -0.6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
      ctx.globalAlpha = 1;
    },

    lluvia: (ctx, W, H, t) => {
      ctx.save();
      DATA.rain.forEach(r => {
        const y  = (r.y + t * r.spd) % 1;
        const x  = (r.x + t * 0.015) % 1;
        const fy = Math.min(y * 8, (1 - y) * 8, 1);
        if (fy < 0.02) return;
        ctx.globalAlpha = r.al * fy;
        ctx.strokeStyle = 'rgba(170,210,255,0.85)';
        ctx.lineWidth   = 1;
        const px = x * W, py = y * H, len = r.len * H;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - len * 0.12, py + len); ctx.stroke();
      });
      ctx.globalAlpha = 1; ctx.restore();
    },

    humo: (ctx, W, H, t) => {
      ctx.save();
      DATA.snow.forEach((s) => {
        const y    = 1 - ((s.y + t * s.spd * 0.35) % 1);
        const x    = s.x + Math.sin(t * 0.22 + s.ph) * 0.1;
        const fade = y * (1 - y) * 3;
        if (fade < 0.02) return;
        const r = (s.r + 3) * W / 350;
        ctx.globalAlpha = fade * 0.22;
        ctx.fillStyle   = 'rgba(200,200,200,1)';
        ctx.beginPath(); ctx.arc((x % 1) * W, y * H, r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1; ctx.restore();
    },

    globos: (ctx, W, H, t) => {
      ctx.save();
      DATA.balloons.forEach(b => {
        const y  = 1 - ((b.y + t * b.spd) % 1);
        const x  = b.x + Math.sin(t * 0.5 + b.ph) * b.drift * 4;
        const fy = Math.min(y * 4, (1 - y) * 6, 1);
        if (fy < 0.02) return;
        const sz = b.sz * W;
        const cx = (x % 1) * W, cy = y * H;
        ctx.globalAlpha = 0.78 * fy;
        ctx.save(); ctx.translate(cx, cy);
        const g = ctx.createRadialGradient(-sz * 0.2, -sz * 0.3, sz * 0.05, 0, 0, sz);
        g.addColorStop(0, `hsla(${b.hue},90%,75%,1)`);
        g.addColorStop(0.7, `hsla(${b.hue},80%,55%,1)`);
        g.addColorStop(1, `hsla(${b.hue},70%,38%,0.9)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(0, 0, sz, sz * 1.2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.35 * fy;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath(); ctx.ellipse(-sz * 0.28, -sz * 0.35, sz * 0.22, sz * 0.14, -0.4, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.45 * fy;
        ctx.strokeStyle = `hsla(${b.hue},60%,40%,1)`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, sz * 1.15); ctx.bezierCurveTo(sz * 0.3, sz * 2.2, -sz * 0.2, sz * 3.3, 0, sz * 4.5); ctx.stroke();
        ctx.restore();
      });
      ctx.globalAlpha = 1; ctx.restore();
    },

    diamantes: (ctx, W, H, t) => {
      ctx.save();
      DATA.diamonds.forEach(d => {
        const y   = (d.y + t * d.spd * 0.5) % 1;
        const x   = d.x + Math.sin(t * 0.4 + d.ph) * 0.03;
        const fy  = Math.min(y * 8, (1 - y) * 8, 1);
        if (fy < 0.02) return;
        const sz  = d.sz * W;
        const rot = d.rot + t * d.rotSpd;
        ctx.globalAlpha = 0.72 * fy;
        ctx.save(); ctx.translate((x % 1) * W, y * H); ctx.rotate(rot);
        const gr = ctx.createLinearGradient(-sz, -sz * 0.5, sz, sz * 0.5);
        gr.addColorStop(0, `hsla(${d.hue + 180},90%,88%,1)`);
        gr.addColorStop(0.45, `hsla(${d.hue + 200},100%,97%,1)`);
        gr.addColorStop(1, `hsla(${d.hue + 220},80%,65%,1)`);
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.moveTo(0, -sz); ctx.lineTo(sz * 0.65, 0); ctx.lineTo(0, sz); ctx.lineTo(-sz * 0.65, 0); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = `hsla(${d.hue + 180},80%,90%,0.5)`; ctx.lineWidth = 0.5; ctx.stroke();
        ctx.restore();
      });
      ctx.globalAlpha = 1; ctx.restore();
    },

    meteoritos: (ctx, W, H, t) => {
      ctx.save();
      DATA.meteors.forEach(m => {
        const cyc      = (t + m.off) % m.interval;
        const progress = cyc / 1.6;
        if (progress > 1) return;
        const tailLen = m.len * W;
        const cos = Math.cos(m.ang), sin = Math.sin(m.ang);
        const hx = m.x0 * W + cos * tailLen * progress * 2.2;
        const hy = m.y0 * H + sin * tailLen * progress * 2.2;
        const fade = (1 - progress) * Math.min(progress * 6, 1);
        if (fade < 0.01) return;
        const gr = ctx.createLinearGradient(hx, hy, hx - cos * tailLen, hy - sin * tailLen);
        gr.addColorStop(0, `rgba(255,250,220,${(0.95 * fade).toFixed(2)})`);
        gr.addColorStop(0.35, `rgba(210,190,255,${(0.55 * fade).toFixed(2)})`);
        gr.addColorStop(1, 'rgba(150,130,255,0)');
        ctx.strokeStyle = gr; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx - cos * tailLen, hy - sin * tailLen); ctx.stroke();
        ctx.globalAlpha = fade * 0.9;
        ctx.fillStyle = 'rgba(255,255,240,0.95)';
        ctx.beginPath(); ctx.arc(hx, hy, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      });
      ctx.restore();
    },

    aurora_boreal: (ctx, W, H, t) => {
      ctx.save();
      DATA.laserLines.forEach(ln => {
        const yBase = ln.y * 0.55 + 0.05 + Math.sin(t * 0.35 + ln.ph) * 0.06;
        const hue1  = (ln.hue + t * 10) % 360;
        const thick = (ln.thick + 1) * H * 0.06 + H * 0.035;
        const gr = ctx.createLinearGradient(0, 0, W, 0);
        for (let s = 0; s <= 8; s++) {
          const alpha = (0.12 + 0.10 * Math.sin(s + t * 0.7)) * Math.abs(Math.sin(Math.PI * s / 8 + 0.1));
          gr.addColorStop(s / 8, `hsla(${(hue1 + s * 18) % 360},85%,65%,${alpha.toFixed(2)})`);
        }
        ctx.strokeStyle = gr;
        ctx.lineWidth   = thick;
        ctx.globalAlpha = 0.65;
        ctx.beginPath();
        for (let p = 0; p <= 40; p++) {
          const fx = (p / 40) * W;
          const wy = yBase * H + Math.sin(fx / W * 3 * Math.PI + t * 1.1 + ln.ph) * H * 0.035;
          if (p === 0) ctx.moveTo(fx, wy); else ctx.lineTo(fx, wy);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      });
      ctx.restore();
    },

    piano: (ctx, W, H, t) => {
      ctx.save();
      const keyCount = 12, totalKW = W * 0.68, keyW = totalKW / keyCount;
      const keyH = H * 0.09, kStartX = W * 0.16, kY = H * 0.87;
      for (let k = 0; k < keyCount; k++) {
        const beat = Math.sin(t * 3.8 + k * 1.15 + Math.sin(t * 0.9) * 3.2);
        const on   = beat > 0.72;
        ctx.globalAlpha = on ? 0.52 : 0.16;
        ctx.fillStyle   = on ? `hsl(${(k * 30 + t * 22) % 360},85%,70%)` : 'rgba(255,255,255,0.75)';
        ctx.fillRect(kStartX + k * keyW + 1, kY, keyW - 2, keyH);
        if (on) { ctx.globalAlpha = 0.22; ctx.fillStyle = 'white'; ctx.fillRect(kStartX + k * keyW + 2, kY + 2, keyW - 4, keyH * 0.28); }
      }
      DATA.noteParts.forEach(n => {
        const y    = 1 - ((n.y + t * n.spd) % 1);
        const fade = Math.min(y * 4, (1 - y) * 4, 1) * 0.68;
        if (fade < 0.02) return;
        ctx.globalAlpha = fade;
        const nx = n.x + Math.sin(t * 1.1 + n.ph) * 0.03;
        ctx.save(); ctx.translate(nx * W, y * H);
        ctx.font = `bold ${Math.round(n.sz * W * 0.09)}px serif`;
        ctx.fillStyle = `hsla(${(n.ph * 57 + 225) % 360},85%,75%,1)`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(n.ch, 0, 0); ctx.restore();
      });
      ctx.globalAlpha = 1; ctx.restore();
    },

    scanlines: (ctx, W, H, t) => {
      ctx.save();
      const gap = 4, offset = (t * 50) % gap;
      ctx.fillStyle = 'rgba(0,0,0,0.10)';
      for (let y = offset; y < H; y += gap) ctx.fillRect(0, y, W, 1.5);
      const glitchCyc = t % 5;
      if (glitchCyc < 0.07) {
        const gy = (Math.sin(t * 130) * 0.35 + 0.5) * H;
        ctx.globalAlpha = 0.22;
        ctx.fillStyle   = 'rgba(0,200,255,1)';
        ctx.fillRect(0, gy, W, 2.5);
      }
      ctx.globalAlpha = 1; ctx.restore();
    },
  };

  const OVERLAY_LIST = [
    { id: 'none',          label: 'Ninguno',       emoji: '⬜', cat: 'basico' },
    // Música
    { id: 'notas',         label: 'Notas',         emoji: '🎵', cat: 'musica' },
    { id: 'ondas_neon',    label: 'Ondas Neon',    emoji: '🔊', cat: 'musica' },
    { id: 'piano',         label: 'Piano',         emoji: '🎹', cat: 'musica' },
    // Naturaleza
    { id: 'brasas',        label: 'Brasas',        emoji: '🔥', cat: 'naturaleza' },
    { id: 'nieve',         label: 'Nieve',         emoji: '❄️', cat: 'naturaleza' },
    { id: 'burbujas',      label: 'Burbujas',      emoji: '🫧', cat: 'naturaleza' },
    { id: 'flores',        label: 'Flores',        emoji: '🌸', cat: 'naturaleza' },
    { id: 'hojas',         label: 'Hojas',         emoji: '🍃', cat: 'naturaleza' },
    { id: 'gotas',         label: 'Gotas',         emoji: '💧', cat: 'naturaleza' },
    { id: 'lluvia',        label: 'Lluvia',        emoji: '🌧️', cat: 'naturaleza' },
    { id: 'humo',          label: 'Humo',          emoji: '💨', cat: 'naturaleza' },
    // Festivo
    { id: 'corazones',     label: 'Corazones',     emoji: '💖', cat: 'festivo' },
    { id: 'chispas',       label: 'Chispas',       emoji: '✨', cat: 'festivo' },
    { id: 'confeti_lluvia',label: 'Confeti',       emoji: '🎉', cat: 'festivo' },
    { id: 'mariposas',     label: 'Mariposas',     emoji: '🦋', cat: 'festivo' },
    { id: 'globos',        label: 'Globos',        emoji: '🎈', cat: 'festivo' },
    { id: 'diamantes',     label: 'Diamantes',     emoji: '💎', cat: 'festivo' },
    // Sci-fi
    { id: 'estrellas',     label: 'Estrellas',     emoji: '⭐', cat: 'scifi' },
    { id: 'laser',         label: 'Láser',         emoji: '💡', cat: 'scifi' },
    { id: 'rayos',         label: 'Rayos',         emoji: '⚡', cat: 'scifi' },
    { id: 'meteoritos',    label: 'Meteoritos',    emoji: '☄️', cat: 'scifi' },
    { id: 'aurora_boreal', label: 'Aurora Boreal', emoji: '🌌', cat: 'scifi' },
    // Retro
    { id: 'scanlines',     label: 'Scanlines',     emoji: '📺', cat: 'retro' },
  ];

  const OVERLAY_CATEGORIES = [
    { id: 'basico',     label: 'Sin efecto' },
    { id: 'musica',     label: 'Música' },
    { id: 'naturaleza', label: 'Naturaleza' },
    { id: 'festivo',    label: 'Festivo' },
    { id: 'scifi',      label: 'Sci-fi' },
    { id: 'retro',      label: 'Retro' },
  ];

  /* ── Font list ── */
  const FONT_LIST = [
    { id: 'segoe',      label: 'Por defecto',      family: "'Segoe UI', Arial, sans-serif",                          preview: 'Abc' },
    { id: 'nunito',     label: 'Nunito',            family: "'Nunito', 'Arial Rounded MT Bold', sans-serif",          preview: 'Abc' },
    { id: 'montserrat', label: 'Montserrat',        family: "'Montserrat', Arial, sans-serif",                        preview: 'Abc' },
    { id: 'oswald',     label: 'Oswald',            family: "'Oswald', 'Impact', sans-serif",                         preview: 'Abc' },
    { id: 'bebas',      label: 'Bebas Neue',        family: "'Bebas Neue', 'Impact', sans-serif",                     preview: 'Abc' },
    { id: 'pacifico',   label: 'Pacifico',          family: "'Pacifico', cursive",                                    preview: 'Abc' },
    { id: 'bangers',    label: 'Bangers',            family: "'Bangers', fantasy",                                     preview: 'Abc' },
    { id: 'russo',      label: 'Russo One',         family: "'Russo One', 'Arial Black', sans-serif",                 preview: 'Abc' },
    { id: 'anton',      label: 'Anton',             family: "'Anton', Impact, sans-serif",                            preview: 'Abc' },
    { id: 'raleway',    label: 'Raleway',           family: "'Raleway', sans-serif",                                  preview: 'Abc' },
    { id: 'righteous',  label: 'Righteous',         family: "'Righteous', sans-serif",                                preview: 'Abc' },
    { id: 'audiowide',  label: 'Audiowide',         family: "'Audiowide', 'Courier New', monospace",                  preview: 'Abc' },
    { id: 'cinzel',     label: 'Cinzel',            family: "'Cinzel', Georgia, serif",                               preview: 'Abc' },
    { id: 'dancing',    label: 'Dancing Script',    family: "'Dancing Script', cursive",                              preview: 'Abc' },
    { id: 'caveat',     label: 'Caveat',            family: "'Caveat', cursive",                                      preview: 'Abc' },
    { id: 'marker',     label: 'Permanent Marker',  family: "'Permanent Marker', cursive",                            preview: 'Abc' },
    { id: 'comic',      label: 'Comic Neue',        family: "'Comic Neue', 'Comic Sans MS', cursive",                 preview: 'Abc' },
    { id: 'boogaloo',   label: 'Boogaloo',          family: "'Boogaloo', cursive",                                    preview: 'Abc' },
    { id: 'pressstart', label: 'Press Start 2P',    family: "'Press Start 2P', monospace",                            preview: 'Abc' },
  ];

  /* ── Text effects (applied when drawing active lyric line) ── */
  const TEXT_EFFECTS = {
    none: null,
    neon: (ctx, txt, cx, midY, fsLg, color, GI, t) => {
      const pulse = 0.7 + 0.3 * Math.sin(t * 3.5);
      ctx.shadowColor = color; ctx.shadowBlur = (44 + 20 * pulse) * GI;
      ctx.fillStyle = color; ctx.fillText(txt, cx, midY);
      ctx.shadowBlur = (16 + 8 * pulse) * GI;
      ctx.fillStyle = '#ffffff'; ctx.fillText(txt, cx, midY);
      ctx.shadowBlur = 0;
    },
    fuego_glow: (ctx, txt, cx, midY, fsLg, color, GI) => {
      for (const [sc, bl] of [['#ff1100', 65], ['#ff6600', 38], ['#ffaa00', 20]]) {
        ctx.shadowColor = sc; ctx.shadowBlur = bl * GI;
        ctx.fillStyle = color; ctx.fillText(txt, cx, midY);
      }
      ctx.shadowBlur = 0;
    },
    contorno: (ctx, txt, cx, midY, fsLg, color, GI) => {
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(3, fsLg * 0.07);
      ctx.strokeStyle = 'rgba(0,0,0,0.88)'; ctx.strokeText(txt, cx, midY);
      ctx.lineWidth = Math.max(1.5, fsLg * 0.022);
      ctx.strokeStyle = color; ctx.strokeText(txt, cx, midY);
      ctx.fillStyle = color; ctx.fillText(txt, cx, midY);
      ctx.lineWidth = 1;
    },
    latido: (ctx, txt, cx, midY, fsLg, color, GI, t) => {
      const beat = Math.pow(Math.max(0, Math.sin(t * 5.2 - 0.3)), 4);
      const sc = 1 + beat * 0.13;
      ctx.save();
      ctx.translate(cx, midY); ctx.scale(sc, sc); ctx.translate(-cx, -midY);
      ctx.shadowColor = color; ctx.shadowBlur = (22 + beat * 42) * GI;
      ctx.fillStyle = color; ctx.fillText(txt, cx, midY);
      ctx.restore(); ctx.shadowBlur = 0;
    },
    arcoiris: (ctx, txt, cx, midY, fsLg, color, GI, t) => {
      const txtW = ctx.measureText(txt).width;
      const grad = ctx.createLinearGradient(cx - txtW/2, 0, cx + txtW/2, 0);
      for (let i = 0; i <= 6; i++) grad.addColorStop(i/6, `hsl(${(i/6*360 + t*40)%360},100%,72%)`);
      ctx.shadowColor = 'rgba(255,255,255,0.45)'; ctx.shadowBlur = 14 * GI;
      ctx.fillStyle = grad; ctx.fillText(txt, cx, midY);
      ctx.shadowBlur = 0;
    },
    cromatico: (ctx, txt, cx, midY, fsLg, color, GI) => {
      const off = Math.max(2, fsLg * 0.04);
      ctx.globalAlpha = 0.55; ctx.fillStyle = '#ff2200'; ctx.fillText(txt, cx - off, midY);
      ctx.fillStyle = '#00ffee'; ctx.fillText(txt, cx + off, midY);
      ctx.globalAlpha = 1; ctx.shadowColor = color; ctx.shadowBlur = 10 * GI;
      ctx.fillStyle = color; ctx.fillText(txt, cx, midY); ctx.shadowBlur = 0;
    },
    sombra_ring: (ctx, txt, cx, midY, fsLg, color, GI, t) => {
      const rings = [[0,'#ff0080'],[1.57,'#00ffee'],[3.14,'#ffcc00'],[4.71,'#00ff80']];
      rings.forEach(([ph, col]) => {
        const angle = t * 1.6 + ph, d = fsLg * 0.06;
        ctx.shadowColor = col; ctx.shadowBlur = 20 * GI;
        ctx.fillStyle = col; ctx.globalAlpha = 0.32;
        ctx.fillText(txt, cx + Math.cos(angle)*d, midY + Math.sin(angle)*d);
      });
      ctx.globalAlpha = 1;
      ctx.shadowColor = color; ctx.shadowBlur = 10 * GI;
      ctx.fillStyle = color; ctx.fillText(txt, cx, midY); ctx.shadowBlur = 0;
    },

    // ── Aparición progresiva ──
    aparecer: (ctx, txt, cx, midY, fsLg, color, GI, t, lineAge) => {
      const a = Math.min(1, (lineAge || 0) / 0.45);
      ctx.save(); ctx.globalAlpha = a;
      ctx.shadowColor = color; ctx.shadowBlur = 28 * GI;
      ctx.fillStyle = color; ctx.fillText(txt, cx, midY);
      ctx.restore(); ctx.shadowBlur = 0;
    },

    subir: (ctx, txt, cx, midY, fsLg, color, GI, t, lineAge) => {
      const prog = Math.min(1, (lineAge || 0) / 0.5);
      const eased = 1 - Math.pow(1 - prog, 2.5);
      const offY   = (1 - eased) * fsLg * 0.45;
      ctx.save(); ctx.globalAlpha = prog;
      ctx.shadowColor = color; ctx.shadowBlur = 28 * GI;
      ctx.fillStyle = color; ctx.fillText(txt, cx, midY + offY);
      ctx.restore(); ctx.shadowBlur = 0;
    },

    typing: (ctx, txt, cx, midY, fsLg, color, GI, t, lineAge) => {
      const chars = Math.floor((lineAge || 0) / 0.055);
      const visible = txt.slice(0, Math.max(0, chars));
      const fullW   = ctx.measureText(txt).width;
      const startX  = cx - fullW / 2;
      ctx.save(); ctx.textAlign = 'left';
      ctx.shadowColor = color; ctx.shadowBlur = 28 * GI;
      ctx.fillStyle = color; ctx.fillText(visible, startX, midY);
      // Blinking cursor
      if (chars < txt.length && Math.floor((lineAge || 0) / 0.45) % 2 === 0) {
        const w = ctx.measureText(visible).width;
        ctx.shadowBlur = 0; ctx.fillRect(startX + w + 2, midY - fsLg * 0.5, 2, fsLg * 0.88);
      }
      ctx.restore(); ctx.shadowBlur = 0;
    },

    vibrar: (ctx, txt, cx, midY, fsLg, color, GI, t) => {
      const amp = fsLg * 0.018;
      const ox = Math.sin(t * 43) * amp, oy = Math.cos(t * 37) * amp * 0.7;
      ctx.shadowColor = color; ctx.shadowBlur = 28 * GI;
      ctx.fillStyle = color; ctx.fillText(txt, cx + ox, midY + oy); ctx.shadowBlur = 0;
    },
  };

  const TEXT_EFFECT_LIST = [
    { id: 'none',        label: 'Ninguno',   emoji: '⬜' },
    { id: 'neon',        label: 'Neón',      emoji: '⚡' },
    { id: 'fuego_glow',  label: 'Fuego',     emoji: '🔥' },
    { id: 'contorno',    label: 'Contorno',  emoji: '✏️' },
    { id: 'latido',      label: 'Latido',    emoji: '💗' },
    { id: 'arcoiris',    label: 'Arco iris', emoji: '🌈' },
    { id: 'cromatico',   label: 'Cromático', emoji: '🔮' },
    { id: 'sombra_ring', label: 'Anillo',    emoji: '🔵' },
    { id: 'aparecer',    label: 'Aparecer',  emoji: '🌟' },
    { id: 'subir',       label: 'Subir',     emoji: '⬆️' },
    { id: 'typing',      label: 'Máquina',   emoji: '⌨️' },
    { id: 'vibrar',      label: 'Vibrar',    emoji: '📣' },
  ];

  /* ── Fill / karaoke reveal styles ── */
  const FILL_EFFECT_LIST = [
    { id: 'default',      label: 'Estándar',      emoji: '▶️' },
    { id: 'glow_edge',    label: 'Filo brillante', emoji: '✨' },
    { id: 'gradiente',    label: 'Degradado',      emoji: '🌈' },
    { id: 'palabra',      label: 'Por palabra',    emoji: '💬' },
    { id: 'metalico',     label: 'Metálico',      emoji: '🔨' },
    { id: 'rayas',        label: 'Rayas',          emoji: '📄' },
    { id: 'ondulado',     label: 'Ondulado',       emoji: '🌊' },
    { id: 'arcoiris_fill',label: 'Arcoíris',      emoji: '🌈' },
    { id: 'pulso_neon',   label: 'Pulso neón',    emoji: '💥' },
  ];

  /* ── Progress bar styles ── */
  const PROGRESS_BAR_LIST = [
    { id: 'bottom',        label: 'Barra abajo',       emoji: '⬇️' },
    { id: 'top',           label: 'Barra arriba',      emoji: '⬆️' },
    { id: 'left',          label: 'Vertical izq.',     emoji: '◀' },
    { id: 'right',         label: 'Vertical der.',     emoji: '▶' },
    { id: 'clock_analog',  label: 'Reloj analógico',   emoji: '🕐' },
    { id: 'clock_digital', label: 'Reloj digital',     emoji: '🔢' },
    { id: 'countdown',     label: 'Cuenta atrás',      emoji: '⏱' },
    { id: 'battery',       label: 'Batería',           emoji: '🔋' },
    { id: 'dots',          label: 'Puntos',            emoji: '⚬' },
    { id: 'wave',          label: 'Onda',              emoji: '〰' },
    { id: 'neon_slim',     label: 'Neón fino',         emoji: '💡' },
  ];

  function _drawProgress(ctx, W, H, time, duration, style, T, fsSm, barThickFactor = 1.0, timeSizeFactor = 1.0) {
    const pPct = duration > 0 ? clampN(time / duration, 0, 1) : 0;
    const timeStr = `${formatTime(time)}  /  ${formatTime(duration)}`;
    if (timeSizeFactor !== 1.0) fsSm = Math.round(fsSm * timeSizeFactor);

    if (style === 'bottom' || style === 'top') {
      const pbH = Math.max(4, Math.round(H * 0.009 * barThickFactor));
      const pbY = style === 'top' ? 14 : H - pbH - 20;
      const bx = 28, bw = W - 56;
      // Shadow under track
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 12;
      ctx.fillStyle = T.progressBg; ctx.beginPath(); ctx.roundRect(bx, pbY, bw, pbH, pbH / 2); ctx.fill();
      ctx.shadowBlur = 0; ctx.restore();
      if (pPct > 0) {
        const pg = ctx.createLinearGradient(bx, 0, bx + bw, 0);
        pg.addColorStop(0, T.progressFg); pg.addColorStop(0.8, T.progressFg); pg.addColorStop(1, '#ffffff88');
        ctx.save(); ctx.shadowColor = T.progressFg; ctx.shadowBlur = 14;
        ctx.fillStyle = pg; ctx.beginPath(); ctx.roundRect(bx, pbY, bw * pPct, pbH, pbH / 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.restore();
        // Glowing dot at fill endpoint
        const ex = bx + bw * pPct, ey = pbY + pbH / 2;
        ctx.save(); ctx.shadowColor = T.progressFg; ctx.shadowBlur = 22;
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex, ey, pbH * 0.75, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.restore();
      }
      // Frosted time label
      ctx.font = `400 ${fsSm}px monospace`;
      const tw = ctx.measureText(timeStr).width;
      const lx = W - 30, ly = style === 'top' ? pbY + pbH + fsSm + 6 : pbY - 9;
      ctx.save(); ctx.globalAlpha *= 0.45; ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.roundRect(lx - tw - 12, ly - fsSm - 2, tw + 14, fsSm + 6, 4); ctx.fill();
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(timeStr, lx, ly);

    } else if (style === 'left' || style === 'right') {
      const pbW = Math.max(4, Math.round(W * 0.009 * barThickFactor));
      const pbX = style === 'left' ? 14 : W - 14 - pbW;
      const barH = H - 60, barY = 30;
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 10;
      ctx.fillStyle = T.progressBg; ctx.beginPath(); ctx.roundRect(pbX, barY, pbW, barH, pbW / 2); ctx.fill();
      ctx.shadowBlur = 0; ctx.restore();
      if (pPct > 0) {
        const fillH = barH * pPct;
        const pg = ctx.createLinearGradient(0, barY + barH, 0, barY);
        pg.addColorStop(0, T.progressFg); pg.addColorStop(0.8, T.progressFg); pg.addColorStop(1, '#ffffff88');
        ctx.save(); ctx.shadowColor = T.progressFg; ctx.shadowBlur = 12;
        ctx.fillStyle = pg; ctx.beginPath(); ctx.roundRect(pbX, barY + barH - fillH, pbW, fillH, pbW / 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.restore();
        // Glowing dot at top of fill
        const dotY = barY + barH - fillH;
        ctx.save(); ctx.shadowColor = T.progressFg; ctx.shadowBlur = 20;
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(pbX + pbW / 2, dotY, pbW * 0.75, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.restore();
      }
      const labelX = style === 'left' ? pbX + pbW + 8 : pbX - 8;
      ctx.save();
      ctx.translate(labelX, barY + barH / 2);
      ctx.rotate(style === 'left' ? -Math.PI / 2 : Math.PI / 2);
      ctx.font = `400 ${Math.round(fsSm * 0.8)}px monospace`; ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(timeStr, 0, 0);
      ctx.restore();

    } else if (style === 'clock_digital') {
      const fs2 = Math.max(20, Math.round(fsSm * 1.4));
      ctx.font = `bold ${fs2}px monospace`;
      const elapsed = formatTime(time), total = formatTime(duration);
      const tw1 = ctx.measureText(elapsed).width, tw2 = ctx.measureText(` / ${total}`).width;
      const tw = tw1 + tw2, padX = fs2 * 0.65, padY = fs2 * 0.5;
      const bx = W - 24, by = H - 24;
      const boxW = tw + padX * 2, boxH = fs2 + padY * 2;
      // Glass backdrop
      ctx.save(); ctx.globalAlpha *= 0.7; ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.beginPath(); ctx.roundRect(bx - boxW, by - boxH, boxW, boxH, 10); ctx.fill(); ctx.restore();
      // Gradient top highlight
      const hi = ctx.createLinearGradient(bx - boxW, by - boxH, bx - boxW, by - boxH + boxH * 0.5);
      hi.addColorStop(0, 'rgba(255,255,255,0.09)'); hi.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.save(); ctx.globalAlpha *= 0.6; ctx.fillStyle = hi;
      ctx.beginPath(); ctx.roundRect(bx - boxW, by - boxH, boxW, boxH * 0.5, [10, 10, 0, 0]); ctx.fill(); ctx.restore();
      // Border glow
      ctx.save(); ctx.shadowColor = T.progressFg; ctx.shadowBlur = 12;
      ctx.strokeStyle = T.progressFg; ctx.lineWidth = 1.5; ctx.globalAlpha *= 0.6;
      ctx.beginPath(); ctx.roundRect(bx - boxW, by - boxH, boxW, boxH, 10); ctx.stroke();
      ctx.shadowBlur = 0; ctx.restore();
      // Progress strip at bottom of panel
      if (pPct > 0) {
        ctx.save(); ctx.shadowColor = T.progressFg; ctx.shadowBlur = 8;
        const pg = ctx.createLinearGradient(bx - boxW, 0, bx, 0);
        pg.addColorStop(0, T.progressFg); pg.addColorStop(1, T.progressFg);
        ctx.fillStyle = pg; ctx.beginPath();
        ctx.roundRect(bx - boxW + 2, by - 6, (boxW - 4) * pPct, 3, 1.5); ctx.fill();
        ctx.shadowBlur = 0; ctx.restore();
      }
      // Text
      const ty = by - padY;
      ctx.save(); ctx.shadowColor = T.progressFg; ctx.shadowBlur = 10;
      ctx.fillStyle = T.progressFg; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(elapsed, bx - tw2 - padX * 0.6, ty); ctx.shadowBlur = 0; ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(` / ${total}`, bx - padX * 0.6, ty);

    } else if (style === 'clock_analog') {
      const r = Math.round(Math.min(W, H) * 0.068);
      const ocx = W - r - 22, ocy = H - r - 22;
      const pAngle = pPct * Math.PI * 2 - Math.PI / 2;
      // Backdrop circle
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(ocx, ocy, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.68)'; ctx.fill(); ctx.shadowBlur = 0; ctx.restore();
      // Outer ring
      ctx.save(); ctx.shadowColor = T.progressFg; ctx.shadowBlur = 10; ctx.globalAlpha *= 0.8;
      ctx.strokeStyle = T.progressFg; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(ocx, ocy, r, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0; ctx.restore();
      // Tick marks
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const isMaj = i % 3 === 0;
        ctx.strokeStyle = isMaj ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.22)';
        ctx.lineWidth = isMaj ? 2 : 1;
        ctx.beginPath(); ctx.moveTo(ocx + Math.cos(a) * r * 0.78, ocy + Math.sin(a) * r * 0.78);
        ctx.lineTo(ocx + Math.cos(a) * r * 0.94, ocy + Math.sin(a) * r * 0.94); ctx.stroke();
      }
      ctx.lineWidth = 1;
      // Filled arc (progress sector)
      if (pPct > 0) {
        ctx.save(); ctx.globalAlpha *= 0.25;
        ctx.beginPath(); ctx.moveTo(ocx, ocy); ctx.arc(ocx, ocy, r * 0.88, -Math.PI / 2, pAngle); ctx.closePath();
        ctx.fillStyle = T.progressFg; ctx.fill(); ctx.restore();
        // Arc ring on top
        ctx.save(); ctx.shadowColor = T.progressFg; ctx.shadowBlur = 12;
        ctx.strokeStyle = T.progressFg; ctx.lineWidth = Math.max(3, r * 0.1); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(ocx, ocy, r * 0.72, -Math.PI / 2, pAngle); ctx.stroke();
        ctx.shadowBlur = 0; ctx.lineCap = 'butt'; ctx.restore();
      }
      // Center dot + hand
      const handLen = r * 0.54;
      ctx.save(); ctx.shadowColor = T.progressFg; ctx.shadowBlur = 14;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(2, r * 0.07); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ocx, ocy); ctx.lineTo(ocx + Math.cos(pAngle) * handLen, ocy + Math.sin(pAngle) * handLen); ctx.stroke();
      ctx.shadowBlur = 0; ctx.lineCap = 'butt'; ctx.restore();
      ctx.beginPath(); ctx.arc(ocx, ocy, Math.max(3, r * 0.09), 0, Math.PI * 2); ctx.fillStyle = T.progressFg; ctx.fill();
      // Time label
      ctx.font = `300 ${Math.round(fsSm * 0.76)}px monospace`; ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(formatTime(time), ocx, ocy + r + 7);
      ctx.textBaseline = 'alphabetic';

    } else if (style === 'countdown') {
      const r = Math.round(Math.min(W, H) * 0.068);
      const ocx = W - r - 22, ocy = H - r - 22;
      const remaining = Math.max(0, duration - time);
      const endA = -Math.PI / 2 + (1 - pPct) * Math.PI * 2;
      // Backdrop
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(ocx, ocy, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.68)'; ctx.fill(); ctx.shadowBlur = 0; ctx.restore();
      // Outer thin glow ring
      ctx.save(); ctx.globalAlpha *= 0.35; ctx.shadowColor = T.progressFg; ctx.shadowBlur = 18;
      ctx.strokeStyle = T.progressFg; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(ocx, ocy, r - 1, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0; ctx.restore();
      // Track ring
      const ringR = r * 0.8, ringW = Math.max(5, r * 0.19);
      ctx.strokeStyle = T.progressBg; ctx.lineWidth = ringW;
      ctx.beginPath(); ctx.arc(ocx, ocy, ringR, 0, Math.PI * 2); ctx.stroke();
      // Fill ring (countdown = remaining portion)
      if (1 - pPct > 0.002) {
        const urgency = 1 - (1 - pPct);  // pPct goes 0→1 so remaining goes 1→0
        const fillColor = urgency < 0.25 ? '#ff3300' : urgency < 0.5 ? '#ffcc00' : T.progressFg;
        ctx.save(); ctx.shadowColor = fillColor; ctx.shadowBlur = 14;
        ctx.strokeStyle = fillColor; ctx.lineWidth = ringW; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(ocx, ocy, ringR, -Math.PI / 2, endA); ctx.stroke();
        ctx.shadowBlur = 0; ctx.lineCap = 'butt'; ctx.restore();
      }
      ctx.lineWidth = 1;
      // Center time text
      ctx.save(); ctx.shadowColor = T.progressFg; ctx.shadowBlur = 12;
      ctx.font = `bold ${Math.round(r * 0.5)}px monospace`; ctx.fillStyle = '#fff';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(formatTime(remaining), ocx, ocy);
      ctx.shadowBlur = 0; ctx.restore(); ctx.textBaseline = 'alphabetic';

    } else if (style === 'battery') {
      const bw = Math.round(W * 0.11), bh = Math.round(bw * 0.46);
      const bx = W - bw - 28, by = H - bh - 26;
      const tipW = Math.round(bw * 0.05), tipH = Math.round(bh * 0.44);
      const remaining = 1 - pPct;
      const fillColor = remaining > 0.5 ? T.progressFg : remaining > 0.25 ? '#ffcc00' : '#ff3300';
      // Body shadow
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 12;
      ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 4); ctx.stroke(); ctx.shadowBlur = 0; ctx.restore();
      // Tip
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.beginPath(); ctx.roundRect(bx + bw + 2, by + (bh - tipH) / 2, tipW, tipH, 2); ctx.fill();
      // Fill
      if (remaining > 0.01) {
        const fillW = Math.max(2, (bw - 8) * remaining);
        const pg = ctx.createLinearGradient(bx + 4, 0, bx + 4 + fillW, 0);
        pg.addColorStop(0, fillColor); pg.addColorStop(1, remaining < 0.5 ? fillColor : T.progressFg);
        ctx.save(); ctx.shadowColor = fillColor; ctx.shadowBlur = 10;
        ctx.fillStyle = pg; ctx.beginPath(); ctx.roundRect(bx + 4, by + 4, fillW, bh - 8, 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.restore();
      }
      // Percentage text
      ctx.font = `600 ${Math.round(fsSm * 0.85)}px monospace`;
      ctx.fillStyle = remaining < 0.3 ? '#fff' : 'rgba(255,255,255,0.55)';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(`${Math.round(remaining * 100)}%`, bx + bw / 2 + tipW / 2, by + bh + 7);
      ctx.textBaseline = 'alphabetic';

    } else if (style === 'dots') {
      const ndots = 24;
      const filled = Math.round(pPct * ndots);
      const dotR = Math.max(5, Math.round(H * 0.008));
      const sp = dotR * 2.8;
      const totalW = (ndots - 1) * sp;
      const sx = W / 2 - totalW / 2, dotY = H - dotR - 20;
      for (let i = 0; i < ndots; i++) {
        const dx = sx + i * sp;
        const isActive = i < filled;
        const isNext = i === filled;
        const r2 = isActive ? dotR : isNext ? dotR * 0.7 : dotR * 0.5;
        ctx.beginPath(); ctx.arc(dx, dotY, r2, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? T.progressFg : T.progressBg;
        if (isActive) { ctx.shadowColor = T.progressFg; ctx.shadowBlur = i === filled - 1 ? 14 : 6; }
        ctx.fill(); ctx.shadowBlur = 0;
      }
      ctx.font = `300 ${fsSm}px monospace`; ctx.fillStyle = 'rgba(255,255,255,0.42)';
      ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(timeStr, W - 28, dotY - dotR - 5);

    } else if (style === 'wave') {
      const barY = H - 30;
      const amplitude = Math.max(4, Math.round(H * 0.007));
      const fillW = (W - 56) * pPct;
      // Background wave (dim)
      ctx.save(); ctx.globalAlpha *= 0.35;
      ctx.strokeStyle = T.progressBg; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let x = 28; x <= W - 28; x += 3) {
        const y = barY + Math.sin((x / 60) * Math.PI * 2 - time * 4) * amplitude * 0.6;
        x === 28 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke(); ctx.restore();
      // Filled wave
      if (fillW > 2) {
        ctx.save(); ctx.beginPath(); ctx.rect(28, barY - amplitude * 3, fillW, amplitude * 6); ctx.clip();
        ctx.shadowColor = T.progressFg; ctx.shadowBlur = 14; ctx.strokeStyle = T.progressFg; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath();
        for (let x = 28; x <= W - 28; x += 3) {
          const y = barY + Math.sin((x / 60) * Math.PI * 2 - time * 4) * amplitude;
          x === 28 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        // Second layer offset
        ctx.globalAlpha *= 0.4; ctx.strokeStyle = T.progressFg; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 28; x <= W - 28; x += 3) {
          const y = barY + Math.sin((x / 45) * Math.PI * 2 - time * 5.5 + 1.2) * amplitude * 0.7;
          x === 28 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke(); ctx.shadowBlur = 0; ctx.lineCap = 'butt'; ctx.restore();
      }
      ctx.font = `300 ${fsSm}px monospace`; ctx.fillStyle = 'rgba(255,255,255,0.42)';
      ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(timeStr, W - 28, barY - amplitude * 3 - 5);

    } else if (style === 'neon_slim') {
      const lineY = H - 5;
      // Background glow spread
      ctx.save(); ctx.globalAlpha *= 0.15; ctx.strokeStyle = T.progressFg; ctx.lineWidth = 10; ctx.lineCap = 'square';
      ctx.beginPath(); ctx.moveTo(0, lineY); ctx.lineTo(W * pPct, lineY); ctx.stroke(); ctx.restore();
      // Track
      ctx.strokeStyle = T.progressBg; ctx.lineWidth = 2; ctx.lineCap = 'square';
      ctx.beginPath(); ctx.moveTo(0, lineY); ctx.lineTo(W, lineY); ctx.stroke();
      // Fill
      if (pPct > 0) {
        ctx.save(); ctx.shadowColor = T.progressFg; ctx.shadowBlur = 20;
        ctx.strokeStyle = T.progressFg; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, lineY); ctx.lineTo(W * pPct, lineY); ctx.stroke();
        // Inner bright line
        ctx.shadowColor = '#fff'; ctx.shadowBlur = 8; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, lineY); ctx.lineTo(W * pPct, lineY); ctx.stroke();
        ctx.shadowBlur = 0; ctx.restore();
      }
      ctx.lineCap = 'butt';
      ctx.font = `300 ${fsSm}px monospace`; ctx.fillStyle = 'rgba(255,255,255,0.42)';
      ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(timeStr, W - 28, lineY - 12);
    }
  }

  /* ─── Intro title card renderer ───────────────────────── */
  function drawIntroFrame(ctx, W, H, opts, introConfig) {
    const {
      theme = 'classic', animation = 'none', fontSize = 56,
      fontFamily = "'Segoe UI', sans-serif",
      showProgressBar = true, progressBarStyle = 'bottom',
      progressBarOpacity = 1, progressColorOverride = null,
      progressBarThickness = 1.0, progressTimeSize = 1.0,
      overlayEffect = 'none', duration = 1, time = 0,
      _bgTime = null,          // real song time for background/animation continuity
      _progressTime = null,    // real song time for progress bar
      _progressDuration = null,// real song duration for progress bar
    } = opts;
    const bgT = _bgTime !== null ? _bgTime : time;       // use for animations & style backgrounds
    const progT = _progressTime !== null ? _progressTime : time;
    const progDur = _progressDuration !== null ? _progressDuration : duration;
    const {
      title = '', artist = '', style = 'bold', transition = 'fade',
      transitionOut = null, useSameTransOut = true,
      titleColor = '#ffffff', artistColor = '#c0a0ff',
      titleSize = 1.0, artistRatio = 0.45,
      showLogo = true, duration: introDur = 4,
      titleFont = '', artistFont = '',
      titleGlow = 1.0, artistGlow = 0.6,
      titleShadowColor = '#000000', titleShadowBlur = 0,
      titleShadowOffsetX = 0, titleShadowOffsetY = 2,
      artistShadowColor = '#000000', artistShadowBlur = 0,
      artistShadowOffsetX = 0, artistShadowOffsetY = 2,
    } = introConfig;
    const T = THEMES[theme] || THEMES.classic;
    const exitTrans = (useSameTransOut || !transitionOut) ? transition : transitionOut;

    // ── 1. Theme background + animations ──
    _drawBg(ctx, W, H, T);
    ctx.save(); (ANIMATIONS[animation] || ANIMATIONS.none)(ctx, W, H, bgT); ctx.restore();

    // ── 2. Style-specific background overlays ──
    if (style === 'clasico') {
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, H);
      const vign = ctx.createRadialGradient(W/2, H/2, H*0.3, W/2, H/2, H*0.8);
      vign.addColorStop(0, 'rgba(0,0,0,0)'); vign.addColorStop(1, 'rgba(0,0,0,0.4)');
      ctx.fillStyle = vign; ctx.fillRect(0, 0, W, H);

    } else if (style === 'gamer') {
      ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalAlpha = 0.08; ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 1;
      const gridSize = Math.max(40, W / 30);
      for (let gx = 0; gx < W; gx += gridSize) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
      for (let gy = 0; gy < H; gy += gridSize) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
      ctx.restore();
      [[0,0], [W,0], [0,H], [W,H]].forEach(([cx_,cy_],i) => {
        const hue = (i * 85 + time * 40) % 360;
        const grd = ctx.createRadialGradient(cx_, cy_, 0, cx_, cy_, W*0.35);
        grd.addColorStop(0, `hsla(${hue},100%,60%,0.12)`); grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
      });

    } else if (style === 'metal') {
      ctx.fillStyle = 'rgba(4,4,6,0.95)'; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalAlpha = 0.04; ctx.fillStyle = '#fff';
      for (let i = 0; i < 90; i++) {
        ctx.fillRect(Math.random()*W, Math.random()*H, Math.random()*3+1, Math.random()*2+1);
      }
      ctx.restore();
      const flameGrd = ctx.createLinearGradient(0, H*0.75, 0, H);
      flameGrd.addColorStop(0, 'rgba(180,20,0,0)'); flameGrd.addColorStop(1, 'rgba(80,10,0,0.15)');
      ctx.fillStyle = flameGrd; ctx.fillRect(0, 0, W, H);

    } else if (style === 'fotografia') {
      ctx.fillStyle = 'rgba(240,240,240,0.15)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H);
      const bracketSize = Math.min(W, H) * 0.045, pad = Math.max(20, W * 0.02);
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.lineCap = 'square';
      [[pad,pad,1,1], [W-pad,pad,-1,1], [pad,H-pad,1,-1], [W-pad,H-pad,-1,-1]].forEach(([x,y,dx,dy]) => {
        ctx.beginPath(); ctx.moveTo(x, y+dy*bracketSize); ctx.lineTo(x, y); ctx.lineTo(x+dx*bracketSize, y); ctx.stroke();
      });
      ctx.restore();

    } else if (style === 'espacial') {
      const spaceGrd = ctx.createRadialGradient(W*0.3, H*0.2, 0, W/2, H/2, H*0.9);
      spaceGrd.addColorStop(0, 'rgba(20,10,40,0.7)'); spaceGrd.addColorStop(1, 'rgba(0,0,5,0.95)');
      ctx.fillStyle = spaceGrd; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 3;
      for (let s = 0; s < 120; s++) {
        const sx = (s * 97.3 + time * 8) % W, sy = (s * 73.7 + time * 5) % H;
        const sr = (s % 3) * 0.4 + 0.8;
        ctx.globalAlpha = 0.3 + (s % 5) * 0.15;
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI*2); ctx.fill();
      }
      ctx.restore();

    } else if (style === 'teatro') {
      // Telón de teatro con pliegues realistas
      const curtainGrd = ctx.createLinearGradient(0, 0, 0, H);
      curtainGrd.addColorStop(0, 'rgba(80,5,5,0.9)');
      curtainGrd.addColorStop(0.5, 'rgba(100,10,10,0.92)');
      curtainGrd.addColorStop(1, 'rgba(40,0,0,0.95)');
      ctx.fillStyle = curtainGrd; ctx.fillRect(0, 0, W, H);
      // Pliegues del telón
      ctx.save();
      const foldCount = 18;
      const foldWidth = W / foldCount;
      for (let f = 0; f < foldCount; f++) {
        const fx = f * foldWidth;
        const foldPhase = Math.sin(time * 0.3 + f * 0.5) * 0.5 + 0.5;
        // Sombra del pliegue
        const shadowG = ctx.createLinearGradient(fx, 0, fx + foldWidth, 0);
        shadowG.addColorStop(0, 'rgba(0,0,0,0.4)');
        shadowG.addColorStop(0.5, 'rgba(0,0,0,0)');
        shadowG.addColorStop(1, 'rgba(255,255,255,0.08)');
        ctx.fillStyle = shadowG;
        ctx.fillRect(fx, 0, foldWidth, H);
      }
      // Textura de terciopelo (líneas horizontales sutiles)
      ctx.globalAlpha = 0.08;
      for (let y = 0; y < H; y += 3) {
        ctx.fillStyle = y % 6 === 0 ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
        ctx.fillRect(0, y, W, 1);
      }
      // Borlas doradas en la parte superior
      ctx.globalAlpha = 0.4;
      for (let b = 0; b < 8; b++) {
        const bx = W * (b / 7);
        const by = H * 0.08 + Math.sin(time * 2 + b) * 15;
        const tassleG = ctx.createRadialGradient(bx, by, 0, bx, by, 20);
        tassleG.addColorStop(0, 'rgba(255,215,0,0.8)');
        tassleG.addColorStop(1, 'rgba(180,140,0,0)');
        ctx.fillStyle = tassleG;
        ctx.beginPath(); ctx.arc(bx, by, 20, 0, Math.PI * 2); ctx.fill();
        // Cuerda de la borla
        ctx.strokeStyle = 'rgba(255,215,0,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx, 0);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }
      ctx.restore();

    } else if (style === 'escenario') {
      ctx.fillStyle = 'rgba(0,0,0,0.92)'; ctx.fillRect(0, 0, W, H);
      // Spotlight principal mejorado - cono de luz definido
      const spotCenterX = W * 0.5, spotCenterY = H * 0.15;
      const spotRadius = Math.min(W, H) * 0.45;
      // Haz de luz con bordes definidos
      ctx.save();
      ctx.globalAlpha = 0.25;
      const beamG = ctx.createRadialGradient(spotCenterX, spotCenterY, spotRadius * 0.05,
                                             spotCenterX, spotCenterY + spotRadius * 0.7, spotRadius);
      beamG.addColorStop(0, 'rgba(255,250,220,0.5)');
      beamG.addColorStop(0.3, 'rgba(255,240,180,0.3)');
      beamG.addColorStop(0.7, 'rgba(200,180,120,0.08)');
      beamG.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = beamG;
      ctx.beginPath();
      ctx.moveTo(spotCenterX - spotRadius * 0.15, spotCenterY);
      ctx.lineTo(spotCenterX - spotRadius * 0.85, spotCenterY + spotRadius * 1.2);
      ctx.lineTo(spotCenterX + spotRadius * 0.85, spotCenterY + spotRadius * 1.2);
      ctx.lineTo(spotCenterX + spotRadius * 0.15, spotCenterY);
      ctx.closePath();
      ctx.fill();
      // Partículas de polvo en el haz de luz
      ctx.globalAlpha = 0.15;
      for (let dust = 0; dust < 25; dust++) {
        const dx = spotCenterX + (sr(dust * 7) - 0.5) * spotRadius * 1.2;
        const dy = spotCenterY + sr(dust * 11) * spotRadius * 1.3;
        const dSize = 1 + sr(dust * 13) * 2;
        const dAlpha = (0.3 + Math.sin(time * 2 + dust) * 0.7) * 0.5;
        ctx.globalAlpha = dAlpha;
        ctx.fillStyle = '#ffffcc';
        ctx.beginPath(); ctx.arc(dx, dy, dSize, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      // Luces secundarias (spots laterales)
      const sideLights = [{x:0.15, y:0.25}, {x:0.85, y:0.25}];
      sideLights.forEach((light, i) => {
        ctx.save();
        ctx.globalAlpha = 0.12;
        const sideG = ctx.createRadialGradient(light.x * W, light.y * H, 10,
                                               light.x * W, light.y * H + H * 0.4, H * 0.35);
        sideG.addColorStop(0, 'rgba(180,200,255,0.3)');
        sideG.addColorStop(0.6, 'rgba(100,140,200,0.08)');
        sideG.addColorStop(1, 'transparent');
        ctx.fillStyle = sideG;
        ctx.beginPath();
        ctx.arc(light.x * W, light.y * H + H * 0.4, H * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      // Piso del escenario con reflejo
      const floorGrd = ctx.createLinearGradient(0, H*0.75, 0, H);
      floorGrd.addColorStop(0, 'rgba(60,45,30,0)');
      floorGrd.addColorStop(0.5, 'rgba(50,38,25,0.4)');
      floorGrd.addColorStop(1, 'rgba(40,30,20,0.6)');
      ctx.fillStyle = floorGrd; ctx.fillRect(0, H * 0.75, W, H * 0.25);
      // Reflejo sutil de la luz en el piso
      ctx.globalAlpha = 0.08;
      const reflectG = ctx.createRadialGradient(spotCenterX, H * 0.9, 0,
                                                spotCenterX, H * 0.9, spotRadius * 0.6);
      reflectG.addColorStop(0, 'rgba(255,250,220,0.3)');
      reflectG.addColorStop(1, 'transparent');
      ctx.fillStyle = reflectG;
      ctx.fillRect(0, H * 0.75, W, H * 0.25);
      ctx.globalAlpha = 1;

    } else if (style === 'aurora') {
      ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(0, 0, W, H);
      ctx.save();
      for (let band = 0; band < 8; band++) {
        const hue = (band * 42 + time * 14 + 180) % 360;
        const yCenter = H * (0.04 + band * 0.13);
        const amp = H * 0.055;
        const grd = ctx.createLinearGradient(0, yCenter - amp * 2.5, 0, yCenter + amp * 2.5);
        grd.addColorStop(0, `hsla(${hue},88%,62%,0)`);
        grd.addColorStop(0.5, `hsla(${hue},88%,62%,0.26)`);
        grd.addColorStop(1, `hsla(${hue},88%,62%,0)`);
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.moveTo(0, yCenter);
        for (let x = 0; x <= W; x += 18)
          ctx.lineTo(x, yCenter + Math.sin(x / W * Math.PI * 3.5 + time * 1.8 + band) * amp);
        ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      ctx.fillStyle = 'rgba(0,0,10,0.35)'; ctx.fillRect(0, 0, W, H);

    } else if (style === 'glitch') {
      ctx.fillStyle = 'rgba(0,4,8,0.68)'; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalAlpha = 0.1;
      for (let sl = 0; sl < H; sl += 4) { ctx.fillStyle = '#000'; ctx.fillRect(0, sl, W, 2); }
      ctx.restore();
      const nSeed = Math.floor(time * 7);
      const npr = s => Math.abs((s * 1664525 + 1013904223) & 0x7FFFFFFF) / 0x7FFFFFFF;
      ctx.save();
      for (let n = 0; n < 7; n++) {
        ctx.globalAlpha = 0.14;
        ctx.fillStyle = `hsl(${npr(nSeed * 97 + n * 4 + 4) * 180 + 160},100%,67%)`;
        ctx.fillRect(npr(nSeed * 97 + n * 4) * W, npr(nSeed * 97 + n * 4 + 1) * H,
                     npr(nSeed * 97 + n * 4 + 2) * W * 0.3, npr(nSeed * 97 + n * 4 + 3) * 5 + 1);
      }
      ctx.restore();

    } else if (style === 'luxury') {
      ctx.fillStyle = 'rgba(8,6,12,0.92)'; ctx.fillRect(0, 0, W, H);
      const sweepPos = ((time * 0.35) % 2.8) - 0.4;
      const sx = sweepPos * W * 1.2;
      const glare = ctx.createLinearGradient(sx - W * 0.12, 0, sx + W * 0.12, H);
      glare.addColorStop(0, 'rgba(255,215,80,0)');
      glare.addColorStop(0.5, 'rgba(255,215,80,0.065)');
      glare.addColorStop(1, 'rgba(255,215,80,0)');
      ctx.fillStyle = glare; ctx.fillRect(0, 0, W, H);

    } else if (style === 'magazine') {
      ctx.fillStyle = 'rgba(0,0,0,0.48)'; ctx.fillRect(0, 0, W, H);
      const panelH = H * 0.52;
      const panelGrd = ctx.createLinearGradient(0, H - panelH - 20, 0, H);
      panelGrd.addColorStop(0, 'rgba(0,0,0,0)');
      panelGrd.addColorStop(0.3, 'rgba(0,0,0,0.82)');
      panelGrd.addColorStop(1, 'rgba(0,0,0,0.96)');
      ctx.fillStyle = panelGrd; ctx.fillRect(0, H - panelH - 20, W, panelH + 20);

    } else if (style === 'frame_gold' || style === 'cinematic') {
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H * 0.13); ctx.fillRect(0, H * 0.87, W, H * 0.13);

    } else if (style === 'vintage') {
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(90,60,10,0.18)'; ctx.fillRect(0, 0, W, H);
      const vign = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.75);
      vign.addColorStop(0, 'rgba(0,0,0,0)'); vign.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = vign; ctx.fillRect(0, 0, W, H);

    } else if (style === 'neon' || style === 'frame_neon') {
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalAlpha = 0.025; ctx.fillStyle = '#000';
      for (let sy = 0; sy < H; sy += 4) ctx.fillRect(0, sy, W, 2);
      ctx.restore();

    } else if (style === 'retro_pop') {
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalAlpha = 0.08;
      for (let i = 0; i < 80; i++) {
        const rx = ((i * 213.7) % 1) * W; const ry = ((i * 137.5) % 1) * H;
        const rr = 8 + ((i * 37) % 4) * 6; const hue = (i * 45) % 360;
        ctx.fillStyle = `hsl(${hue},100%,65%)`;
        ctx.beginPath(); ctx.arc(rx, ry, rr, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      const popG = ctx.createLinearGradient(0, 0, W, H);
      popG.addColorStop(0, 'rgba(255,60,160,0.10)');
      popG.addColorStop(1, 'rgba(60,200,255,0.10)');
      ctx.fillStyle = popG; ctx.fillRect(0, 0, W, H);

    } else if (style === 'invierno') {
      ctx.fillStyle = 'rgba(0,6,18,0.72)'; ctx.fillRect(0, 0, W, H);
      const ig = ctx.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.4, W * 0.55);
      ig.addColorStop(0, 'rgba(150,210,255,0.14)'); ig.addColorStop(1, 'transparent');
      ctx.fillStyle = ig; ctx.fillRect(0, 0, W, H);
      ctx.save();
      for (let s = 0; s < 80; s++) {
        const sx = ((s * 197.3) % 1) * W; const sy2 = ((s * 113.5) % 1) * H;
        const ss = 0.5 + ((s * 79) % 3) * 0.5;
        ctx.globalAlpha = 0.15 + ((s * 43) % 10) * 0.06;
        ctx.fillStyle = 'rgba(220,240,255,0.7)';
        ctx.beginPath(); ctx.arc(sx, sy2, ss, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();

    } else if (style === 'vhs_retro') {
      ctx.fillStyle = 'rgba(0,8,6,0.75)'; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalAlpha = 0.09;
      for (let y = 0; y < H; y += 3) { ctx.fillStyle = '#000'; ctx.fillRect(0, y, W, 1); }
      ctx.restore();
      const vbl = ctx.createLinearGradient(0, 0, W * 0.1, 0);
      vbl.addColorStop(0, 'rgba(200,0,0,0.08)'); vbl.addColorStop(1, 'transparent');
      ctx.fillStyle = vbl; ctx.fillRect(0, 0, W * 0.1, H);
      const vbr = ctx.createLinearGradient(W * 0.9, 0, W, 0);
      vbr.addColorStop(0, 'transparent'); vbr.addColorStop(1, 'rgba(0,200,200,0.07)');
      ctx.fillStyle = vbr; ctx.fillRect(W * 0.9, 0, W * 0.1, H);
      ctx.fillStyle = 'rgba(0,80,40,0.10)'; ctx.fillRect(0, 0, W, H);

    } else if (style === 'neon_city') {
      ctx.fillStyle = 'rgba(0,2,8,0.88)'; ctx.fillRect(0, 0, W, H);
      const ncg = ctx.createLinearGradient(0, H * 0.65, 0, H);
      ncg.addColorStop(0, 'rgba(0,80,160,0.18)'); ncg.addColorStop(1, 'rgba(0,20,40,0.28)');
      ctx.fillStyle = ncg; ctx.fillRect(0, 0, W, H);
      [{ hue: 200, nx: 0 }, { hue: 320, nx: W }].forEach(({ hue, nx }) => {
        const rg2 = ctx.createRadialGradient(nx, H * 0.6, 0, nx, H * 0.6, W * 0.35);
        rg2.addColorStop(0, `hsla(${hue},100%,60%,0.15)`); rg2.addColorStop(1, 'transparent');
        ctx.fillStyle = rg2; ctx.fillRect(0, 0, W, H);
      });

    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, 0, W, H);
    }

    // ── 3. Transition state ──
    const transInDur  = Math.min(0.7, introDur * 0.22);
    const transOutDur = Math.min(0.6, introDur * 0.15);
    const inPct  = transInDur  > 0 ? clampN(time / transInDur, 0, 1) : 1;
    const outPct = transOutDur > 0 ? clampN((time - (introDur - transOutDur)) / transOutDur, 0, 1) : 0;
    const alpha  = clampN(Math.min(inPct, 1 - outPct), 0, 1);
    const eased  = 1 - Math.pow(1 - inPct, 3);
    const outEased = 1 - Math.pow(1 - outPct, 3);
    let offY = 0, offX = 0;
    // Entry transitions
    if (inPct < 1) {
      if (transition === 'slide-up') {
        offY = (1 - eased) * H * 0.08;
      } else if (transition === 'slide-down') {
        offY = -(1 - eased) * H * 0.08;
      } else if (transition === 'bounce') {
        const sp = 1 - Math.pow(Math.E, -8 * inPct) * Math.cos(12 * inPct);
        offY = (1 - sp) * H * 0.12;
      } else if (transition === 'glitch-in') {
        const gis = Math.floor(time * 18);
        const gipr = s => Math.abs((s * 1664525 + 1013904223) & 0x7FFFFFFF) / 0x7FFFFFFF;
        offX = (gipr(gis) - 0.5) * (1 - inPct) * W * 0.04;
      } else if (transition === 'push-up') {
        offY = (1 - eased) * H * 0.15;
      }
    }
    // Exit transitions
    if (outPct > 0) {
      if (exitTrans === 'slide-up') {
        offY = -outEased * H * 0.08;
      } else if (exitTrans === 'slide-down') {
        offY = outEased * H * 0.08;
      } else if (exitTrans === 'bounce') {
        offY = outEased * H * 0.12;
      } else if (exitTrans === 'glitch-in') {
        const gis = Math.floor(time * 18);
        const gipr = s => Math.abs((s * 1664525 + 1013904223) & 0x7FFFFFFF) / 0x7FFFFFFF;
        offX = (gipr(gis) - 0.5) * outPct * W * 0.04;
      } else if (exitTrans === 'push-up') {
        offY = -outEased * H * 0.15;
      }
    }

    // ── 4. Layout ──
    const fsBase   = Math.max(24, Math.round(fontSize * W / 1920));
    const fsTitle  = Math.round(fsBase * 1.8 * clampN(titleSize, 0.5, 2.0));
    const fsArtist = Math.round(fsTitle * clampN(artistRatio, 0.2, 1.0));
    const cx = W / 2, cy = H / 2;
    const hasArtist = artist.trim().length > 0;
    const gap = Math.round(fsTitle * 0.5);
    let titleY, artistY;
    if (style === 'magazine') {
      titleY  = H * 0.785;
      artistY = titleY - fsTitle * 0.6 - gap;
    } else {
      const totalH = hasArtist ? fsTitle + gap + fsArtist : fsTitle;
      titleY  = cy - totalH / 2 + fsTitle / 2;
      artistY = titleY + gap + fsArtist * 0.5 + fsTitle * 0.5;
    }

    // ── 5. Content block (alpha + transitions + styles) ──
    ctx.save();
    ctx.globalAlpha = alpha;

    // Entry transition effects (each with isolated save/restore)
    if (inPct < 1) {
      if (transition === 'swipe-left' || transition === 'wipe-right') {
        ctx.save();
        ctx.beginPath(); ctx.rect(0, 0, W * eased, H); ctx.clip();
      } else if (transition === 'wipe-left') {
        ctx.save();
        ctx.beginPath(); ctx.rect(W * (1 - eased), 0, W * eased, H); ctx.clip();
      } else if (transition === 'circle-expand') {
        ctx.save();
        const r = Math.max(W, H) * 0.7 * eased;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
      } else if (transition === 'curtain-open') {
        ctx.save();
        const curtW = W * (1 - eased) * 0.5;
        ctx.beginPath(); ctx.rect(curtW, 0, W - curtW * 2, H); ctx.clip();
      } else if (transition === 'zoom') {
        ctx.save();
        const sc = 0.82 + eased * 0.18;
        ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
      } else if (transition === 'spin-in') {
        ctx.save();
        const ang = (1 - eased) * 0.32;
        ctx.translate(cx, cy); ctx.rotate(ang); ctx.translate(-cx, -cy);
      } else if (transition === 'blur-in') {
        ctx.save();
        const blurPx = (1 - eased) * 22;
        if (blurPx > 0.5) ctx.filter = `blur(${blurPx.toFixed(1)}px)`;
      }
    }
    // Exit transition effects (each with isolated save/restore)
    if (outPct > 0) {
      if (exitTrans === 'swipe-left' || exitTrans === 'wipe-left') {
        ctx.save();
        ctx.beginPath(); ctx.rect(0, 0, W * (1 - outEased), H); ctx.clip();
      } else if (exitTrans === 'wipe-right') {
        ctx.save();
        ctx.beginPath(); ctx.rect(W * outEased, 0, W * (1 - outEased), H); ctx.clip();
      } else if (exitTrans === 'circle-expand') {
        ctx.save();
        const r = Math.max(W, H) * 0.7 * (1 - outEased);
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
      } else if (exitTrans === 'curtain-open') {
        ctx.save();
        const curtW = W * outEased * 0.5;
        ctx.beginPath(); ctx.rect(curtW, 0, W - curtW * 2, H); ctx.clip();
      } else if (exitTrans === 'zoom') {
        ctx.save();
        const sc = 1 - outEased * 0.18;
        ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
      } else if (exitTrans === 'spin-in') {
        ctx.save();
        const ang = outEased * 0.32;
        ctx.translate(cx, cy); ctx.rotate(ang); ctx.translate(-cx, -cy);
      } else if (exitTrans === 'blur-in') {
        ctx.save();
        const blurPx = outEased * 22;
        if (blurPx > 0.5) ctx.filter = `blur(${blurPx.toFixed(1)}px)`;
      }
    }

    // ── Frame decorations ──
    if (style === 'frame_gold') {
      const fs2 = Math.min(W, H) * 0.09;
      const pad = Math.max(16, W * 0.013);
      const lw = Math.max(1.5, W / 800);
      ctx.save();
      ctx.strokeStyle = '#ffd580'; ctx.shadowColor = '#ffd580'; ctx.shadowBlur = 18;
      ctx.lineWidth = lw; ctx.lineCap = 'square';
      // Corners
      ctx.beginPath(); ctx.moveTo(pad, pad + fs2); ctx.lineTo(pad, pad); ctx.lineTo(pad + fs2, pad); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W - pad - fs2, pad); ctx.lineTo(W - pad, pad); ctx.lineTo(W - pad, pad + fs2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad, H - pad - fs2); ctx.lineTo(pad, H - pad); ctx.lineTo(pad + fs2, H - pad); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W - pad - fs2, H - pad); ctx.lineTo(W - pad, H - pad); ctx.lineTo(W - pad, H - pad - fs2); ctx.stroke();
      // Thin inner rect
      const ip = pad + lw * 4;
      ctx.lineWidth = 1; ctx.globalAlpha *= 0.28; ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.rect(ip, ip, W - ip * 2, H - ip * 2); ctx.stroke();
      ctx.restore();
    } else if (style === 'frame_neon') {
      const pulse = 0.65 + 0.35 * Math.sin(time * 4.2);
      const pad = Math.max(16, W * 0.013);
      const lw = Math.max(1.5, W / 700);
      ctx.save();
      ctx.strokeStyle = titleColor; ctx.lineWidth = lw;
      ctx.shadowColor = titleColor; ctx.shadowBlur = 26 * pulse;
      ctx.beginPath(); ctx.rect(pad, pad, W - pad * 2, H - pad * 2); ctx.stroke();
      // Corner dots
      const cs = Math.max(6, lw * 3);
      ctx.fillStyle = titleColor;
      [[pad, pad], [W - pad, pad], [pad, H - pad], [W - pad, H - pad]].forEach(([cx2, cy2]) => {
        ctx.beginPath(); ctx.arc(cx2, cy2, cs * 0.7, 0, Math.PI * 2); ctx.fill();
      });
      // Inner thin rect
      const ip2 = pad + lw * 4 + 4;
      ctx.lineWidth = 1; ctx.globalAlpha *= 0.28; ctx.shadowBlur = 9 * pulse;
      ctx.beginPath(); ctx.rect(ip2, ip2, W - ip2 * 2, H - ip2 * 2); ctx.stroke();
      ctx.restore();
    }

    const _effectiveTitleFont  = titleFont  || fontFamily;
    const _effectiveArtistFont = artistFont || fontFamily;

    // Pre-measure
    ctx.font = `800 ${fsTitle}px ${_effectiveTitleFont}`;
    const titleDisplay = _fit(ctx, title || '\u266b', W - 160);
    ctx.font = `400 ${fsArtist}px ${_effectiveArtistFont}`;
    const artistDisplay = hasArtist ? _fit(ctx, artist, W - 200) : '';
    const tY = titleY + offY, aY = artistY + offY;
    const tX = cx + offX, aX = cx + offX;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    // Text helper — handles typewriter + glitch-in
    function _drawTxt(text, x, y, fs, weight, useFontOverride) {
      const ff = useFontOverride === 'artist' ? _effectiveArtistFont : _effectiveTitleFont;
      ctx.font = `${weight} ${fs}px ${ff}`;
      if (transition === 'typewriter' && inPct < 1) {
        const tw = ctx.measureText(text).width;
        ctx.save();
        ctx.beginPath(); ctx.rect(x - tw * 0.52, y - fs, tw * inPct + 4, fs * 2.1); ctx.clip();
        ctx.fillText(text, x, y); ctx.restore();
      } else if (transition === 'glitch-in' && inPct < 0.9) {
        const gis2 = Math.floor(time * 18);
        const gipr2 = s => Math.abs((s * 1664525 + 1013904223) & 0x7FFFFFFF) / 0x7FFFFFFF;
        const ox = (gipr2(gis2 + 11) - 0.5) * (1 - inPct) * 14;
        const oy = (gipr2(gis2 + 12) - 0.5) * (1 - inPct) * 8;
        ctx.save(); ctx.globalAlpha *= 0.45;
        ctx.fillStyle = '#ff0055'; ctx.fillText(text, x + ox * 2, y + oy);
        ctx.fillStyle = '#00eeff'; ctx.fillText(text, x - ox, y - oy * 0.5);
        ctx.restore(); ctx.fillText(text, x, y);
      } else {
        ctx.fillText(text, x, y);
      }
      ctx.shadowBlur = 0;
    }

    /** Apply user-configured drop-shadow for title text */
    function _applyTitleShadow() {
      if (titleShadowBlur > 0) {
        ctx.shadowColor   = titleShadowColor;
        ctx.shadowBlur    = titleShadowBlur;
        ctx.shadowOffsetX = titleShadowOffsetX;
        ctx.shadowOffsetY = titleShadowOffsetY;
      }
    }
    /** Apply user-configured drop-shadow for artist text */
    function _applyArtistShadow() {
      if (artistShadowBlur > 0) {
        ctx.shadowColor   = artistShadowColor;
        ctx.shadowBlur    = artistShadowBlur;
        ctx.shadowOffsetX = artistShadowOffsetX;
        ctx.shadowOffsetY = artistShadowOffsetY;
      }
    }
    function _clearShadow() {
      ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    }

    // ── Per-style title ──
    if (style === 'minimal') {
      ctx.fillStyle = titleColor; _applyTitleShadow();
      _drawTxt(titleDisplay, tX, tY, fsTitle, '300');
      _clearShadow();

    } else if (style === 'bold') {
      ctx.shadowColor = titleColor; ctx.shadowBlur = 32 * clampN(titleGlow, 0, 3); ctx.fillStyle = titleColor;
      _applyTitleShadow();
      _drawTxt(titleDisplay, tX, tY, fsTitle, '800');
      _clearShadow();

    } else if (style === 'neon') {
      ctx.save(); ctx.globalAlpha *= 0.4;
      ctx.font = `700 ${fsTitle}px ${fontFamily}`;
      ctx.shadowColor = titleColor; ctx.shadowBlur = 70; ctx.fillStyle = titleColor;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(titleDisplay, tX, tY);
      ctx.restore();
      ctx.fillStyle = '#fff'; ctx.shadowColor = titleColor; ctx.shadowBlur = 18;
      _drawTxt(titleDisplay, tX, tY, fsTitle, '700');

    } else if (style === 'cinematic') {
      const cinTitle = (title || '\u266b').toUpperCase();
      ctx.font = `200 ${Math.round(fsTitle * 0.9)}px ${fontFamily}`;
      const cinDisplay = _fit(ctx, cinTitle, W - 160);
      ctx.fillStyle = titleColor; ctx.shadowBlur = 0;
      _drawTxt(cinDisplay, tX, tY, Math.round(fsTitle * 0.9), '200');
      const lineLen = Math.min(W * 0.22, 300);
      ctx.save(); ctx.globalAlpha *= 0.4; ctx.fillStyle = titleColor;
      ctx.fillRect(tX - lineLen / 2, tY + Math.round(fsTitle * 0.62), lineLen, 1);
      ctx.restore();

    } else if (style === 'vintage') {
      ctx.shadowColor = 'rgba(180,140,60,0.6)'; ctx.shadowBlur = 14; ctx.fillStyle = titleColor;
      _drawTxt(titleDisplay, tX, tY, Math.round(fsTitle * 0.88), '600');
      ctx.save(); ctx.globalAlpha *= 0.5;
      ctx.font = `300 ${Math.round(fsArtist * 0.85)}px ${fontFamily}`;
      ctx.fillStyle = titleColor; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('\u2500\u2500\u2500 \u2736 \u2500\u2500\u2500', tX, tY + Math.round(fsTitle * 0.58));
      ctx.restore();

    } else if (style === 'frame_gold') {
      ctx.shadowColor = '#ffd580'; ctx.shadowBlur = 30; ctx.fillStyle = titleColor;
      _drawTxt(titleDisplay, tX, tY, fsTitle, '700');
      const lineLen2 = Math.min(W * 0.28, 360);
      ctx.save(); ctx.globalAlpha *= 0.45;
      ctx.strokeStyle = '#ffd580'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(tX - lineLen2 / 2, tY + fsTitle * 0.6); ctx.lineTo(tX + lineLen2 / 2, tY + fsTitle * 0.6); ctx.stroke();
      ctx.restore();

    } else if (style === 'frame_neon') {
      ctx.save(); ctx.globalAlpha *= 0.45;
      ctx.font = `700 ${fsTitle}px ${fontFamily}`;
      ctx.shadowColor = titleColor; ctx.shadowBlur = 80; ctx.fillStyle = titleColor;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(titleDisplay, tX, tY);
      ctx.restore();
      ctx.fillStyle = '#fff'; ctx.shadowColor = titleColor; ctx.shadowBlur = 22;
      _drawTxt(titleDisplay, tX, tY, fsTitle, '700');

    } else if (style === 'luxury') {
      const luxTitle = (title || '\u266b').toUpperCase();
      ctx.font = `200 ${Math.round(fsTitle * 0.9)}px ${fontFamily}`;
      const luxDisplay = _fit(ctx, luxTitle, W - 160);
      ctx.fillStyle = titleColor; ctx.shadowBlur = 0;
      _drawTxt(luxDisplay, tX, tY, Math.round(fsTitle * 0.9), '200');
      // Side lines with diamond center
      const sepLen = Math.min(W * 0.18, 240);
      const sepY = tY + Math.round(fsTitle * 0.58);
      ctx.save(); ctx.globalAlpha *= 0.5;
      ctx.strokeStyle = '#c8971f'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(tX - sepLen / 2 - 30, sepY); ctx.lineTo(tX - 10, sepY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tX + 10, sepY); ctx.lineTo(tX + sepLen / 2 + 30, sepY); ctx.stroke();
      ctx.fillStyle = '#c8971f';
      ctx.save(); ctx.translate(tX, sepY); ctx.rotate(Math.PI / 4); ctx.fillRect(-4, -4, 8, 8); ctx.restore();
      ctx.restore();

    } else if (style === 'glitch') {
      const gSeed = Math.floor(time * 7);
      const gpr = s => Math.abs((s * 1664525 + 1013904223) & 0x7FFFFFFF) / 0x7FFFFFFF;
      ctx.save(); ctx.globalAlpha *= 0.5;
      ctx.font = `800 ${fsTitle}px ${fontFamily}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ff0055'; ctx.fillText(titleDisplay, tX + gpr(gSeed) * 12 - 6, tY + gpr(gSeed + 1) * 8 - 4);
      ctx.fillStyle = '#00eeff'; ctx.fillText(titleDisplay, tX - gpr(gSeed + 2) * 10 + 5, tY - gpr(gSeed + 3) * 6 + 3);
      ctx.restore();
      ctx.fillStyle = titleColor; ctx.shadowColor = '#fff'; ctx.shadowBlur = 8;
      _drawTxt(titleDisplay, tX, tY, fsTitle, '800');

    } else if (style === 'aurora') {
      // Frosted glass panel behind text
      ctx.save(); ctx.globalAlpha *= 0.28;
      const pw = Math.min(W * 0.78, 900), ph = fsTitle * 2.4;
      const px_ = cx - pw / 2, py_ = tY - ph / 2;
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      if (ctx.roundRect) ctx.roundRect(px_, py_, pw, ph, 14);
      else ctx.rect(px_, py_, pw, ph);
      ctx.fill(); ctx.restore();
      ctx.shadowColor = 'rgba(255,255,255,0.55)'; ctx.shadowBlur = 28; ctx.fillStyle = titleColor;
      _drawTxt(titleDisplay, tX, tY, fsTitle, '700');

    } else if (style === 'magazine') {
      ctx.shadowBlur = 0; ctx.fillStyle = titleColor;
      _drawTxt(titleDisplay, tX, tY, fsTitle, '900');
      // Colored accent bar above title text
      ctx.font = `900 ${fsTitle}px ${fontFamily}`;
      const tw_ = ctx.measureText(titleDisplay).width;
      ctx.save(); ctx.globalAlpha *= 0.85; ctx.fillStyle = artistColor;
      ctx.fillRect(cx - tw_ / 2, tY - Math.round(fsTitle * 0.72), Math.min(W * 0.18, 240), Math.max(3, Math.round(fsTitle * 0.05)));
      ctx.restore();

    } else if (style === 'clasico') {
      ctx.font = `400 ${Math.round(fsTitle * 0.95)}px Georgia, serif`;
      const clasDisplay = _fit(ctx, title || '\u266b', W - 160);
      ctx.shadowBlur = 0; ctx.fillStyle = titleColor;
      _drawTxt(clasDisplay, tX, tY, Math.round(fsTitle * 0.95), '400');
      const lineLen3 = Math.min(W * 0.2, 280);
      ctx.save(); ctx.globalAlpha *= 0.35; ctx.fillStyle = titleColor;
      ctx.fillRect(tX - lineLen3 / 2 - 6, tY - Math.round(fsTitle * 0.65), lineLen3, 1);
      ctx.fillRect(tX - lineLen3 / 2 - 6, tY + Math.round(fsTitle * 0.65), lineLen3, 1);
      ctx.restore();

    } else if (style === 'gamer') {
      ctx.font = `700 ${fsTitle}px ${fontFamily}`;
      const gSeed2 = Math.floor(time * 5);
      const gpr2 = s => Math.abs((s * 1664525 + 1013904223) & 0x7FFFFFFF) / 0x7FFFFFFF;
      ctx.save(); ctx.globalAlpha *= 0.35;
      ctx.fillStyle = '#ff0055'; ctx.shadowColor = '#ff0055'; ctx.shadowBlur = 22;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(titleDisplay, tX + gpr2(gSeed2) * 6 - 3, tY + gpr2(gSeed2 + 1) * 4 - 2);
      ctx.fillStyle = '#00ffff'; ctx.shadowColor = '#00ffff';
      ctx.fillText(titleDisplay, tX - gpr2(gSeed2 + 2) * 5 + 2, tY - gpr2(gSeed2 + 3) * 3 + 1);
      ctx.restore();
      ctx.fillStyle = titleColor; ctx.shadowColor = '#fff'; ctx.shadowBlur = 12;
      _drawTxt(titleDisplay, tX, tY, fsTitle, '700');
      ctx.save(); ctx.globalAlpha *= 0.6; ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(tX - 30, tY - fsTitle * 0.6); ctx.lineTo(tX - 10, tY - fsTitle * 0.6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tX + 10, tY - fsTitle * 0.6); ctx.lineTo(tX + 30, tY - fsTitle * 0.6); ctx.stroke();
      ctx.restore();

    } else if (style === 'metal') {
      ctx.font = `900 ${fsTitle}px ${fontFamily}`;
      const metDisplay = _fit(ctx, title || '\u266b', W - 160);
      ctx.save(); ctx.globalAlpha *= 0.4;
      ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 40; ctx.fillStyle = '#ff4400';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(metDisplay, tX, tY + 6);
      ctx.restore();
      ctx.shadowColor = 'rgba(255,50,0,0.7)'; ctx.shadowBlur = 18; ctx.fillStyle = titleColor;
      _drawTxt(metDisplay, tX, tY, fsTitle, '900');

    } else if (style === 'fotografia') {
      ctx.shadowBlur = 0; ctx.fillStyle = titleColor;
      _drawTxt(titleDisplay, tX, tY, fsTitle, '400');
      ctx.save(); ctx.globalAlpha *= 0.5; ctx.fillStyle = titleColor;
      ctx.font = `300 ${Math.round(fsArtist * 0.7)}px ${fontFamily}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(`ISO 400 | f/2.8 | 1/125`, tX, tY + fsTitle * 0.65);
      ctx.restore();

    } else if (style === 'espacial') {
      ctx.shadowColor = titleColor; ctx.shadowBlur = 35; ctx.fillStyle = titleColor;
      _drawTxt(titleDisplay, tX, tY, fsTitle, '600');
      ctx.save(); ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 2;
      for (let p = 0; p < 6; p++) {
        const px = tX + (p - 3) * fsTitle * 0.25 + Math.sin(time * 3 + p) * 20;
        const py = tY - fsTitle * 0.6 + Math.cos(time * 2 + p * 0.7) * 12;
        ctx.globalAlpha = 0.3 + Math.sin(time * 4 + p) * 0.2;
        ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();

    } else if (style === 'teatro') {
      ctx.shadowColor = '#ff9900'; ctx.shadowBlur = 35; ctx.fillStyle = titleColor;
      _drawTxt(titleDisplay, tX, tY, fsTitle, '700');
      ctx.save(); ctx.globalAlpha *= 0.5;
      ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      const ornW = Math.min(W * 0.18, 200);
      // Ornamentos dorados más elaborados
      [[tX - ornW, tY - fsTitle * 0.7], [tX + ornW, tY - fsTitle * 0.7]].forEach(([ox, oy], idx) => {
        const dir = idx === 0 ? -1 : 1;
        ctx.beginPath();
        ctx.moveTo(ox - 30 * dir, oy);
        ctx.bezierCurveTo(ox - 15 * dir, oy - 15, ox + 5 * dir, oy - 12, ox + 20 * dir, oy);
        ctx.stroke();
        // Detalle adicional
        ctx.globalAlpha *= 0.6;
        ctx.beginPath();
        ctx.arc(ox + 20 * dir, oy, 5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

    } else if (style === 'escenario') {
      ctx.shadowColor = '#ffee99'; ctx.shadowBlur = 60; ctx.fillStyle = titleColor;
      _drawTxt(titleDisplay, tX, tY, fsTitle, '800');
      // Haz de luz detr\u00e1s del t\u00edtulo (sutil)
      ctx.save(); ctx.globalAlpha *= 0.15;
      const beamG = ctx.createRadialGradient(tX, tY - fsTitle * 0.6, 0,
                                              tX, tY - fsTitle * 0.6, Math.min(W, H) * 0.25);
      beamG.addColorStop(0, 'rgba(255,250,220,0.4)');
      beamG.addColorStop(0.6, 'rgba(255,240,180,0.1)');
      beamG.addColorStop(1, 'transparent');
      ctx.fillStyle = beamG;
      ctx.beginPath();
      ctx.arc(tX, tY - fsTitle * 0.6, Math.min(W, H) * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // Fallback rendering for styles without an explicit title block
      ctx.shadowColor = titleColor; ctx.shadowBlur = 20 * clampN(titleGlow, 0, 3);
      ctx.fillStyle = titleColor;
      _applyTitleShadow();
      _drawTxt(titleDisplay, tX, tY, fsTitle, '700');
      _clearShadow();
    }

    // ── Artist ──
    if (hasArtist) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = artistColor;
      const _neonStyles = ['neon', 'frame_neon'];
      ctx.shadowBlur = _neonStyles.includes(style) ? 18 * clampN(artistGlow, 0, 3) : 0;
      if (_neonStyles.includes(style)) ctx.shadowColor = artistColor;
      _applyArtistShadow();
      let artText = artistDisplay;
      let artWeight = '400';
      if (['cinematic', 'luxury', 'magazine'].includes(style)) { artText = (artist || '').toUpperCase(); artWeight = '300'; }
      if (style === 'magazine') {
        // Pill badge above title
        ctx.font = `500 ${fsArtist}px ${_effectiveArtistFont}`;
        const aw = ctx.measureText(artText).width;
        const pillPad = fsArtist * 0.45;
        ctx.save(); ctx.globalAlpha *= 0.75; ctx.fillStyle = artistColor;
        const pillX = aX - aw / 2 - pillPad, pillY = aY - fsArtist * 0.7;
        const pillW = aw + pillPad * 2, pillH = fsArtist * 1.5;
        if (ctx.roundRect) ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
        else ctx.rect(pillX, pillY, pillW, pillH);
        ctx.fill(); ctx.restore();
        ctx.fillStyle = '#000'; ctx.shadowBlur = 0;
        _drawTxt(artText, aX, aY, fsArtist, '500', 'artist');
      } else {
        _drawTxt(artText, aX, aY, fsArtist, artWeight, 'artist');
      }
      _clearShadow();
    }

    // Restore exit transition context
    if (outPct > 0 && ['swipe-left', 'wipe-left', 'wipe-right', 'circle-expand', 'curtain-open', 'zoom', 'spin-in', 'blur-in'].includes(exitTrans)) {
      ctx.restore();
    }
    // Restore entry transition context
    if (inPct < 1 && ['swipe-left', 'wipe-left', 'wipe-right', 'circle-expand', 'curtain-open', 'zoom', 'spin-in', 'blur-in'].includes(transition)) {
      ctx.restore();
    }
    // Restore main content context
    ctx.restore();

    // ── Progress bar ──
    if (showProgressBar) {
      ctx.save(); ctx.globalAlpha = clampN(progressBarOpacity, 0, 1);
      const _progressT = progressColorOverride ? { ...T, progressFg: progressColorOverride } : T;
      _drawProgress(ctx, W, H, progT, progDur, progressBarStyle, _progressT, Math.max(12, Math.round(fontSize * 0.44 * W / 1920)), progressBarThickness, progressTimeSize);
      ctx.restore();
    }
    // ── FG overlay ──
    ctx.save(); (OVERLAYS[overlayEffect] || OVERLAYS.none)(ctx, W, H, bgT); ctx.restore();
  }

  function _drawBg(ctx, W, H, T) {
    if (typeof T.bgFn === 'function') { ctx.save(); T.bgFn(ctx, W, H); ctx.restore(); return; }
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, T.base[0]); bg.addColorStop(1, T.base[1]);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  }

  /* ── Outro: renders the same as intro but with remapped transition time ── */
  function drawOutroFrame(ctx, W, H, opts, outroConfig) {
    const outroDur    = outroConfig.duration || 4;
    const outroRelTime = Math.max(0, opts.time - (opts.duration - outroDur));
    drawIntroFrame(ctx, W, H, {
      ...opts,
      time: outroRelTime,           // transition & text timing (0 → outroDur)
      _bgTime: opts.time,           // keep real song time for animations
      _progressTime: opts.time,     // keep real song time for progress bar
      _progressDuration: opts.duration,
    }, { ...outroConfig, duration: outroDur });
  }

  // ── Logo watermark: lazy-loaded once, reused every frame ──
  let _wmarkImg = null;
  function _getWmarkImg() {
    if (!_wmarkImg) { _wmarkImg = new Image(); _wmarkImg.src = logoUrl; }
    return _wmarkImg;
  }

  /* ── Watermark: periodic / fixed logo stamp with timing windows and animations ── */
  // ranges: array of { enabled, from, to } — up to 3 optional time windows.
  // If no range is enabled the logo is shown continuously.
  function _drawWatermark(ctx, W, H, t, opacity, size, position, ranges, animType, visualEffect) {
    const op  = clampN(opacity ?? 0.35, 0.01, 1.0);
    const sz  = clampN(size   ?? 0.22, 0.05, 0.60);
    const pos = position || 'br';
    const img = _getWmarkImg();
    if (!img.complete || !img.naturalWidth) return;

    // ── Compute visibility alpha (0–1 with 0.5 s fade at each range edge) ──
    const fadeDur    = 0.5;
    const activeRanges = (ranges || []).filter(r => r.enabled && r.to > r.from);
    let winAlpha = 0;

    if (activeRanges.length === 0) {
      winAlpha = 1; // no ranges defined → always visible
    } else {
      for (const r of activeRanges) {
        if (t >= r.from && t <= r.to) {
          const a = Math.min(
            Math.min(1, (t - r.from) / fadeDur),
            Math.min(1, (r.to   - t) / fadeDur)
          );
          winAlpha = Math.max(winAlpha, a);
        }
      }
    }
    if (winAlpha <= 0) return;

    // ── Position + dimensions ──
    const logW = W * sz;
    const logH = logW * (img.naturalHeight / img.naturalWidth);
    const pad  = W * 0.035;
    let lx, ly;

    if (pos === 'rotate') {
      if (activeRanges.length === 0) {
        // No ranges: built-in 40 s cycle / 7 s visibility per corner
        const cycle = 40, visible = 7;
        const tInCycle = t % cycle;
        if (tInCycle > visible) return;
        const fade = Math.min(1, (visible - tInCycle) / 1.2);
        const alpha = fade * op;
        if (alpha < 0.005) return;
        const cycleN = Math.floor(t / cycle);
        const positions = [
          [pad,            pad],
          [W - logW - pad, H - logH - pad],
          [W - logW - pad, pad],
          [pad,            H - logH - pad],
        ];
        [lx, ly] = positions[cycleN % 4];
        ctx.save(); ctx.globalAlpha = alpha;
        ctx.filter = 'drop-shadow(0px 1px 4px rgba(0,0,0,0.5))';
        ctx.drawImage(img, lx, ly, logW, logH);
        ctx.restore();
        return;
      }
      // Ranges defined: cycle through corners every 10 s within each window
      const cycleN = Math.floor(t / 10);
      const rotPos = [
        [W - logW - pad, H - logH - pad],
        [W - logW - pad, pad],
        [pad,            pad],
        [pad,            H - logH - pad],
      ];
      [lx, ly] = rotPos[cycleN % 4];
    } else {
      const corners = {
        tl: [pad,            pad],
        tr: [W - logW - pad, pad],
        bl: [pad,            H - logH - pad],
        br: [W - logW - pad, H - logH - pad],
        center: [(W - logW) / 2, (H - logH) / 2],
      };
      [lx, ly] = corners[pos] ?? corners.br;
    }

    const alpha = winAlpha * op;
    const _acx  = lx + logW / 2;
    const _acy  = ly + logH / 2;

    // ── Draw with animation transforms + visual effect ──
    ctx.save();
    ctx.globalAlpha = alpha;

    // Animation transforms
    if (animType === 'slide' && winAlpha < 1) {
      ctx.translate((1 - winAlpha) * logW * 0.6, 0);
    } else if (animType === 'zoom' && winAlpha < 1) {
      const sc = 0.5 + 0.5 * winAlpha;
      ctx.translate(_acx, _acy); ctx.scale(sc, sc); ctx.translate(-_acx, -_acy);
    } else if (animType === 'coin') {
      const flipX = Math.cos(t * 2.2);
      if (Math.abs(flipX) < 0.15) ctx.filter = 'brightness(1.6) saturate(0.4)';
      ctx.translate(_acx, _acy); ctx.scale(flipX, 1); ctx.translate(-_acx, -_acy);
    } else if (animType === 'pendulum') {
      const angle = Math.sin(t * 1.75) * 0.24;
      ctx.translate(_acx, ly); ctx.rotate(angle); ctx.translate(-_acx, -ly);
    } else if (animType === 'spin') {
      ctx.translate(_acx, _acy); ctx.rotate(t * 1.4); ctx.translate(-_acx, -_acy);
    } else if (animType === 'float') {
      const dy = Math.sin(t * 1.35) * logH * 0.09;
      const dp = 1 + 0.04 * Math.sin(t * 2.7);
      ctx.translate(_acx, _acy + dy); ctx.scale(dp, dp); ctx.translate(-_acx, -_acy);
    }

    // Visual effect (applied via filter — already set for coin above, others override)
    if (visualEffect === 'glow') {
      ctx.filter = 'drop-shadow(0 0 10px rgba(160,80,255,0.85)) drop-shadow(0 0 5px rgba(180,100,255,0.7)) drop-shadow(0px 1px 4px rgba(0,0,0,0.4))';
    } else if (visualEffect === 'pulse') {
      const pb = 8 + 5 * Math.sin(t * 3.5);
      const pa = 0.7 + 0.3 * Math.sin(t * 3.5);
      ctx.filter = `drop-shadow(0 0 ${pb.toFixed(1)}px rgba(160,80,255,${pa.toFixed(2)})) drop-shadow(0 0 ${(pb*0.5).toFixed(1)}px rgba(255,180,90,${(pa*0.5).toFixed(2)}))`;
      ctx.globalAlpha = alpha * (0.85 + 0.15 * Math.sin(t * 3.5));
    } else if (visualEffect === 'outline') {
      ctx.filter = 'drop-shadow(0 0 3px rgba(255,255,255,1)) drop-shadow(0 0 3px rgba(255,255,255,0.9)) drop-shadow(0 0 2px rgba(255,255,255,0.85)) drop-shadow(0px 1px 3px rgba(0,0,0,0.4))';
    } else if (visualEffect === 'stamp') {
      const wobble = Math.sin(t * 0.25) * 0.014;
      ctx.translate(_acx, _acy); ctx.rotate(wobble); ctx.translate(-_acx, -_acy);
      ctx.filter = 'sepia(0.4) contrast(1.12) drop-shadow(2px 3px 4px rgba(0,0,0,0.8))';
    } else if (visualEffect === 'shadow') {
      ctx.filter = 'drop-shadow(5px 7px 16px rgba(0,0,0,0.95)) drop-shadow(0 0 5px rgba(0,0,0,0.85))';
    } else if (ctx.filter === 'none' || !ctx.filter) {
      ctx.filter = 'drop-shadow(0px 1px 4px rgba(0,0,0,0.5))';
    }
    ctx.drawImage(img, lx, ly, logW, logH);
    ctx.restore();
  }

  function drawFrame(canvas, opts) {
    const { time=0, duration=1, lines=[], theme='classic', animation='none', fontSize=56, songTitle='', activeColorOverride, inactiveColorOverride, progressColorOverride, textPosition='center', glowIntensity=1, overlayEffect='none', showProgressBar=true, showTitle=true, voiceConfig=null, fontFamily="'Segoe UI', sans-serif", activeZoom=1, textEffect='none', fillEffect='default', progressBarStyle='bottom', progressBarOpacity=1, secondarySizeRatio=0.62, secondaryOpacity=0.65, nextLineOffset=1.05, prevLineOpacity=0.22, introConfig=null, outroConfig=null, showWatermark=false, lyricsEndTime=null,
      textShadowType='none', textShadowColor='#000000', textShadowBlur=12, textShadowOffsetX=0, textShadowOffsetY=3,
      strokeWidth=0, strokeColor='#000000', strokeEffect='solid',
      progressBarThickness=1.0, progressTimeSize=1.0,
      watermarkOpacity=0.35, watermarkSize=0.22, watermarkPosition='br',
      watermarkRanges=[], watermarkAnim='none', watermarkVisualEffect='none',
    } = opts;
    // Rate-limited log: fires only when activeColorOverride or songTitle changes
    const W=canvas.width, H=canvas.height, ctx=canvas.getContext('2d');
    const T=THEMES[theme]||THEMES.classic;
    const GI=clampN(glowIntensity,0,3);

    // ── Intro title card (renders in place of lyrics during intro duration) ──
    if (introConfig?.enabled && time < introConfig.duration) {
      drawIntroFrame(ctx, W, H, opts, introConfig);
      if (showWatermark) _drawWatermark(ctx, W, H, time, watermarkOpacity, watermarkSize, watermarkPosition, watermarkRanges, watermarkAnim, watermarkVisualEffect);
      return;
    }
    // Outro card: show when audio is within the final `outroConfig.duration` seconds
    if (outroConfig?.enabled && duration > outroConfig.duration && time >= duration - outroConfig.duration) {
      drawOutroFrame(ctx, W, H, opts, outroConfig);
      if (showWatermark) _drawWatermark(ctx, W, H, time, watermarkOpacity, watermarkSize, watermarkPosition, watermarkRanges, watermarkAnim, watermarkVisualEffect);
      return;
    }

    _drawBg(ctx, W, H, T);

    ctx.save(); (ANIMATIONS[animation]||ANIMATIONS.none)(ctx,W,H,time); ctx.restore();
    // Skip darkening for solid-color backgrounds (bg_*) so the chosen colour stays accurate
    if (!animation.startsWith('bg_')) { ctx.fillStyle='rgba(0,0,0,0.28)'; ctx.fillRect(0,0,W,H); }

    let activeIdx=-1;
    for (let i=0; i<lines.length; i++) { if (lines[i].time<=time) activeIdx=i; }
    const prevLine=activeIdx>0?lines[activeIdx-1]:null;
    const currLine=activeIdx>=0?lines[activeIdx]:null;
    const nextLine=activeIdx>=0&&activeIdx<lines.length-1?lines[activeIdx+1]:null;
    const activeColor=activeColorOverride||T.textActive, inactiveColor=inactiveColorOverride||T.textDim;

    // Resolve per-line voice color if voiceConfig is provided
    function _lineActiveColor(line) {
      if (!voiceConfig || line.voice === null || line.voice === undefined) return activeColor;
      if (line.voice === 0) return voiceConfig.allColor || activeColor;
      const v = voiceConfig.voices[line.voice - 1];
      return (v && v.color) ? v.color : activeColor;
    }

    const cx=W/2, fsLg=Math.max(22,Math.round(fontSize*W/1920)), fsMd=Math.max(16,Math.round(fsLg*secondarySizeRatio)), fsSm=Math.max(12,Math.round(fsLg*0.44));
    const midY = textPosition==='lower' ? H*0.72 : textPosition==='upper' ? H*0.28 : H*0.5;

    if (showTitle && songTitle) {
      ctx.font=`500 ${fsSm}px ${fontFamily}`; ctx.fillStyle='rgba(255,255,255,0.38)';
      ctx.textAlign='left'; ctx.textBaseline='alphabetic'; ctx.fillText(songTitle,28,36);
    }

    if (showProgressBar) {
      ctx.save();
      ctx.globalAlpha = clampN(progressBarOpacity, 0, 1);
      const _progressT = progressColorOverride ? { ...T, progressFg: progressColorOverride } : T;
      _drawProgress(ctx, W, H, time, duration, progressBarStyle, _progressT, fsSm);
      ctx.restore();
    }

    if (prevLine) {
      ctx.save();
      ctx.globalAlpha = clampN(prevLineOpacity, 0, 1);
      ctx.font=`300 ${fsMd}px ${fontFamily}`; ctx.fillStyle=inactiveColor;
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(_fit(ctx,prevLine.text,W-80),cx,midY-fsLg*(nextLineOffset+0.6));
      ctx.restore();
    }
    if (nextLine) {
      ctx.save();
      ctx.globalAlpha = clampN(secondaryOpacity, 0, 1);
      ctx.font=`400 ${fsMd}px ${fontFamily}`; ctx.fillStyle=inactiveColor;
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.shadowColor='transparent'; ctx.shadowBlur=0;
      ctx.fillText(_fit(ctx,nextLine.text,W-80),cx,midY+fsLg*nextLineOffset);
      ctx.restore();
    }
    // Blank lyrics after the marked end time
    if (lyricsEndTime && time >= lyricsEndTime) {
      ctx.font=`300 ${fsMd}px ${fontFamily}`; ctx.fillStyle='rgba(255,255,255,0.10)';
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('',cx,midY); ctx.textBaseline='alphabetic';
      // fall through to overlay + watermark
    } else if (currLine) {
      // If line is a label/indicator, render as a dimmed italic caption
      if (currLine.isLabel) {
        ctx.font = `400 italic ${fsMd}px ${fontFamily}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.globalAlpha = 0.65; ctx.shadowBlur = 0;
        ctx.fillStyle = inactiveColor;
        ctx.fillText('♪ ' + _fit(ctx, currLine.text, W - 100) + ' ♪', cx, midY);
        ctx.globalAlpha = 1; ctx.textBaseline = 'alphabetic';
      } else {
      const lineActiveColor=_lineActiveColor(currLine);
      const lineEnd=nextLine?nextLine.time:(lyricsEndTime && lyricsEndTime < duration ? lyricsEndTime : duration);
      const linePct=lineEnd>currLine.time?clampN((time-currLine.time)/(lineEnd-currLine.time),0,1):1;
      const lineAge = time - currLine.time; // seconds since line became active
      const txt=_fit(ctx,currLine.text,W-80);
      ctx.font=`700 ${fsLg}px ${fontFamily}`; ctx.textAlign='center'; ctx.textBaseline='middle';
      // Apply zoom transform centered on text
      ctx.save();
      if (activeZoom !== 1) { ctx.translate(cx, midY); ctx.scale(activeZoom, activeZoom); ctx.translate(-cx, -midY); }
      // Apply text effect or default glow
      const effectFn = TEXT_EFFECTS[textEffect];
      // Helper: apply user-configured text shadow on top of effect shadow
      function _applyTextShadow() {
        if (textShadowType === 'none') return;
        if (textShadowType === 'glow') {
          ctx.shadowColor  = textShadowColor;
          ctx.shadowBlur   = textShadowBlur;
          ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
        } else if (textShadowType === 'hard') {
          ctx.shadowColor  = textShadowColor;
          ctx.shadowBlur   = 2;
          ctx.shadowOffsetX = textShadowOffsetX; ctx.shadowOffsetY = textShadowOffsetY;
        } else if (textShadowType === 'diffuse') {
          ctx.shadowColor  = textShadowColor;
          ctx.shadowBlur   = textShadowBlur * 2;
          ctx.shadowOffsetX = textShadowOffsetX * 0.4; ctx.shadowOffsetY = textShadowOffsetY * 0.4;
        } else { // custom
          ctx.shadowColor  = textShadowColor;
          ctx.shadowBlur   = textShadowBlur;
          ctx.shadowOffsetX = textShadowOffsetX; ctx.shadowOffsetY = textShadowOffsetY;
        }
      }
      if (effectFn) {
        effectFn(ctx, txt, cx, midY, fsLg, lineActiveColor, GI, time, lineAge);
        _applyTextShadow();
      } else {
        // Use lineActiveColor for shadow so user's color picker drives the glow too
        const shadowCol = activeColorOverride ? lineActiveColor : T.shadowActive;
        ctx.shadowColor=shadowCol; ctx.shadowBlur=(28+Math.sin(time*4.5)*7)*GI; ctx.fillStyle=lineActiveColor;
        _applyTextShadow();
        ctx.fillText(txt,cx,midY);
      }
      // Karaoke fill reveal (style driven by fillEffect)
      const txtW=ctx.measureText(txt).width, startX=cx-txtW/2;
      if (fillEffect === 'glow_edge') {
        ctx.save(); ctx.beginPath(); ctx.rect(startX-2,midY-fsLg*1.1,(txtW+2)*linePct,fsLg*2.2); ctx.clip();
        ctx.shadowColor=lineActiveColor; ctx.shadowBlur=14*GI; ctx.fillStyle=lineActiveColor; ctx.fillText(txt,cx,midY); ctx.restore();
        if (linePct>0.005 && linePct<0.995) {
          const edgeX = startX + txtW*linePct, sw = Math.max(3, fsLg*0.08);
          const sg = ctx.createLinearGradient(edgeX-sw,0,edgeX+sw,0);
          sg.addColorStop(0,'rgba(255,255,255,0)'); sg.addColorStop(0.5,'rgba(255,255,255,0.92)'); sg.addColorStop(1,'rgba(255,255,255,0)');
          ctx.save(); ctx.globalAlpha=0.72; ctx.fillStyle=sg;
          ctx.fillRect(edgeX-sw,midY-fsLg*1.05,sw*2,fsLg*2.1); ctx.restore();
        }
      } else if (fillEffect === 'gradiente') {
        ctx.save(); ctx.beginPath(); ctx.rect(startX-2,midY-fsLg*1.1,(txtW+2)*linePct,fsLg*2.2); ctx.clip();
        const fg = ctx.createLinearGradient(startX,0,startX+txtW,0);
        fg.addColorStop(0,lineActiveColor); fg.addColorStop(1,'#ffffff');
        ctx.shadowColor=lineActiveColor; ctx.shadowBlur=14*GI; ctx.fillStyle=fg; ctx.fillText(txt,cx,midY); ctx.restore();
      } else if (fillEffect === 'palabra') {
        ctx.save(); ctx.textAlign='left';
        const words=txt.split(' '), spW=ctx.measureText(' ').width;
        let wx=startX;
        const totalWords=words.length;
        words.forEach((w,wi)=>{
          const wW=ctx.measureText(w).width;
          const revealAt=totalWords>1?wi/(totalWords-1):0;
          if (linePct>=revealAt) { ctx.shadowColor=lineActiveColor; ctx.shadowBlur=14*GI; ctx.fillStyle=lineActiveColor; }
          else { ctx.shadowBlur=0; ctx.fillStyle=inactiveColor; }
          ctx.fillText(w,wx,midY); wx+=wW+spW;
        });
        ctx.restore();
      } else {
        ctx.save(); ctx.beginPath(); ctx.rect(startX-2,midY-fsLg*1.1,(txtW+2)*linePct,fsLg*2.2); ctx.clip();
        ctx.shadowColor=lineActiveColor; ctx.shadowBlur=(28+Math.sin(time*4.5)*7)*GI; ctx.fillStyle=lineActiveColor; ctx.fillText(txt,cx,midY); ctx.restore();
      }

      // ── New fill effects ──
      if (fillEffect === 'metalico') {
        ctx.save(); ctx.beginPath(); ctx.rect(startX-2,midY-fsLg*1.1,(txtW+2)*linePct,fsLg*2.2); ctx.clip();
        const sweepX = startX + ((time * 0.55) % 1.5) * (txtW + 120) - 60;
        const mg = ctx.createLinearGradient(sweepX-70,0,sweepX+70,0);
        mg.addColorStop(0,lineActiveColor); mg.addColorStop(0.4,'#d8d8d8'); mg.addColorStop(0.5,'#ffffff'); mg.addColorStop(0.6,'#b0b0b0'); mg.addColorStop(1,lineActiveColor);
        ctx.shadowColor=lineActiveColor; ctx.shadowBlur=10*GI; ctx.fillStyle=mg; ctx.fillText(txt,cx,midY); ctx.restore();
      } else if (fillEffect === 'rayas') {
        ctx.save(); ctx.beginPath(); ctx.rect(startX-2,midY-fsLg*1.1,(txtW+2)*linePct,fsLg*2.2); ctx.clip();
        ctx.shadowColor=lineActiveColor; ctx.shadowBlur=8*GI; ctx.fillStyle=lineActiveColor; ctx.fillText(txt,cx,midY);
        ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=0.18;
        const sw2=fsLg*0.45, sOff=(time*50)%(sw2*2);
        ctx.fillStyle='#ffffff';
        for(let sx=startX-sw2*2+sOff; sx<startX+txtW+sw2; sx+=sw2*2) {
          ctx.beginPath(); ctx.moveTo(sx,midY-fsLg*1.2); ctx.lineTo(sx+sw2,midY-fsLg*1.2); ctx.lineTo(sx+sw2-fsLg*0.7,midY+fsLg*1.2); ctx.lineTo(sx-fsLg*0.7,midY+fsLg*1.2); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      } else if (fillEffect === 'ondulado') {
        ctx.save();
        const wAmp=fsLg*0.14;
        ctx.beginPath();
        const waveX1=startX-2, waveX2=startX+txtW*linePct;
        ctx.moveTo(waveX1, midY-fsLg*1.15);
        for(let wx=waveX1; wx<=waveX2; wx+=3) ctx.lineTo(wx, midY-fsLg*1.15+Math.sin((wx/txtW)*Math.PI*5+time*5)*wAmp);
        ctx.lineTo(waveX2, midY+fsLg*1.15);
        ctx.lineTo(waveX1, midY+fsLg*1.15);
        ctx.closePath(); ctx.clip();
        const hue1=(time*35)%360;
        const wg=ctx.createLinearGradient(startX,0,startX+txtW,0);
        wg.addColorStop(0,`hsl(${hue1},100%,62%)`); wg.addColorStop(0.5,`hsl(${(hue1+80)%360},100%,68%)`); wg.addColorStop(1,`hsl(${(hue1+160)%360},100%,62%)`);
        ctx.shadowColor=lineActiveColor; ctx.shadowBlur=14*GI; ctx.fillStyle=wg; ctx.fillText(txt,cx,midY); ctx.restore();
      } else if (fillEffect === 'arcoiris_fill') {
        ctx.save(); ctx.beginPath(); ctx.rect(startX-2,midY-fsLg*1.1,(txtW+2)*linePct,fsLg*2.2); ctx.clip();
        const hueS=(time*28)%360;
        const rg2=ctx.createLinearGradient(startX,0,startX+txtW,0);
        for(let i=0;i<=6;i++) rg2.addColorStop(i/6,`hsl(${(hueS+i*60)%360},100%,60%)`);
        ctx.shadowColor='rgba(255,255,255,0.5)'; ctx.shadowBlur=8*GI; ctx.fillStyle=rg2; ctx.fillText(txt,cx,midY); ctx.restore();
      } else if (fillEffect === 'pulso_neon') {
        const pulse2=(0.5+0.5*Math.sin(time*7));
        ctx.save(); ctx.beginPath(); ctx.rect(startX-2,midY-fsLg*1.1,(txtW+2)*linePct,fsLg*2.2); ctx.clip();
        ctx.shadowColor=lineActiveColor; ctx.shadowBlur=(18+42*pulse2)*GI;
        ctx.fillStyle='#ffffff'; ctx.globalAlpha*=(0.25+pulse2*0.75);
        ctx.fillText(txt,cx,midY); ctx.restore();
        ctx.save(); ctx.beginPath(); ctx.rect(startX-2,midY-fsLg*1.1,(txtW+2)*linePct,fsLg*2.2); ctx.clip();
        ctx.shadowColor=lineActiveColor; ctx.shadowBlur=12*GI; ctx.fillStyle=lineActiveColor; ctx.fillText(txt,cx,midY); ctx.restore();
      }

      // ── Stroke / contorno ──
      if (strokeWidth > 0) {
        ctx.save();
        ctx.font=`${ctx.font.split(' ').slice(0,-1).join(' ')} ${fontFamily}`.replace(/^\s+/,'');
        ctx.font=`700 ${fsLg}px ${fontFamily}`;
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.lineJoin='round';
        const scaledLW = Math.max(1, strokeWidth * W / 1920);
        if (strokeEffect === 'glow') {
          ctx.shadowColor=strokeColor; ctx.shadowBlur=scaledLW*3.5*GI;
          ctx.strokeStyle=strokeColor; ctx.lineWidth=scaledLW;
          ctx.strokeText(txt,cx,midY);
          ctx.strokeStyle='rgba(255,255,255,0.55)'; ctx.lineWidth=scaledLW*0.35; ctx.shadowBlur=0;
          ctx.strokeText(txt,cx,midY);
        } else if (strokeEffect === 'doble') {
          ctx.strokeStyle=strokeColor; ctx.lineWidth=scaledLW+2; ctx.strokeText(txt,cx,midY);
          ctx.strokeStyle='#ffffff'; ctx.lineWidth=scaledLW*0.45; ctx.strokeText(txt,cx,midY);
        } else {
          ctx.strokeStyle=strokeColor; ctx.lineWidth=scaledLW;
          ctx.strokeText(txt,cx,midY);
        }
        ctx.restore();
      }

      ctx.restore(); // end zoom transform
      } // end currLine.isLabel else
    } else if (!(lyricsEndTime && time >= lyricsEndTime)) {
      ctx.font=`300 ${fsMd}px ${fontFamily}`; ctx.fillStyle='rgba(255,255,255,0.22)';
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('♪  ♪  ♪',cx,midY); ctx.textBaseline='alphabetic';
    }
    // Foreground overlay (renders atop text)
    ctx.save(); (OVERLAYS[overlayEffect]||OVERLAYS.none)(ctx,W,H,time); ctx.restore();
    // Optional watermark
    if (showWatermark) _drawWatermark(ctx, W, H, time, watermarkOpacity, watermarkSize, watermarkPosition, watermarkRanges, watermarkAnim, watermarkVisualEffect);
  }

  function _fit(ctx, text, maxW) {
    if (!text) return '';
    if (ctx.measureText(text).width<=maxW) return text;
    let t=text;
    while (t.length>3&&ctx.measureText(t+'…').width>maxW) t=t.slice(0,-1);
    return t+'…';
  }

  return { drawFrame, THEMES, ANIMATIONS, OVERLAY_LIST, OVERLAY_CATEGORIES, ANIMATION_LIST, ANIMATION_CATEGORIES, THEME_LIST, THEME_CATEGORIES, FONT_LIST, TEXT_EFFECT_LIST, FILL_EFFECT_LIST, PROGRESS_BAR_LIST };
})();

export default Renderer;
