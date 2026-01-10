/**
 * Bonk Alarm - Animation System
 * Minimalist line art animation of alarm clock attacking sleeper
 */

class AlarmAnimation {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.isRunning = false;
        this.animationId = null;

        // Animation state
        this.phase = 'idle'; // idle, vibrating, launching, flying, impact, reaction
        this.phaseTime = 0;
        this.startTime = 0;

        // Scene objects
        this.clock = {
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            vibrateOffset: 0
        };

        this.cord = {
            attached: true,
            segments: []
        };

        this.figure = {
            headY: 0,
            eyesOpen: 0,
            mouthOpen: 0,
            startled: false,
            headTilt: 0
        };

        // Scene dimensions (will be calculated)
        this.scene = {};

        // Colors
        this.colors = {
            bg: '#0d0d1a',
            line: '#f0f0f5',
            lineDim: '#555577',
            accent: '#6366f1',
            blanket: '#252542'
        };

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);

        this.width = rect.width;
        this.height = rect.height;

        // Calculate scene layout
        this.calculateScene();
    }

    calculateScene() {
        const w = this.width;
        const h = this.height;

        // Bed takes up bottom portion of screen
        const bedHeight = h * 0.25;
        const bedY = h * 0.65;
        const bedWidth = w * 0.75;
        const bedX = (w - bedWidth) / 2;

        // Nightstand to the right of bed
        const nightstandWidth = w * 0.15;
        const nightstandHeight = bedHeight * 0.6;
        const nightstandX = bedX + bedWidth + 10;
        const nightstandY = bedY + bedHeight - nightstandHeight;

        // Clock on nightstand
        const clockSize = Math.min(nightstandWidth * 0.7, 50);

        // Figure in bed (head position)
        const headX = bedX + bedWidth * 0.25;
        const headY = bedY - 20;
        const headRadius = Math.min(w * 0.08, 40);

        this.scene = {
            bed: { x: bedX, y: bedY, width: bedWidth, height: bedHeight },
            nightstand: { x: nightstandX, y: nightstandY, width: nightstandWidth, height: nightstandHeight },
            clockStart: { x: nightstandX + nightstandWidth / 2, y: nightstandY - clockSize / 2 - 5 },
            clockSize: clockSize,
            head: { x: headX, y: headY, radius: headRadius },
            pillow: { x: headX - headRadius * 1.5, y: headY - headRadius * 0.3, width: headRadius * 3, height: headRadius * 1.2 }
        };

        // Initialize clock position
        this.clock.x = this.scene.clockStart.x;
        this.clock.y = this.scene.clockStart.y;

        // Initialize cord
        this.initCord();
    }

    initCord() {
        // Cord goes from clock down to outlet on wall
        const outletX = this.scene.nightstand.x + this.scene.nightstand.width - 5;
        const outletY = this.scene.nightstand.y + this.scene.nightstand.height * 0.8;

        this.cord.segments = [];
        const segments = 8;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            this.cord.segments.push({
                x: this.scene.clockStart.x + (outletX - this.scene.clockStart.x) * t,
                y: this.scene.clockStart.y + (outletY - this.scene.clockStart.y) * t + Math.sin(t * Math.PI) * 15,
                baseY: this.scene.clockStart.y + (outletY - this.scene.clockStart.y) * t + Math.sin(t * Math.PI) * 15
            });
        }
        this.cord.outletX = outletX;
        this.cord.outletY = outletY;
    }

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.phase = 'vibrating';
        this.phaseTime = 0;
        this.startTime = performance.now();

        // Reset states
        this.clock.x = this.scene.clockStart.x;
        this.clock.y = this.scene.clockStart.y;
        this.clock.rotation = 0;
        this.clock.scale = 1;
        this.cord.attached = true;
        this.figure.eyesOpen = 0;
        this.figure.mouthOpen = 0;
        this.figure.startled = false;
        this.figure.headTilt = 0;

        this.initCord();
        this.animate();
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.phase = 'idle';
    }

    animate() {
        if (!this.isRunning) return;

        const now = performance.now();
        const elapsed = now - this.startTime;
        this.phaseTime += 16; // Approximate frame time

        this.update(elapsed);
        this.draw();

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    update(elapsed) {
        switch (this.phase) {
            case 'vibrating':
                this.updateVibrating();
                break;
            case 'launching':
                this.updateLaunching();
                break;
            case 'flying':
                this.updateFlying();
                break;
            case 'impact':
                this.updateImpact();
                break;
            case 'reaction':
                this.updateReaction();
                break;
        }
    }

    updateVibrating() {
        // Vibrate for 2 seconds before launching
        const intensity = Math.min(this.phaseTime / 1000, 1) * 5;
        this.clock.vibrateOffset = Math.sin(this.phaseTime * 0.5) * intensity;
        this.clock.rotation = Math.sin(this.phaseTime * 0.3) * 0.1 * intensity;

        // Cord wiggles with clock
        this.cord.segments[0].x = this.scene.clockStart.x + this.clock.vibrateOffset;

        if (this.phaseTime > 2000) {
            this.phase = 'launching';
            this.phaseTime = 0;
            alarmAudio.playWhoosh();
        }
    }

    updateLaunching() {
        // Wind up before launch (brief pause then rapid acceleration)
        const t = this.phaseTime / 300; // 300ms launch

        if (t < 0.3) {
            // Pull back slightly
            this.clock.x = this.scene.clockStart.x + t * -10;
            this.clock.scale = 1 + t * 0.2;
        } else if (t < 1) {
            // Launch!
            const launchT = (t - 0.3) / 0.7;
            this.clock.x = this.scene.clockStart.x + launchT * 30;
            this.clock.y = this.scene.clockStart.y - launchT * 20;
            this.clock.rotation = launchT * 0.5;

            // Cord stretches
            this.cord.segments[0].x = this.clock.x;
            this.cord.segments[0].y = this.clock.y;
        }

        if (this.phaseTime > 300) {
            this.phase = 'flying';
            this.phaseTime = 0;
            this.cord.attached = false;

            // Set up flight trajectory
            this.flight = {
                startX: this.clock.x,
                startY: this.clock.y,
                endX: this.scene.head.x + this.scene.head.radius * 0.5,
                endY: this.scene.head.y,
                peakHeight: Math.min(this.height * 0.3, 150)
            };
        }
    }

    updateFlying() {
        // Parabolic arc across screen
        const duration = 800; // 800ms flight
        const t = Math.min(this.phaseTime / duration, 1);

        // Bezier curve for arc
        const { startX, startY, endX, endY, peakHeight } = this.flight;
        const midX = (startX + endX) / 2;
        const midY = Math.min(startY, endY) - peakHeight;

        // Quadratic bezier
        const mt = 1 - t;
        this.clock.x = mt * mt * startX + 2 * mt * t * midX + t * t * endX;
        this.clock.y = mt * mt * startY + 2 * mt * t * midY + t * t * endY;

        // Spin during flight
        this.clock.rotation = t * Math.PI * 4;

        // Slight scale change for depth effect
        this.clock.scale = 1 + Math.sin(t * Math.PI) * 0.3;

        // Update cord (falling after disconnect)
        this.updateFallingCord(t);

        if (t >= 1) {
            this.phase = 'impact';
            this.phaseTime = 0;
            alarmAudio.playBonk();
        }
    }

    updateFallingCord(t) {
        // Cord falls and goes limp after detaching
        for (let i = 0; i < this.cord.segments.length; i++) {
            const seg = this.cord.segments[i];
            const fallFactor = (1 - i / this.cord.segments.length) * t;
            seg.y = seg.baseY + fallFactor * 50 + Math.sin(t * 10 + i) * 5 * (1 - t);
        }
    }

    updateImpact() {
        // Impact effect - clock bounces back, figure startles
        const t = Math.min(this.phaseTime / 300, 1);

        // Clock bounces back and falls
        this.clock.x = this.flight.endX - t * 30;
        this.clock.y = this.flight.endY + t * t * 100;
        this.clock.rotation += 0.2;

        // Figure reacts
        this.figure.startled = true;
        this.figure.eyesOpen = Math.min(t * 2, 1);
        this.figure.headTilt = Math.sin(t * Math.PI * 4) * 0.2 * (1 - t);

        if (t >= 1) {
            this.phase = 'reaction';
            this.phaseTime = 0;
        }
    }

    updateReaction() {
        // Figure fully wakes up, eyes wide
        const t = Math.min(this.phaseTime / 500, 1);

        this.figure.eyesOpen = 1;
        this.figure.mouthOpen = 0.5 + Math.sin(this.phaseTime * 0.01) * 0.2;

        // Clock continues falling off screen
        this.clock.y += 2;
        this.clock.rotation += 0.1;

        // Loop back to vibrating after reaction (clock respawns)
        if (this.phaseTime > 2000) {
            this.phase = 'vibrating';
            this.phaseTime = 0;
            this.clock.x = this.scene.clockStart.x;
            this.clock.y = this.scene.clockStart.y;
            this.clock.rotation = 0;
            this.clock.scale = 1;
            this.cord.attached = true;
            this.figure.startled = false;
            this.figure.eyesOpen = 0;
            this.figure.mouthOpen = 0;
            this.initCord();
        }
    }

    draw() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        // Clear
        ctx.fillStyle = this.colors.bg;
        ctx.fillRect(0, 0, w, h);

        // Set line style
        ctx.strokeStyle = this.colors.line;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw scene elements
        this.drawBed();
        this.drawNightstand();
        this.drawFigure();
        this.drawCord();
        this.drawClock();
    }

    drawBed() {
        const ctx = this.ctx;
        const bed = this.scene.bed;
        const pillow = this.scene.pillow;

        // Bed frame
        ctx.strokeStyle = this.colors.line;
        ctx.beginPath();
        ctx.rect(bed.x, bed.y, bed.width, bed.height);
        ctx.stroke();

        // Headboard
        ctx.beginPath();
        ctx.moveTo(bed.x, bed.y);
        ctx.lineTo(bed.x, bed.y - 40);
        ctx.lineTo(bed.x + bed.width * 0.4, bed.y - 40);
        ctx.lineTo(bed.x + bed.width * 0.4, bed.y);
        ctx.stroke();

        // Pillow
        ctx.beginPath();
        ctx.ellipse(pillow.x + pillow.width / 2, pillow.y + pillow.height / 2,
            pillow.width / 2, pillow.height / 2, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Blanket (wavy line across bed)
        ctx.fillStyle = this.colors.blanket;
        ctx.beginPath();
        ctx.moveTo(bed.x, bed.y + 20);
        for (let x = bed.x; x <= bed.x + bed.width; x += 20) {
            ctx.lineTo(x, bed.y + 15 + Math.sin(x * 0.05) * 5);
        }
        ctx.lineTo(bed.x + bed.width, bed.y + bed.height);
        ctx.lineTo(bed.x, bed.y + bed.height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    drawNightstand() {
        const ctx = this.ctx;
        const ns = this.scene.nightstand;

        ctx.strokeStyle = this.colors.line;

        // Nightstand body
        ctx.beginPath();
        ctx.rect(ns.x, ns.y, ns.width, ns.height);
        ctx.stroke();

        // Drawer
        ctx.beginPath();
        ctx.rect(ns.x + 5, ns.y + ns.height * 0.3, ns.width - 10, ns.height * 0.3);
        ctx.stroke();

        // Drawer handle
        ctx.beginPath();
        ctx.moveTo(ns.x + ns.width * 0.4, ns.y + ns.height * 0.45);
        ctx.lineTo(ns.x + ns.width * 0.6, ns.y + ns.height * 0.45);
        ctx.stroke();

        // Outlet on wall (if cord attached)
        if (this.cord.attached || this.phase === 'launching') {
            ctx.beginPath();
            ctx.rect(this.cord.outletX - 8, this.cord.outletY - 5, 16, 10);
            ctx.stroke();
        }
    }

    drawFigure() {
        const ctx = this.ctx;
        const head = this.scene.head;
        const figure = this.figure;

        ctx.save();
        ctx.translate(head.x, head.y);
        ctx.rotate(figure.headTilt);

        ctx.strokeStyle = this.colors.line;

        // Head
        ctx.beginPath();
        ctx.arc(0, 0, head.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Eyes
        const eyeY = -head.radius * 0.1;
        const eyeSpacing = head.radius * 0.35;
        const eyeHeight = head.radius * 0.15 * figure.eyesOpen;

        if (figure.eyesOpen > 0.1) {
            // Open eyes
            ctx.beginPath();
            ctx.ellipse(-eyeSpacing, eyeY, head.radius * 0.12, eyeHeight, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(eyeSpacing, eyeY, head.radius * 0.12, eyeHeight, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Pupils
            if (figure.eyesOpen > 0.5) {
                ctx.fillStyle = this.colors.line;
                ctx.beginPath();
                ctx.arc(-eyeSpacing, eyeY, head.radius * 0.05, 0, Math.PI * 2);
                ctx.arc(eyeSpacing, eyeY, head.radius * 0.05, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            // Closed eyes (sleeping)
            ctx.beginPath();
            ctx.moveTo(-eyeSpacing - head.radius * 0.1, eyeY);
            ctx.lineTo(-eyeSpacing + head.radius * 0.1, eyeY);
            ctx.moveTo(eyeSpacing - head.radius * 0.1, eyeY);
            ctx.lineTo(eyeSpacing + head.radius * 0.1, eyeY);
            ctx.stroke();
        }

        // Mouth
        const mouthY = head.radius * 0.35;
        if (figure.mouthOpen > 0.2) {
            // Surprised O mouth
            ctx.beginPath();
            ctx.ellipse(0, mouthY, head.radius * 0.15, head.radius * 0.2 * figure.mouthOpen, 0, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // Sleeping mouth (slight smile)
            ctx.beginPath();
            ctx.arc(0, mouthY - 5, head.radius * 0.2, 0.2, Math.PI - 0.2);
            ctx.stroke();
        }

        // Z's if sleeping
        if (!figure.startled && this.phase !== 'idle') {
            this.drawZzz(ctx, head.radius);
        }

        ctx.restore();
    }

    drawZzz(ctx, radius) {
        ctx.save();
        ctx.strokeStyle = this.colors.lineDim;
        ctx.lineWidth = 1.5;

        const time = this.phaseTime * 0.002;
        const baseX = radius * 1.2;
        const baseY = -radius * 0.8;

        for (let i = 0; i < 3; i++) {
            const offset = i * 15;
            const floatY = Math.sin(time + i) * 5;
            const alpha = 0.3 + (i * 0.2);

            ctx.globalAlpha = alpha;
            ctx.font = `${12 + i * 4}px sans-serif`;
            ctx.fillStyle = this.colors.lineDim;
            ctx.fillText('z', baseX + offset, baseY - offset + floatY);
        }

        ctx.globalAlpha = 1;
        ctx.restore();
    }

    drawCord() {
        const ctx = this.ctx;

        ctx.strokeStyle = this.colors.lineDim;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(this.cord.segments[0].x, this.cord.segments[0].y);

        for (let i = 1; i < this.cord.segments.length; i++) {
            const seg = this.cord.segments[i];
            ctx.lineTo(seg.x, seg.y);
        }

        ctx.stroke();

        // Plug at end if detached
        if (!this.cord.attached) {
            const firstSeg = this.cord.segments[0];
            ctx.fillStyle = this.colors.line;
            ctx.beginPath();
            ctx.rect(firstSeg.x - 4, firstSeg.y - 6, 8, 12);
            ctx.fill();
        }
    }

    drawClock() {
        const ctx = this.ctx;
        const size = this.scene.clockSize;

        ctx.save();
        ctx.translate(this.clock.x + this.clock.vibrateOffset, this.clock.y);
        ctx.rotate(this.clock.rotation);
        ctx.scale(this.clock.scale, this.clock.scale);

        // Clock body
        ctx.strokeStyle = this.colors.line;
        ctx.lineWidth = 2;

        // Classic alarm clock shape
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.stroke();

        // Clock face inner circle
        ctx.beginPath();
        ctx.arc(0, 0, size / 2 - 4, 0, Math.PI * 2);
        ctx.stroke();

        // Bells on top
        const bellRadius = size * 0.18;
        ctx.beginPath();
        ctx.arc(-size * 0.3, -size * 0.4, bellRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(size * 0.3, -size * 0.4, bellRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Hammer between bells
        ctx.beginPath();
        ctx.arc(0, -size * 0.55, bellRadius * 0.4, 0, Math.PI * 2);
        ctx.stroke();

        // Clock hands
        ctx.lineWidth = 2;
        // Hour hand
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -size * 0.2);
        ctx.stroke();
        // Minute hand
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(size * 0.25, -size * 0.1);
        ctx.stroke();

        // Center dot
        ctx.fillStyle = this.colors.line;
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        // Feet
        ctx.strokeStyle = this.colors.line;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-size * 0.3, size * 0.45);
        ctx.lineTo(-size * 0.35, size * 0.55);
        ctx.moveTo(size * 0.3, size * 0.45);
        ctx.lineTo(size * 0.35, size * 0.55);
        ctx.stroke();

        // Cord attachment point (bottom)
        if (this.cord.attached) {
            ctx.beginPath();
            ctx.arc(0, size * 0.45, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // Motion lines during flight
        if (this.phase === 'flying') {
            this.drawMotionLines();
        }
    }

    drawMotionLines() {
        const ctx = this.ctx;
        ctx.strokeStyle = this.colors.lineDim;
        ctx.lineWidth = 1;

        const numLines = 4;
        for (let i = 0; i < numLines; i++) {
            const angle = this.clock.rotation + Math.PI + (i - numLines / 2) * 0.2;
            const startDist = this.scene.clockSize * 0.6;
            const length = 20 + i * 5;

            ctx.beginPath();
            ctx.moveTo(
                this.clock.x + Math.cos(angle) * startDist,
                this.clock.y + Math.sin(angle) * startDist
            );
            ctx.lineTo(
                this.clock.x + Math.cos(angle) * (startDist + length),
                this.clock.y + Math.sin(angle) * (startDist + length)
            );
            ctx.stroke();
        }
    }
}

// Will be initialized when animation screen is shown
let alarmAnimation = null;
