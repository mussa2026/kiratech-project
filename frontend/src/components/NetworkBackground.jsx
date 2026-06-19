import { useEffect, useRef } from 'react';

/**
 * Animated blue network/particle canvas background.
 * Draws nodes connected by lines — cybersecurity digital style.
 */
export default function NetworkBackground({ className = '', nodeCount = 55, opacity = 1 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animId;
    const nodes = [];
    const MAX_DIST = 160;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialise nodes
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x:  Math.random() * canvas.width,
        y:  Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r:  Math.random() * 2 + 1.5,
        pulse: Math.random() * Math.PI * 2, // phase offset for glow pulse
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update positions
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        n.pulse += 0.03;
        if (n.x < 0 || n.x > canvas.width)  n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx   = nodes[i].x - nodes[j].x;
          const dy   = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            const alpha = (1 - dist / MAX_DIST) * 0.45;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(96, 165, 250, ${alpha})`; // blue-400
            ctx.lineWidth = 0.8;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach((n) => {
        const glow  = 0.6 + 0.4 * Math.sin(n.pulse);
        const outerR = n.r + 3 * glow;

        // Outer glow ring
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, outerR * 2.5);
        grad.addColorStop(0, `rgba(59, 130, 246, ${0.5 * glow})`);
        grad.addColorStop(1, 'rgba(59, 130, 246, 0)');
        ctx.beginPath();
        ctx.fillStyle = grad;
        ctx.arc(n.x, n.y, outerR * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.fillStyle = `rgba(147, 197, 253, ${0.8 + 0.2 * glow})`; // blue-300
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [nodeCount]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    />
  );
}
