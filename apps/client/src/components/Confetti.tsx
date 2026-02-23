'use client';

import { useEffect, useRef } from 'react';

const PARTICLE_COUNT = 80;
const COLORS = [
  '#f43f5e', // rose
  '#8b5cf6', // violet
  '#3b82f6', // blue
  '#22c55e', // green
  '#eab308', // yellow
  '#f97316', // orange
  '#ec4899', // pink
  '#06b6d4', // cyan
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  color: string;
  rotation: number;
  rotSpeed: number;
  gravity: number;
  opacity: number;
  decay: number;
}

export default function Confetti({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const W = Math.floor(rect.width);
    const H = Math.floor(rect.height);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = 4 + Math.random() * 8;
      particles.push({
        x: W / 2 + (Math.random() - 0.5) * W * 0.4,
        y: H * 0.5 + Math.random() * 20,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 3,
        vy: Math.sin(angle) * speed - Math.random() * 2,
        w: 4 + Math.random() * 6,
        h: 6 + Math.random() * 10,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        gravity: 0.12 + Math.random() * 0.08,
        opacity: 1,
        decay: 0.003 + Math.random() * 0.004,
      });
    }

    let frame = 0;
    let running = true;

    const tick = () => {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);

      let alive = 0;
      for (const p of particles) {
        if (p.opacity <= 0) continue;
        alive++;

        p.x += p.vx;
        p.vy += p.gravity;
        p.y += p.vy;
        p.vx *= 0.99;
        p.rotation += p.rotSpeed;
        p.opacity -= p.decay;

        if (p.opacity <= 0) continue;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      frame++;
      if (alive > 0) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
    return () => {
      running = false;
    };
  }, []);

  return (
    <div ref={containerRef} className={`pointer-events-none ${className || ''}`}>
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
