import React from 'react';

export default function BackgroundGlow() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[#000000]">
      {/* Precision Modern SaaS Checkbox Grid (Square boxes / checkboxes) */}
      <div 
        className="absolute inset-0 bg-grid-pattern opacity-80" 
        style={{ backgroundSize: '40px 40px' }} 
      />

      {/* Subtle Secondary Checkbox Sub-grid */}
      <div 
        className="absolute inset-0 bg-grid-subtle opacity-50" 
        style={{ backgroundSize: '20px 20px' }} 
      />

      {/* Modern SaaS Technical Cross Coordinate Markers (+) */}
      <div className="tech-cross top-[10%] left-[8%] opacity-50">+</div>
      <div className="tech-cross top-[25%] left-[20%] opacity-45">+</div>
      <div className="tech-cross top-[15%] right-[12%] opacity-50">+</div>
      <div className="tech-cross top-[40%] right-[25%] opacity-45">+</div>
      <div className="tech-cross bottom-[32%] left-[10%] opacity-40">+</div>
      <div className="tech-cross bottom-[16%] left-[38%] opacity-45">+</div>
      <div className="tech-cross bottom-[20%] right-[14%] opacity-45">+</div>
      <div className="tech-cross bottom-[48%] right-[8%] opacity-35">+</div>

      {/* Top Center Radiant Royal Blue Glow */}
      <div className="absolute -top-[25%] left-1/2 -translate-x-1/2 w-[1100px] h-[650px] bg-blue-600/18 rounded-full blur-[160px] pointer-events-none" />

      {/* Ambient Deep Cobalt Glow (Right) */}
      <div className="absolute top-[35%] -right-[15%] w-[700px] h-[700px] bg-blue-700/12 rounded-full blur-[170px] pointer-events-none" />

      {/* Ambient Deep Navy Blue Glow (Bottom Left) */}
      <div className="absolute -bottom-[20%] -left-[10%] w-[800px] h-[800px] bg-indigo-700/14 rounded-full blur-[180px] pointer-events-none" />

      {/* Smooth Edge Vignette to blend into pure black */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.92)_100%)]" />
    </div>
  );
}
