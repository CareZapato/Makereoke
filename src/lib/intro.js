/* ============================================================
   intro.js — Intro title card configuration (ES module)
   ============================================================ */

const Intro = (() => {
  const _defaults = {
    enabled:        false,
    duration:       4,          // seconds the intro card shows
    title:          '',         // song title displayed on the card
    artist:         '',         // artist / band name
    showLogo:       true,       // show 'Karaoke Video Maker' watermark
    style:          'bold',     // 'minimal' | 'bold' | 'neon' | 'cinematic' | 'vintage' | ...
    transition:     'fade',     // 'fade' | 'slide-up' | 'zoom' | 'typewriter' | ...
    transitionOut:  null,       // null = use same as transition, or specify different exit transition
    titleColor:      '#ffffff',
    artistColor:     '#c0a0ff',
    titleSize:       1.0,        // size multiplier for the title text
    artistRatio:     0.45,       // artist font size as fraction of title font
    useSameTransOut: true,       // UI checkbox: true = transitionOut follows transition
    // Typography overrides
    titleFont:       '',         // '' = use global fontFamily
    artistFont:      '',         // '' = use global fontFamily
    // Glow intensity multipliers (0 = off, 1 = normal, 2 = intense)
    titleGlow:       1.0,
    artistGlow:      0.6,
    // Drop shadow for title and artist
    titleShadowColor:  '#000000',
    titleShadowBlur:   0,
    titleShadowOffsetX: 0,
    titleShadowOffsetY: 2,
    artistShadowColor:  '#000000',
    artistShadowBlur:   0,
    artistShadowOffsetX: 0,
    artistShadowOffsetY: 2,
  };

  let _cfg = { ..._defaults };

  function get()        { return { ..._cfg }; }
  function set(partial) { Object.assign(_cfg, partial); }
  function reset()      { _cfg = { ..._defaults }; }

  return { get, set, reset };
})();

export default Intro;
