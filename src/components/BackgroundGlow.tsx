import React from 'react';

export default function BackgroundGlow() {
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden"
      style={{ backgroundColor: 'var(--bg, #050608)' }}
    >
      {/* 1. Technical Checkbox Grid Pattern (52px cells with rgba(255,255,255,0.035) 1px lines) */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.035) 1px, transparent 1px)
          `,
          backgroundSize: '52px 52px',
          maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)',
        }}
      />

      {/* 2. Soft Radiant Navy-Blue Glow at Top Center */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[640px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(47, 91, 255, 0.22), rgba(10, 17, 40, 0.4) 40%, transparent 75%)',
        }}
      />

      {/* 3. Subtle Four-Point Sparkle Stars (✦) across the Hero */}
      <div 
        className="absolute top-[8%] left-[16%] text-[13px] pointer-events-none select-none font-serif"
        style={{ color: 'rgba(91, 140, 255, 0.4)' }}
      >
        ✦
      </div>
      <div 
        className="absolute top-[14%] right-[20%] text-[11px] pointer-events-none select-none font-serif"
        style={{ color: 'rgba(91, 140, 255, 0.35)' }}
      >
        ✦
      </div>
      <div 
        className="absolute top-[26%] left-[28%] text-[10px] pointer-events-none select-none font-serif"
        style={{ color: 'rgba(91, 140, 255, 0.25)' }}
      >
        ✦
      </div>
      <div 
        className="absolute top-[22%] right-[32%] text-[12px] pointer-events-none select-none font-serif"
        style={{ color: 'rgba(91, 140, 255, 0.3)' }}
      >
        ✦
      </div>
    </div>
  );
}
