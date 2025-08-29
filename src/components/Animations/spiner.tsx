"use client";
import { useEffect, useRef } from "react";

function BackgroundAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const nodes: { x: number; y: number; vx: number; vy: number }[] = [];
    const nodeCount = 40;

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,0.8)";

      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.strokeStyle = `rgba(255,255,255,${1 - dist / 120})`;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
      });

      requestAnimationFrame(draw);
    }

    draw();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-800 -z-10"
    />
  );
}

function Spinner() {
  return (
    <div className="relative flex h-screen w-full items-center justify-center">
      <BackgroundAnimation />

      <div className="flex items-center gap-3 z-10">

        {/* Gradient filling heart */}
        <svg
          viewBox="0 0 24 24"
          className="w-10 h-10"
          fill="none"
          strokeWidth="2"
        >
          {/* Outline */}
          <path
            className="heart-outline"
            d="M12 21s-6.2-4.6-9-8.5C1 9 3 4 7 4c2.3 0 3.6 1.3 5 3 
               1.4-1.7 2.7-3 5-3 4 0 6 5 4 8.5-2.8 3.9-9 8.5-9 8.5z"
          />

          <defs>
            {/* Clip path for heart shape */}
            <clipPath id="heart-clip">
              <path
                d="M12 21s-6.2-4.6-9-8.5C1 9 3 4 7 4c2.3 0 3.6 1.3 5 3 
                   1.4-1.7 2.7-3 5-3 4 0 6 5 4 8.5-2.8 3.9-9 8.5-9 8.5z"
              />
            </clipPath>

            {/* Gradient definition */}
            <linearGradient id="grad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#00f2fe" />   {/* Aqua */}
              <stop offset="100%" stopColor="#a800ff" /> {/* Purple */}
            </linearGradient>
          </defs>

          {/* Filling with gradient */}
          <rect
            x="0"
            y="0"
            width="24"
            height="24"
            className="fill-heart"
            clipPath="url(#heart-clip)"
            fill="url(#grad)"
          />
        </svg>
                <span className="text-lg font-semibold text-white">Kinnect</span>

      </div>
    </div>
  );
}

export default Spinner;
