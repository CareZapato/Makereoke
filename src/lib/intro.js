/* ============================================================
   intro.js — Intro title card configuration (ES module)
   ============================================================ */

const Intro = (() => {
  const _defaults = {
    enabled:     false,
    duration:    4,          // seconds the intro card shows
    title:       '',         // song title displayed on the card
    artist:      '',         // artist / band name
    showLogo:    true,       // show 'Makereoke' watermark
    style:       'bold',     // 'minimal' | 'bold' | 'neon' | 'cinematic' | 'vintage'
    transition:  'fade',     // 'fade' | 'slide-up' | 'zoom' | 'typewriter'
    titleColor:  '#ffffff',
    artistColor: '#c0a0ff',
    titleSize:   1.0,        // size multiplier for the title text
    artistRatio: 0.45,       // artist font size as fraction of title font
  };

  let _cfg = { ..._defaults };

  function get()        { return { ..._cfg }; }
  function set(partial) { Object.assign(_cfg, partial); }
  function reset()      { _cfg = { ..._defaults }; }

  return { get, set, reset };
})();

export default Intro;
