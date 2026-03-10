import React from 'react';

export default function Logo({ width = 160, height = 60 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 160 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background gradient definition */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c4dff" />
          <stop offset="100%" stopColor="#b47aff" />
        </linearGradient>
        <linearGradient id="clapperGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9c47ff" />
          <stop offset="100%" stopColor="#6a1fff" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Clapperboard base */}
      <g transform="translate(30, 18)">
        {/* Clapper top - striped */}
        <rect x="0" y="0" width="50" height="8" fill="url(#clapperGradient)" rx="1"/>
        <rect x="0" y="0" width="10" height="8" fill="rgba(255,255,255,0.3)"/>
        <rect x="15" y="0" width="10" height="8" fill="rgba(255,255,255,0.3)"/>
        <rect x="30" y="0" width="10" height="8" fill="rgba(255,255,255,0.3)"/>
        
        {/* Clapper body */}
        <rect x="0" y="8" width="50" height="28" fill="url(#clapperGradient)" rx="2"/>
        
        {/* Clapper details */}
        <rect x="3" y="12" width="44" height="1" fill="rgba(255,255,255,0.2)"/>
        <rect x="3" y="18" width="44" height="1" fill="rgba(255,255,255,0.2)"/>
      </g>
      
      {/* Microphone */}
      <g transform="translate(48, 22)" filter="url(#glow)">
        {/* Mic body */}
        <rect x="0" y="0" width="14" height="20" rx="7" fill="#ec4899"/>
        <rect x="2" y="2" width="10" height="16" rx="5" fill="rgba(255,255,255,0.15)"/>
        
        {/* Mic lines */}
        <line x1="4" y1="6" x2="10" y2="6" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
        <line x1="4" y1="10" x2="10" y2="10" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
        <line x1="4" y1="14" x2="10" y2="14" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
        
        {/* Mic stand */}
        <path d="M 7 20 Q 7 24, 4 26" stroke="#ec4899" strokeWidth="2" fill="none"/>
        <line x1="0" y1="26" x2="14" y2="26" stroke="#ec4899" strokeWidth="2" strokeLinecap="round"/>
      </g>
      
      {/* Text: KARAOKE */}
      <text x="80" y="28" fill="url(#logoGradient)" fontSize="18" fontWeight="700" letterSpacing="1">
        KARAOKE
      </text>
      
      {/* Text: VIDEO MAKER */}
      <text x="80" y="45" fill="#a855f7" fontSize="11" fontWeight="600" letterSpacing="0.5">
        VIDEO MAKER
      </text>
    </svg>
  );
}
