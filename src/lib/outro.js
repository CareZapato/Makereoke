/* ============================================================
   outro.js — Outro title card configuration (ES module)
   ============================================================ */

const Outro = (() => {
  const _defaults = {
    enabled:        false,
    duration:       4,
    title:          '',
    artist:         '',
    showLogo:       true,
    style:          'bold',
    transition:     'fade',
    transitionOut:  null,
    titleColor:      '#ffffff',
    artistColor:     '#c0a0ff',
    titleSize:       1.0,
    artistRatio:     0.45,
    useSameTransOut: true,
    mirrorIntro:     true,
    titleFont:       '',
    artistFont:      '',
    titleGlow:       1.0,
    artistGlow:      0.6,
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

  /** Copy visual settings from an intro config object (title, style, colors, etc.) */
  function mirrorFrom(introConfig) {
    set({
      title:          introConfig.title,
      artist:         introConfig.artist,
      showLogo:       introConfig.showLogo,
      style:          introConfig.style,
      transition:     introConfig.transition,
      transitionOut:  introConfig.transitionOut,
      titleColor:     introConfig.titleColor,
      artistColor:    introConfig.artistColor,
      titleSize:      introConfig.titleSize,
      artistRatio:    introConfig.artistRatio,
      useSameTransOut: introConfig.useSameTransOut,
      titleFont:      introConfig.titleFont,
      artistFont:     introConfig.artistFont,
      titleGlow:      introConfig.titleGlow,
      artistGlow:     introConfig.artistGlow,
      titleShadowColor:   introConfig.titleShadowColor,
      titleShadowBlur:    introConfig.titleShadowBlur,
      titleShadowOffsetX: introConfig.titleShadowOffsetX,
      titleShadowOffsetY: introConfig.titleShadowOffsetY,
      artistShadowColor:   introConfig.artistShadowColor,
      artistShadowBlur:    introConfig.artistShadowBlur,
      artistShadowOffsetX: introConfig.artistShadowOffsetX,
      artistShadowOffsetY: introConfig.artistShadowOffsetY,
    });
  }

  return { get, set, reset, mirrorFrom };
})();

export default Outro;
