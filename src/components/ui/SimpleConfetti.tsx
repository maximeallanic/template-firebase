
import { useEffect, useRef } from 'react';

export function SimpleConfetti() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles: Particle[] = [];
        const colors = ['#ef4444', '#3b82f6', '#eab308', '#22c55e', '#ec4899', '#8b5cf6'];

        class Particle {
            x: number;
            y: number;
            color: string;
            velocity: { x: number; y: number };
            rotation: number;
            rotationSpeed: number;

            constructor() {
                this.x = canvas!.width / 2;
                this.y = canvas!.height / 2;
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.velocity = {
                    x: (Math.random() - 0.5) * 15,
                    y: (Math.random() - 0.5) * 15 - 5
                };
                this.rotation = Math.random() * 360;
                this.rotationSpeed = (Math.random() - 0.5) * 10;
            }

            draw() {
                if (!ctx) return;
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate((this.rotation * Math.PI) / 180);
                ctx.fillStyle = this.color;
                ctx.fillRect(-5, -5, 10, 10);
                ctx.restore();
            }

            update() {
                this.x += this.velocity.x;
                this.y += this.velocity.y;
                this.velocity.y += 0.5; // Gravity
                this.velocity.x *= 0.96; // Friction
                this.rotation += this.rotationSpeed;
            }
        }

        // Create burst
        for (let i = 0; i < 100; i++) {
            particles.push(new Particle());
        }

        // Throttled animation loop (~30fps instead of 60fps for better performance)
        let frameCount = 0;
        let animationId: number;

        const animate = () => {
            if (!ctx || particles.length === 0) return;

            frameCount++;
            // Skip every other frame to achieve ~30fps
            if (frameCount % 2 !== 0) {
                animationId = requestAnimationFrame(animate);
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.update();
                p.draw();

                if (p.y > canvas.height) {
                    particles.splice(i, 1);
                }
            }

            animationId = requestAnimationFrame(animate);
        };

        animate();

        // Cleanup - cancel animation frame when component unmounts
        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[100]"
        />
    );
}
