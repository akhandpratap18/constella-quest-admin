import React from 'react';

export default function BackgroundGlow() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[#030604]">
      {/* Sleek Checked Square Grid */}
      <div 
        className="absolute inset-0 bg-grid-pattern opacity-60" 
        style={{ backgroundSize: '40px 40px' }} 
      />

      {/* Top Center Emerald Sunburst */}
      <div className="absolute -top-[25%] left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Subtle Right Ambient Green Glow */}
      <div className="absolute top-[40%] -right-[15%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Bottom Left Deep Jade Glow */}
      <div className="absolute -bottom-[20%] -left-[10%] w-[700px] h-[700px] bg-[#00f59b]/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Subtle Vignette Gradient Mask to smooth grid edges */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(3,6,4,0.7)_100%)]" />
    </div>
  );
}
