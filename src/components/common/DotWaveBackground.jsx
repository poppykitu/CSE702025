import { useEffect, useRef } from 'react'

const DotWaveBackground = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let animationFrameId
    let count = 0

    const SEPARATION = 40
    const AMOUNTX = 60
    const AMOUNTY = 40

    const particles = []

    // Initialize particles
    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        particles.push({
          x: ix * SEPARATION - (AMOUNTX * SEPARATION) / 2,
          y: 0,
          z: iy * SEPARATION - (AMOUNTY * SEPARATION) / 2,
        })
      }
    }

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', resize)
    resize()

    const render = () => {
      ctx.fillStyle = '#F8FAFC' // Light background
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      ctx.beginPath()
      
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        
        // Calculate dynamic Y based on sine waves
        const iy = Math.floor(i % AMOUNTY)
        const ix = Math.floor(i / AMOUNTY)
        
        // Wave math
        const yOffset = (Math.sin((ix + count) * 0.3) * 50) +
                        (Math.sin((iy + count) * 0.5) * 50)
        
        // Projection (simple 3D to 2D)
        const scale = 1000 / (1000 + p.z)
        const screenX = centerX + p.x * scale
        const screenY = centerY + (p.y + yOffset) * scale
        
        // Dot size based on depth
        const dotSize = Math.max(0.5, 2 * scale)
        
        // Dot opacity based on depth
        const opacity = Math.max(0.1, scale * 0.6)
        
        ctx.fillStyle = `rgba(30, 41, 59, ${opacity})` // Slate-800 color
        ctx.beginPath()
        ctx.arc(screenX, screenY, dotSize, 0, Math.PI * 2)
        ctx.fill()
      }

      count += 0.03
      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        background: '#F8FAFC'
      }}
    />
  )
}

export default DotWaveBackground
