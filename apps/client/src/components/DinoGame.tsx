'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ── Constants ──────────────────────────────────────────
const GROUND_HEIGHT = 24;
const DINO_WIDTH = 40;
const DINO_HEIGHT = 44;
const DINO_X = 60;
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const CACTUS_WIDTH = 20;
const CACTUS_MIN_H = 30;
const CACTUS_MAX_H = 50;
const MIN_SPAWN_INTERVAL = 60;
const MAX_SPAWN_INTERVAL = 150;
const CLOUD_COUNT = 4;

interface Cactus {
  x: number;
  h: number;
}

interface Cloud {
  x: number;
  y: number;
  w: number;
}

// ── Color palettes (monochrome, high contrast) ─────────
const LIGHT = {
  bg: '#fafafa',
  fg: '#18181b',
  fgMid: '#52525b',
  fgLight: '#a1a1aa',
  ground: '#d4d4d8',
  groundLine: '#71717a',
  groundDash: '#a1a1aa',
  eye: '#fafafa',
  cloud: '#e4e4e7',
  dimOverlay: 'rgba(250,250,250,0.6)',
};

const DARK = {
  bg: '#09090b',
  fg: '#f4f4f5',
  fgMid: '#a1a1aa',
  fgLight: '#52525b',
  ground: '#27272a',
  groundLine: '#71717a',
  groundDash: '#3f3f46',
  eye: '#09090b',
  cloud: '#18181b',
  dimOverlay: 'rgba(9,9,11,0.6)',
};

export default function DinoGame({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);
  const stateRef = useRef({
    dinoY: 0,
    velocity: 0,
    jumping: false,
    cacti: [] as Cactus[],
    clouds: [] as Cloud[],
    spawnTimer: 100,
    speed: 5,
    score: 0,
    highScore: 0,
    gameOver: false,
    started: false,
    groundOffset: 0,
    legFrame: 0,
    legTimer: 0,
    canvasW: 600,
    canvasH: 200,
  });

  const [, forceRender] = useState(0);

  const isDark = useCallback(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  }, []);

  const initClouds = useCallback((w: number) => {
    const s = stateRef.current;
    s.clouds = [];
    for (let i = 0; i < CLOUD_COUNT; i++) {
      s.clouds.push({
        x: Math.random() * w,
        y: 15 + Math.random() * 50,
        w: 40 + Math.random() * 35,
      });
    }
  }, []);

  const resetGame = useCallback(() => {
    const s = stateRef.current;
    if (s.score > 0) {
      s.highScore = Math.max(s.highScore, Math.floor(s.score / 5));
    }
    s.dinoY = 0;
    s.velocity = 0;
    s.jumping = false;
    s.cacti = [];
    s.spawnTimer = 100;
    s.speed = 5;
    s.score = 0;
    s.gameOver = false;
    s.started = true;
    s.groundOffset = 0;
    s.legFrame = 0;
    s.legTimer = 0;
    initClouds(s.canvasW);
  }, [initClouds]);

  const jump = useCallback(() => {
    const s = stateRef.current;
    if (s.gameOver) {
      resetGame();
      return;
    }
    if (!s.started) {
      s.started = true;
    }
    if (!s.jumping) {
      s.velocity = JUMP_FORCE;
      s.jumping = true;
    }
  }, [resetGame]);

  // ── Resize handler ───────────────────────────────────
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      const w = Math.floor(rect.width);
      const h = 200;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
      stateRef.current.canvasW = w;
      stateRef.current.canvasH = h;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // ── Init clouds & stars ──────────────────────────────
  useEffect(() => {
    const s = stateRef.current;
    if (s.clouds.length === 0) {
      initClouds(s.canvasW);
    }
  }, [initClouds]);

  // ── Input handlers ───────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [jump]);

  // ── Game loop ────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const drawClouds = (p: typeof LIGHT) => {
      const s = stateRef.current;
      ctx.fillStyle = p.cloud;
      for (const cloud of s.clouds) {
        ctx.beginPath();
        ctx.ellipse(cloud.x, cloud.y, cloud.w / 2, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cloud.x - cloud.w * 0.25, cloud.y + 3, cloud.w * 0.3, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cloud.x + cloud.w * 0.2, cloud.y + 2, cloud.w * 0.25, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawGround = (W: number, H: number, p: typeof LIGHT) => {
      const s = stateRef.current;
      const groundY = H - GROUND_HEIGHT;

      // Top edge line
      ctx.fillStyle = p.groundLine;
      ctx.fillRect(0, groundY, W, 1);

      // Texture dashes
      ctx.fillStyle = p.groundDash;
      const dashW = 20;
      const totalDash = dashW + 15;
      const offset = s.groundOffset % totalDash;
      for (let x = -offset; x < W; x += totalDash) {
        ctx.fillRect(x, groundY + 7, dashW, 1);
      }
      for (let x = -offset + 10; x < W; x += totalDash * 1.7) {
        ctx.fillRect(x, groundY + 14, 8, 1);
      }
    };

    const drawDino = (x: number, baseY: number, p: typeof LIGHT) => {
      const s = stateRef.current;

      // Shadow on ground
      if (s.dinoY < 0) {
        const shadowScale = 1 + s.dinoY / 200;
        ctx.fillStyle = p.fgLight;
        ctx.beginPath();
        ctx.ellipse(
          x + DINO_WIDTH / 2 - 4,
          s.canvasH - GROUND_HEIGHT + 1,
          (DINO_WIDTH / 2) * shadowScale,
          3 * shadowScale,
          0, 0, Math.PI * 2
        );
        ctx.fill();
      }

      ctx.fillStyle = p.fg;

      // Body
      ctx.fillRect(x, baseY, DINO_WIDTH - 8, DINO_HEIGHT - 14);
      // Head
      ctx.fillRect(x + 10, baseY - 14, DINO_WIDTH - 14, 16);
      // Eye
      ctx.fillStyle = p.eye;
      ctx.fillRect(x + DINO_WIDTH - 18, baseY - 10, 4, 4);
      // Tail
      ctx.fillStyle = p.fg;
      ctx.fillRect(x - 6, baseY + 2, 8, 8);
      // Arm
      ctx.fillRect(x + DINO_WIDTH - 12, baseY + 10, 6, 4);

      // Legs (alternate)
      if (s.jumping) {
        ctx.fillRect(x + 4, baseY + DINO_HEIGHT - 14, 6, 14);
        ctx.fillRect(x + 18, baseY + DINO_HEIGHT - 14, 6, 14);
      } else if (s.legFrame === 0) {
        ctx.fillRect(x + 4, baseY + DINO_HEIGHT - 14, 6, 14);
        ctx.fillRect(x + 18, baseY + DINO_HEIGHT - 14, 6, 10);
      } else {
        ctx.fillRect(x + 4, baseY + DINO_HEIGHT - 14, 6, 10);
        ctx.fillRect(x + 18, baseY + DINO_HEIGHT - 14, 6, 14);
      }
    };

    const drawCactus = (c: Cactus, groundY: number, p: typeof LIGHT) => {
      const x = c.x;
      const y = groundY - c.h;

      ctx.fillStyle = p.fg;
      // Main trunk
      ctx.fillRect(x + 6, y, 8, c.h);
      // Left arm
      ctx.fillRect(x, y + 8, 8, 6);
      ctx.fillRect(x, y + 4, 4, 10);
      // Right arm
      ctx.fillRect(x + 12, y + 14, 8, 6);
      ctx.fillRect(x + 16, y + 10, 4, 14);
    };

    const tick = () => {
      if (!running) return;
      const s = stateRef.current;
      const W = s.canvasW;
      const H = s.canvasH;
      const dark = isDark();
      const p = dark ? DARK : LIGHT;
      const groundY = H - GROUND_HEIGHT;

      // ── Clear with bg color ──
      ctx.fillStyle = p.bg;
      ctx.fillRect(0, 0, W, H);

      drawClouds(p);
      drawGround(W, H, p);

      if (!s.started) {
        const dinoBaseY = groundY - DINO_HEIGHT;
        drawDino(DINO_X, dinoBaseY, p);

        ctx.fillStyle = p.fg;
        ctx.font = '600 14px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Press SPACE or tap to start', W / 2, H / 2 - 10);
        ctx.font = '12px ui-monospace, monospace';
        ctx.fillStyle = p.fgMid;
        ctx.fillText('SPACE / TAP = Jump', W / 2, H / 2 + 10);

        frameRef.current = requestAnimationFrame(tick);
        return;
      }

      if (!s.gameOver) {
        // ── Physics ──
        s.velocity += GRAVITY;
        s.dinoY += s.velocity;
        if (s.dinoY >= 0) {
          s.dinoY = 0;
          s.velocity = 0;
          s.jumping = false;
        }

        // Leg animation
        s.legTimer++;
        if (s.legTimer > 6) {
          s.legTimer = 0;
          s.legFrame = s.legFrame === 0 ? 1 : 0;
        }

        // Ground scroll
        s.groundOffset += s.speed;

        // Cloud scroll
        for (const cloud of s.clouds) {
          cloud.x -= s.speed * 0.3;
          if (cloud.x + cloud.w < 0) {
            cloud.x = W + cloud.w;
            cloud.y = 15 + Math.random() * 50;
          }
        }

        // Spawn cacti
        s.spawnTimer--;
        if (s.spawnTimer <= 0) {
          s.cacti.push({
            x: W + 20,
            h: CACTUS_MIN_H + Math.random() * (CACTUS_MAX_H - CACTUS_MIN_H),
          });
          s.spawnTimer =
            MIN_SPAWN_INTERVAL + Math.random() * (MAX_SPAWN_INTERVAL - MIN_SPAWN_INTERVAL);
        }

        // Move cacti
        for (let i = s.cacti.length - 1; i >= 0; i--) {
          s.cacti[i].x -= s.speed;
          if (s.cacti[i].x + CACTUS_WIDTH < 0) {
            s.cacti.splice(i, 1);
          }
        }

        // Score + difficulty
        s.score++;
        if (s.score % 300 === 0) {
          s.speed += 0.3;
        }

        // Collision detection
        const dinoLeft = DINO_X + 4;
        const dinoRight = DINO_X + DINO_WIDTH - 12;
        const dinoBottom = groundY + s.dinoY;

        for (const c of s.cacti) {
          const cLeft = c.x + 2;
          const cRight = c.x + CACTUS_WIDTH - 2;
          const cTop = groundY - c.h;

          if (dinoRight > cLeft && dinoLeft < cRight && dinoBottom > cTop) {
            s.gameOver = true;
            s.highScore = Math.max(s.highScore, Math.floor(s.score / 5));
            forceRender((n) => n + 1);
            break;
          }
        }
      }

      // ── Draw cacti ──
      for (const c of s.cacti) {
        drawCactus(c, groundY, p);
      }

      // ── Draw dino ──
      const dinoBaseY = groundY - DINO_HEIGHT + s.dinoY;
      drawDino(DINO_X, dinoBaseY, p);

      // ── Score ──
      ctx.font = '600 13px ui-monospace, monospace';
      ctx.textAlign = 'right';
      const currentScore = Math.floor(s.score / 5);
      if (s.highScore > 0) {
        ctx.fillStyle = p.fgLight;
        ctx.fillText(`HI ${String(s.highScore).padStart(5, '0')}`, W - 90, 24);
      }
      ctx.fillStyle = p.fgMid;
      ctx.fillText(String(currentScore).padStart(5, '0'), W - 16, 24);

      // ── Game over overlay ──
      if (s.gameOver) {
        ctx.fillStyle = p.dimOverlay;
        ctx.fillRect(0, 0, W, H - GROUND_HEIGHT);

        ctx.fillStyle = p.fg;
        ctx.font = '600 20px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', W / 2, H / 2 - 16);
        ctx.font = '13px ui-monospace, monospace';
        ctx.fillStyle = p.fgMid;
        ctx.fillText(`Score: ${String(Math.floor(s.score / 5)).padStart(5, '0')}`, W / 2, H / 2 + 6);
        ctx.font = '12px ui-monospace, monospace';
        ctx.fillText('Tap or press SPACE to restart', W / 2, H / 2 + 26);
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(frameRef.current);
    };
  }, [isDark]);

  return (
    <div
      ref={containerRef}
      className={className}
      onClick={jump}
      onTouchStart={(e) => {
        e.preventDefault();
        jump();
      }}
      role="button"
      tabIndex={0}
      aria-label="Dinosaur jumping game — press space or tap to jump"
    >
      <canvas
        ref={canvasRef}
        className="block w-full rounded-xl border border-zinc-200/50 dark:border-zinc-800/50"
      />
    </div>
  );
}
