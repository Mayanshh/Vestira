import React, { useEffect, useRef, useCallback } from 'react';

const ConfettiEffect = ({ isActive, onComplete }) => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const particlesRef = useRef([]);

  const createParticle = useCallback(() => {
    return {
      x: Math.random() * window.innerWidth,
      y: -10,
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * 8 + 2,
      gravity: 0.3,
      life: 1,
      decay: Math.random() * 0.008 + 0.003, // Slower decay for longer visibility
      size: Math.random() * 8 + 4,
      color: `hsl(${Math.random() * 360}, 80%, 60%)`,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      shape: Math.floor(Math.random() * 3), // 0: circle, 1: square, 2: triangle
    };
  }, []);

  const drawParticle = useCallback((ctx, particle) => {
    ctx.save();
    ctx.globalAlpha = particle.life;
    ctx.fillStyle = particle.color;
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation);

    switch (particle.shape) {
      case 0: // Circle
        ctx.beginPath();
        ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 1: // Square
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        break;
      case 2: // Triangle
        ctx.beginPath();
        ctx.moveTo(0, -particle.size / 2);
        ctx.lineTo(-particle.size / 2, particle.size / 2);
        ctx.lineTo(particle.size / 2, particle.size / 2);
        ctx.closePath();
        ctx.fill();
        break;
    }

    ctx.restore();
  }, []);

  const updateParticle = useCallback((particle) => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += particle.gravity;
    particle.vx *= 0.99; // Air resistance
    particle.life -= particle.decay;
    particle.rotation += particle.rotationSpeed;

    return particle.life > 0 && particle.y < window.innerHeight + 50;
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter(particle => {
      if (updateParticle(particle)) {
        drawParticle(ctx, particle);
        return true;
      }
      return false;
    });

    // Continue animation if particles exist
    if (particlesRef.current.length > 0) {
      animationFrameRef.current = requestAnimationFrame(animate);
    } else if (onComplete) {
      onComplete();
    }
  }, [updateParticle, drawParticle, onComplete]);

  const startConfetti = useCallback(() => {
    // Create burst of particles
    const particleCount = 120; // More particles for better effect
    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push(createParticle());
    }

    // Start animation
    animate();
  }, [createParticle, animate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isActive) {
      startConfetti();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      particlesRef.current = [];
    };
  }, [isActive, startConfetti]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ 
        mixBlendMode: 'normal',
        zIndex: 99999, // Even higher z-index to ensure visibility
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none'
      }}
    />
  );
};

export default ConfettiEffect;