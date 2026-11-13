import React from 'react';

export default function BackgroundGlow() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[#030712]">
      {/* Precision AstSurgeon Tech Grid */}
      <div 
        className="absolute inset-0 bg-grid-pattern opacity-70" 
        style={{ backgroundSize: '48px 48px' }} 
      />

      {/* Subtle Secondary Faint Sub-grid */}
      <div 
        className="absolute inset-0 bg-grid-subtle opacity-40" 
        style={{ backgroundSize: '16px 16px' }} 
      />

      {/* AstSurgeon Technical Cross Coordinate Markers (+) */}
      <div className="tech-cross top-[12%] left-[10%] opacity-40">+</div>
      <div className="tech-cross top-[28%] left-[22%] opacity-35">+</div>
      <div className="tech-cross top-[18%] right-[14%] opacity-40">+</div>
      <div className="tech-cross top-[42%] right-[28%] opacity-35">+</div>
      <div className="tech-cross bottom-[30%] left-[8%] opacity-30">+</div>
      <div className="tech-cross bottom-[18%] left-[40%] opacity-35">+</div>
      <div className="tech-cross bottom-[22%] right-[12%] opacity-35">+</div>
      <div className="tech-cross bottom-[45%] right-[6%] opacity-25">+</div>

      {/* Top Center Constella Navy Glow */}
      <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/12 rounded-full blur-[160px] pointer-events-none" />

      {/* Subtle Right Ambient Deep Sapphire Glow */}
      <div className="absolute top-[35%] -right-[15%] w-[650px] h-[650px] bg-indigo-700/10 rounded-full blur-[170px] pointer-events-none" />

      {/* Bottom Left Deep Constella Cyan/Navy Glow */}
      <div className="absolute -bottom-[20%] -left-[10%] w-[750px] h-[750px] bg-sky-500/8 rounded-full blur-[180px] pointer-events-none" />

      {/* Smooth Vignette Gradient Mask to softly blend edges */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(3,7,18,0.85)_100%)]" />
    </div>
  );
}
