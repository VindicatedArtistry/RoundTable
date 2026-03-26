'use client';

import { useEffect, useRef } from 'react';

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Particle class
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        this.color = `rgba(168, 85, 247, ${Math.random() * 0.5 + 0.1})`;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Create particles
    const particles: Particle[] = [];
    const particleCount = Math.floor((canvas.width * canvas.height) / 10000);

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Animation loop with organic breathing darkness effect
    let animationFrameId: number;
    let currentPhase: 'darkening' | 'holding-black' | 'lightening' | 'holding-silver' = 'darkening';
    let phaseProgress = 0;
    let frameCount = 0;
    
    const animate = () => {
      if (!ctx) return;
      frameCount++;

      // Organic phase-based breathing system
      let clearingOpacity = 0.02;
      let baseColor = 0;
      
      // Define phase durations (in frames)
      const darkeningDuration = 2400;  // 40 seconds to go dark
      const blackHoldDuration = 2400;   // 40 seconds pure black
      const lighteningDuration = 2400;  // 40 seconds to go silver
      const silverHoldDuration = 2400;  // 40 seconds silver
      
      switch (currentPhase) {
        case 'darkening':
          // Gradually reduce opacity to let it go pure black
          const darkeningProgress = phaseProgress / darkeningDuration;
          clearingOpacity = 0.15 - (darkeningProgress * 0.13); // 0.15 → 0.02
          baseColor = Math.floor(25 - (darkeningProgress * 25)); // 25 → 0
          
          if (phaseProgress >= darkeningDuration) {
            currentPhase = 'holding-black';
            phaseProgress = 0;
          }
          break;
          
        case 'holding-black':
          // Pure pitch black phase - very minimal clearing
          clearingOpacity = 0.02;
          baseColor = 0;
          
          if (phaseProgress >= blackHoldDuration) {
            currentPhase = 'lightening';
            phaseProgress = 0;
          }
          break;
          
        case 'lightening':
          // Gradually increase opacity to create silver wash
          const lighteningProgress = phaseProgress / lighteningDuration;
          clearingOpacity = 0.02 + (lighteningProgress * 0.13); // 0.02 → 0.15
          baseColor = Math.floor(lighteningProgress * 25); // 0 → 25
          
          if (phaseProgress >= lighteningDuration) {
            currentPhase = 'holding-silver';
            phaseProgress = 0;
          }
          break;
          
        case 'holding-silver':
          // Dark silver phase - maximum clearing
          clearingOpacity = 0.15;
          baseColor = 25;
          
          if (phaseProgress >= silverHoldDuration) {
            currentPhase = 'darkening';
            phaseProgress = 0;
          }
          break;
      }
      
      phaseProgress++;
      
      // Apply the organic clearing
      ctx.fillStyle = `rgba(${baseColor}, ${baseColor}, ${baseColor}, ${clearingOpacity})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // Draw connecting lines between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.strokeStyle = `rgba(168, 85, 247, ${1 - distance / 100})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
      }}
    />
  );
}
