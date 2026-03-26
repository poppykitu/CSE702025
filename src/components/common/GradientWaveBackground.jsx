import React from 'react'

const GradientWaveBackground = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: -1,
      overflow: 'hidden',
      background: '#F8FAFC', // Crisp white/slate-50 base
    }}>
      <style>{`
        @keyframes float {
          0% { transform: translate(0, 0) scale(1.0); }
          50% { transform: translate(-1.5%, 1.5%) scale(1.02); }
          100% { transform: translate(0, 0) scale(1.0); }
        }
        .wave-layer { animation: float 18s ease-in-out infinite; }
        .wave-layer-alt { animation: float 22s ease-in-out infinite reverse; }
      `}</style>

      {/* Wave Layer 1 (Soft Sky Blue) */}
      <svg className="wave-layer" style={{ position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '100%', opacity: 0.6 }} viewBox="0 0 1440 800" preserveAspectRatio="none">
        <path fill="#E0F2FE" d="M0,224L120,208C240,192,480,160,720,165.3C960,171,1200,213,1320,234.7L1440,256L1440,0L1320,0C1200,0,960,0,720,0C480,0,240,0,120,0L0,0Z" />
      </svg>

      {/* Wave Layer 2 (Lighter Indigo) */}
      <svg className="wave-layer-alt" style={{ position: 'absolute', top: '5%', right: '-10%', width: '130%', height: '100%', opacity: 0.4 }} viewBox="0 0 1440 800" preserveAspectRatio="none">
        <path fill="#EEF2FF" d="M0,64L120,96C240,128,480,192,720,192C960,192,1200,128,1320,96L1440,64L1440,0L1320,0C1200,0,960,0,720,0C480,0,240,0,120,0L0,0Z" />
      </svg>

      {/* Wave Layer 3 (Mint/Emerald - Top Left) */}
      <svg className="wave-layer" style={{ position: 'absolute', top: '-25%', left: '-5%', width: '110%', height: '80%', opacity: 0.5 }} viewBox="0 0 1440 800" preserveAspectRatio="none">
        <path fill="#D1FAE5" d="M0,192L80,213.3C160,235,320,277,480,272C640,267,800,213,960,181.3C1120,149,1280,139,1360,133.3L1440,128L1440,0L1360,0C1280,0,1120,0,960,0C800,0,640,0,480,0C320,0,160,0,80,0L0,0Z" />
      </svg>

      {/* Wave Layer 4 (Soft Cyan - Mid Right) */}
      <svg className="wave-layer-alt" style={{ position: 'absolute', bottom: '10%', right: '-10%', width: '115%', height: '75%', opacity: 0.4 }} viewBox="0 0 1440 800" preserveAspectRatio="none">
        <path fill="#CFFAFE" d="M0,640L120,624C240,608,480,576,720,581.3C960,587,1200,629,1320,650.7L1440,672L1440,800L1320,800C1200,800,960,800,720,800C480,800,240,800,120,800L0,800Z" />
      </svg>

      {/* Wave Layer 5 (Very Light Emerald) */}
      <svg className="wave-layer" style={{ position: 'absolute', bottom: '-15%', left: '-10%', width: '135%', height: '85%', opacity: 0.5 }} viewBox="0 0 1440 800" preserveAspectRatio="none">
        <path fill="#ECFDF5" d="M0,512L120,544C240,576,480,640,720,640C960,640,1200,576,1320,544L1440,512L1440,800L1320,800C1200,800,960,800,720,800C480,800,240,800,120,800L0,800Z" />
      </svg>

      {/* Wave Layer 6 (Pale Sky Blue) */}
      <svg className="wave-layer-alt" style={{ position: 'absolute', bottom: '-5%', width: '155%', height: '65%', opacity: 0.3 }} viewBox="0 0 1440 800" preserveAspectRatio="none">
        <path fill="#F0F9FF" d="M0,608L120,586.7C240,565,480,523,720,538.7C960,555,1200,629,1320,666.7L1440,704L1440,800L1320,800C1200,800,960,800,720,800C480,800,240,800,120,800L0,800Z" />
      </svg>

      {/* Glow Blobs (More subtle in Light Mode) */}
      <div style={{ position: 'absolute', top: '15%', left: '15%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0) 70%)', filter: 'blur(100px)' }} />
      <div style={{ position: 'absolute', bottom: '15%', right: '15%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0) 70%)', filter: 'blur(120px)' }} />
      
      {/* Texture mask - lighter overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(225deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.4) 100%)' }} />
    </div>
  )
}

export default GradientWaveBackground
