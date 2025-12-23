import { useEffect, useRef, useCallback } from 'react';

interface SimpleConfettiProps {
    /** Custom colors for confetti particles */
    colors?: string[];
    /** Continuous mode - relaunches particles every few seconds (for victory screen) */
    continuous?: boolean;
    /** Number of particles per burst (default: 100) */
    intensity?: number;
}

// Default rainbow colors
const DEFAULT_COLORS = ['#ef4444', '#3b82f6', '#eab308', '#22c55e', '#ec4899', '#8b5cf6'];

export function SimpleConfetti({
    colors = DEFAULT_COLORS,
    continuous = false,
    intensity = 100,
}: SimpleConfettiProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animationIdRef = useRef<number | null>(null);

    const createParticles = useCallback((canvas: HTMLCanvasElement, count: number, particleColors: string[]) => {
        const newParticles: Particle[] = [];
        for (let i = 0; i < count; i++) {
            newParticles.push(new Particle(canvas, particleColors));
        }
        return newParticles;
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Initial burst
        particlesRef.current = createParticles(canvas, intensity, colors);

        // Continuous mode - relaunch particles periodically
        let continuousInterval: ReturnType<typeof setInterval> | null = null;
        if (continuous) {
            continuousInterval = setInterval(() => {
                const newParticles = createParticles(canvas, Math.floor(intensity * 0.5), colors);
                particlesRef.current.push(...newParticles);
            }, 2500);
        }

        // Throttled animation loop (~30fps)
        let frameCount = 0;

        const animate = () => {
            if (!ctx) return;

            frameCount++;
            if (frameCount % 2 !== 0) {
                animationIdRef.current = requestAnimationFrame(animate);
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const particles = particlesRef.current;
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.update();
                p.draw(ctx);

                // Remove particles that fell off screen (unless continuous mode keeps them flowing)
                if (p.y > canvas.height + 50) {
                    particles.splice(i, 1);
                }
            }

            // Keep animating if continuous or particles remain
            if (continuous || particles.length > 0) {
                animationIdRef.current = requestAnimationFrame(animate);
            }
        };

        animate();

        // Handle window resize
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        return () => {
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
            if (continuousInterval) {
                clearInterval(continuousInterval);
            }
            window.removeEventListener('resize', handleResize);
        };
    }, [colors, continuous, intensity, createParticles]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[100]"
        />
    );
}

// Particle class moved outside component to avoid recreation
class Particle {
    x: number;
    y: number;
    color: string;
    velocity: { x: number; y: number };
    rotation: number;
    rotationSpeed: number;
    size: number;
    shape: 'rect' | 'circle';

    constructor(canvas: HTMLCanvasElement, colors: string[]) {
        // Spawn from top with spread, or from center for initial burst
        const fromTop = Math.random() > 0.3;
        this.x = fromTop
            ? Math.random() * canvas.width
            : canvas.width / 2 + (Math.random() - 0.5) * 200;
        this.y = fromTop
            ? -20
            : canvas.height / 2;

        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.velocity = {
            x: (Math.random() - 0.5) * (fromTop ? 4 : 15),
            y: fromTop
                ? Math.random() * 3 + 2
                : (Math.random() - 0.5) * 15 - 5,
        };
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 10;
        this.size = Math.random() * 6 + 4;
        this.shape = 'circle';
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.fillStyle = this.color;

        if (this.shape === 'rect') {
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.y += 0.3; // Gravity (slightly less for floatier effect)
        this.velocity.x *= 0.98; // Friction
        this.rotation += this.rotationSpeed;
    }
}
