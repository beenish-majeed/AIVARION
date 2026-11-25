import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
}

export const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Respect user motion preferences
    if (typeof window === 'undefined') return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const margin = 80;
    let width = (canvas.width = (canvas.parentElement?.clientWidth || window.innerWidth) + margin * 2);
    let height = (canvas.height = (canvas.parentElement?.clientHeight || window.innerHeight) + margin * 2);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = (canvas.parentElement?.clientWidth || window.innerWidth) + margin * 2;
      height = canvas.height = (canvas.parentElement?.clientHeight || window.innerHeight) + margin * 2;
    };

    window.addEventListener('resize', handleResize);

    // Particle colors adhering strictly to brand palette: white, neutral grey, and hot pink
    const brandColors = [
      'rgba(255, 255, 255, 0.35)',
      'rgba(255, 45, 168, 0.45)',
      'rgba(255, 45, 168, 0.25)',
      'rgba(244, 244, 245, 0.2)',
    ];

    const particleCount = Math.min(55, Math.floor((width * height) / 22000));
    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.6 + 0.6,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.6 + 0.2,
      color: brandColors[Math.floor(Math.random() * brandColors.length)],
    }));

    let mouseX = -1000;
    let mouseY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around bounds
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Magnetic cursor pull & glowing highlight ("animation like a magnetic")
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const magnetRadius = 140;

        let drawRadius = p.radius;
        let drawColor = p.color;

        if (dist < magnetRadius) {
          const magnetForce = (magnetRadius - dist) / magnetRadius;
          // Magnetically pull particle smoothly towards the cursor
          p.x += (dx / dist) * magnetForce * 1.6;
          p.y += (dy / dist) * magnetForce * 1.6;

          // Highlight dot with glowing Hot Pink & increased scale
          drawRadius = p.radius * (1 + magnetForce * 1.4);
          drawColor = `rgba(255, 45, 168, ${Math.min(1, 0.4 + magnetForce * 0.6)})`;
          ctx.shadowColor = '#FF2DA8';
          ctx.shadowBlur = 14 * magnetForce;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, drawRadius, 0, Math.PI * 2);
        ctx.fillStyle = drawColor;
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute -inset-10 w-[calc(100%+80px)] h-[calc(100%+80px)] pointer-events-none z-0 opacity-70"
    />
  );
};

export default ParticleBackground;
