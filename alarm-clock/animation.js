/**
 * Bonk Alarm - SVG Stick Figure Animation
 * Clean white lines on dark background
 */

class AlarmAnimation {
    constructor(container) {
        this.container = container;
        this.svg = null;
        this.elements = {};

        this.isRunning = false;
        this.animationId = null;
        this.startTime = 0;
        this.phase = 'idle';
        this.phaseStartTime = 0;

        // Scene dimensions
        this.width = 400;
        this.height = 500;

        // Animation state
        this.clockX = 0;
        this.clockY = 0;
        this.clockRotation = 0;

        this.createSVG();
    }

    createSVG() {
        // Create SVG element
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
        this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        this.svg.id = 'stick-animation';

        // Build the scene
        this.createScene();

        this.container.appendChild(this.svg);
    }

    createScene() {
        // Definitions for reusable elements
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        this.svg.appendChild(defs);

        // Create all scene elements
        this.createBed();
        this.createPerson();
        this.createNightstand();
        this.createCord();
        this.createClock();
        this.createEffects();
    }

    // Helper to create SVG elements
    createEl(type, attrs = {}) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', type);
        for (const [key, val] of Object.entries(attrs)) {
            el.setAttribute(key, val);
        }
        return el;
    }

    createBed() {
        const bed = this.createEl('g', { id: 'bed' });

        // Bed frame
        bed.appendChild(this.createEl('rect', {
            x: 40, y: 320, width: 220, height: 80,
            fill: 'none', stroke: '#fff', 'stroke-width': 3
        }));

        // Headboard
        bed.appendChild(this.createEl('rect', {
            x: 40, y: 280, width: 80, height: 40,
            fill: 'none', stroke: '#fff', 'stroke-width': 3
        }));

        // Pillow
        bed.appendChild(this.createEl('ellipse', {
            cx: 100, cy: 310, rx: 35, ry: 15,
            fill: 'none', stroke: '#fff', 'stroke-width': 2
        }));

        // Blanket (wavy line)
        bed.appendChild(this.createEl('path', {
            d: 'M 40 340 Q 80 330, 130 340 T 220 340 L 260 340',
            fill: 'none', stroke: '#fff', 'stroke-width': 2
        }));

        // Legs
        bed.appendChild(this.createEl('line', {
            x1: 50, y1: 400, x2: 50, y2: 420,
            stroke: '#fff', 'stroke-width': 3
        }));
        bed.appendChild(this.createEl('line', {
            x1: 250, y1: 400, x2: 250, y2: 420,
            stroke: '#fff', 'stroke-width': 3
        }));

        this.svg.appendChild(bed);
    }

    createPerson() {
        const person = this.createEl('g', { id: 'person' });

        // Head
        const head = this.createEl('circle', {
            id: 'head', cx: 100, cy: 280, r: 25,
            fill: 'none', stroke: '#fff', 'stroke-width': 3
        });
        person.appendChild(head);

        // Sleeping eyes (closed - curved lines)
        const leftEyeClosed = this.createEl('path', {
            id: 'left-eye-closed',
            d: 'M 88 278 Q 92 282, 96 278',
            fill: 'none', stroke: '#fff', 'stroke-width': 2
        });
        person.appendChild(leftEyeClosed);

        const rightEyeClosed = this.createEl('path', {
            id: 'right-eye-closed',
            d: 'M 104 278 Q 108 282, 112 278',
            fill: 'none', stroke: '#fff', 'stroke-width': 2
        });
        person.appendChild(rightEyeClosed);

        // Awake eyes (open - circles) - hidden initially
        const leftEyeOpen = this.createEl('circle', {
            id: 'left-eye-open',
            cx: 92, cy: 278, r: 4,
            fill: '#fff', stroke: 'none', opacity: 0
        });
        person.appendChild(leftEyeOpen);

        const rightEyeOpen = this.createEl('circle', {
            id: 'right-eye-open',
            cx: 108, cy: 278, r: 4,
            fill: '#fff', stroke: 'none', opacity: 0
        });
        person.appendChild(rightEyeOpen);

        // Sleeping mouth (slight smile)
        const mouthSleeping = this.createEl('path', {
            id: 'mouth-sleeping',
            d: 'M 94 290 Q 100 294, 106 290',
            fill: 'none', stroke: '#fff', 'stroke-width': 2
        });
        person.appendChild(mouthSleeping);

        // Shocked mouth (O shape) - hidden initially
        const mouthShocked = this.createEl('circle', {
            id: 'mouth-shocked',
            cx: 100, cy: 292, r: 6,
            fill: 'none', stroke: '#fff', 'stroke-width': 2, opacity: 0
        });
        person.appendChild(mouthShocked);

        // Body under blanket (just a lump shape)
        person.appendChild(this.createEl('path', {
            d: 'M 75 305 Q 100 295, 150 310 L 200 330',
            fill: 'none', stroke: '#fff', 'stroke-width': 2, opacity: 0.5
        }));

        // Arms - hidden initially, shown when waking
        const leftArm = this.createEl('path', {
            id: 'left-arm',
            d: 'M 85 300 L 60 260',
            fill: 'none', stroke: '#fff', 'stroke-width': 3, opacity: 0
        });
        person.appendChild(leftArm);

        const rightArm = this.createEl('path', {
            id: 'right-arm',
            d: 'M 115 300 L 140 260',
            fill: 'none', stroke: '#fff', 'stroke-width': 3, opacity: 0
        });
        person.appendChild(rightArm);

        this.svg.appendChild(person);
        this.elements.person = person;
    }

    createNightstand() {
        const stand = this.createEl('g', { id: 'nightstand' });

        // Body
        stand.appendChild(this.createEl('rect', {
            x: 290, y: 340, width: 60, height: 60,
            fill: 'none', stroke: '#fff', 'stroke-width': 3
        }));

        // Drawer
        stand.appendChild(this.createEl('rect', {
            x: 295, y: 360, width: 50, height: 20,
            fill: 'none', stroke: '#fff', 'stroke-width': 2
        }));

        // Handle
        stand.appendChild(this.createEl('line', {
            x1: 312, y1: 370, x2: 328, y2: 370,
            stroke: '#fff', 'stroke-width': 2
        }));

        // Legs
        stand.appendChild(this.createEl('line', {
            x1: 295, y1: 400, x2: 295, y2: 415,
            stroke: '#fff', 'stroke-width': 3
        }));
        stand.appendChild(this.createEl('line', {
            x1: 345, y1: 400, x2: 345, y2: 415,
            stroke: '#fff', 'stroke-width': 3
        }));

        this.svg.appendChild(stand);
    }

    createCord() {
        const cord = this.createEl('path', {
            id: 'cord',
            d: 'M 320 340 Q 330 360, 340 380 L 355 390',
            fill: 'none', stroke: '#fff', 'stroke-width': 2
        });
        this.svg.appendChild(cord);
        this.elements.cord = cord;

        // Plug (shown when unplugged)
        const plug = this.createEl('rect', {
            id: 'plug',
            x: 316, y: 336, width: 8, height: 12,
            fill: '#fff', opacity: 0
        });
        this.svg.appendChild(plug);
        this.elements.plug = plug;
    }

    createClock() {
        const clock = this.createEl('g', { id: 'clock' });

        // Position for start
        this.clockStartX = 320;
        this.clockStartY = 310;
        clock.setAttribute('transform', `translate(${this.clockStartX}, ${this.clockStartY})`);

        // Main body (crude circle)
        clock.appendChild(this.createEl('circle', {
            cx: 0, cy: 0, r: 25,
            fill: 'none', stroke: '#fff', 'stroke-width': 3
        }));

        // Inner circle (clock face)
        clock.appendChild(this.createEl('circle', {
            cx: 0, cy: 0, r: 20,
            fill: 'none', stroke: '#fff', 'stroke-width': 2
        }));

        // Bells on top
        clock.appendChild(this.createEl('circle', {
            cx: -15, cy: -28, r: 8,
            fill: 'none', stroke: '#fff', 'stroke-width': 2
        }));
        clock.appendChild(this.createEl('circle', {
            cx: 15, cy: -28, r: 8,
            fill: 'none', stroke: '#fff', 'stroke-width': 2
        }));

        // Hammer between bells
        clock.appendChild(this.createEl('circle', {
            cx: 0, cy: -35, r: 4,
            fill: '#fff'
        }));

        // Clock hands
        clock.appendChild(this.createEl('line', {
            id: 'hour-hand',
            x1: 0, y1: 0, x2: 0, y2: -10,
            stroke: '#fff', 'stroke-width': 3
        }));
        clock.appendChild(this.createEl('line', {
            id: 'minute-hand',
            x1: 0, y1: 0, x2: 8, y2: -6,
            stroke: '#fff', 'stroke-width': 2
        }));

        // Center dot
        clock.appendChild(this.createEl('circle', {
            cx: 0, cy: 0, r: 3,
            fill: '#fff'
        }));

        // Feet
        clock.appendChild(this.createEl('line', {
            x1: -12, y1: 25, x2: -15, y2: 32,
            stroke: '#fff', 'stroke-width': 3
        }));
        clock.appendChild(this.createEl('line', {
            x1: 12, y1: 25, x2: 15, y2: 32,
            stroke: '#fff', 'stroke-width': 3
        }));

        this.svg.appendChild(clock);
        this.elements.clock = clock;
    }

    createEffects() {
        // Zzz text
        const zzz = this.createEl('g', { id: 'zzz' });
        zzz.appendChild(this.createEl('text', {
            x: 130, y: 250, fill: '#fff', 'font-size': 16, 'font-family': 'sans-serif'
        })).textContent = 'z';
        zzz.appendChild(this.createEl('text', {
            x: 145, y: 235, fill: '#fff', 'font-size': 20, 'font-family': 'sans-serif'
        })).textContent = 'Z';
        zzz.appendChild(this.createEl('text', {
            x: 165, y: 215, fill: '#fff', 'font-size': 24, 'font-family': 'sans-serif'
        })).textContent = 'z';
        this.svg.appendChild(zzz);
        this.elements.zzz = zzz;

        // Motion lines (hidden initially)
        const motionLines = this.createEl('g', { id: 'motion-lines', opacity: 0 });
        for (let i = 0; i < 4; i++) {
            motionLines.appendChild(this.createEl('line', {
                x1: 0, y1: i * 8, x2: -30, y2: i * 8,
                stroke: '#fff', 'stroke-width': 2
            }));
        }
        this.svg.appendChild(motionLines);
        this.elements.motionLines = motionLines;

        // BONK text (hidden initially)
        const bonk = this.createEl('text', {
            id: 'bonk-text',
            x: 140, y: 230, fill: '#fff',
            'font-size': 36, 'font-family': 'sans-serif', 'font-weight': 'bold',
            opacity: 0
        });
        bonk.textContent = 'BONK!';
        this.svg.appendChild(bonk);
        this.elements.bonk = bonk;

        // Stars (hidden initially)
        const stars = this.createEl('g', { id: 'stars', opacity: 0 });
        const starPositions = [[120, 240], [145, 225], [130, 255], [160, 245]];
        starPositions.forEach(([x, y]) => {
            stars.appendChild(this.createEl('text', {
                x, y, fill: '#fff', 'font-size': 16
            })).textContent = '✦';
        });
        this.svg.appendChild(stars);
        this.elements.stars = stars;

        // Alarm rings (hidden initially)
        const rings = this.createEl('g', { id: 'rings', opacity: 0 });
        rings.appendChild(this.createEl('text', {
            x: 280, y: 280, fill: '#fff', 'font-size': 20
        })).textContent = '♪';
        rings.appendChild(this.createEl('text', {
            x: 355, y: 290, fill: '#fff', 'font-size': 20
        })).textContent = '♫';
        rings.appendChild(this.createEl('text', {
            x: 340, y: 265, fill: '#fff', 'font-size': 16
        })).textContent = '♪';
        this.svg.appendChild(rings);
        this.elements.rings = rings;
    }

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.startTime = performance.now();
        this.phase = 'sleeping';
        this.phaseStartTime = this.startTime;

        // Reset positions
        this.resetScene();

        this.animate();
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    resetScene() {
        // Reset clock position
        this.elements.clock.setAttribute('transform',
            `translate(${this.clockStartX}, ${this.clockStartY})`);

        // Reset person
        this.svg.querySelector('#left-eye-closed').setAttribute('opacity', 1);
        this.svg.querySelector('#right-eye-closed').setAttribute('opacity', 1);
        this.svg.querySelector('#left-eye-open').setAttribute('opacity', 0);
        this.svg.querySelector('#right-eye-open').setAttribute('opacity', 0);
        this.svg.querySelector('#mouth-sleeping').setAttribute('opacity', 1);
        this.svg.querySelector('#mouth-shocked').setAttribute('opacity', 0);
        this.svg.querySelector('#left-arm').setAttribute('opacity', 0);
        this.svg.querySelector('#right-arm').setAttribute('opacity', 0);

        // Reset cord
        this.elements.cord.setAttribute('d', 'M 320 340 Q 330 360, 340 380 L 355 390');
        this.elements.plug.setAttribute('opacity', 0);

        // Reset effects
        this.elements.zzz.setAttribute('opacity', 1);
        this.elements.motionLines.setAttribute('opacity', 0);
        this.elements.bonk.setAttribute('opacity', 0);
        this.elements.stars.setAttribute('opacity', 0);
        this.elements.rings.setAttribute('opacity', 0);
    }

    animate() {
        if (!this.isRunning) return;

        const now = performance.now();
        const phaseElapsed = now - this.phaseStartTime;

        this.update(phaseElapsed);

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    update(elapsed) {
        switch (this.phase) {
            case 'sleeping':
                this.updateSleeping(elapsed);
                if (elapsed > 2000) this.setPhase('vibrating');
                break;
            case 'vibrating':
                this.updateVibrating(elapsed);
                if (elapsed > 2000) {
                    this.setPhase('launching');
                    alarmAudio.playWhoosh();
                }
                break;
            case 'launching':
                this.updateLaunching(elapsed);
                if (elapsed > 400) this.setPhase('flying');
                break;
            case 'flying':
                this.updateFlying(elapsed);
                if (elapsed > 800) {
                    this.setPhase('impact');
                    alarmAudio.playBonk();
                }
                break;
            case 'impact':
                this.updateImpact(elapsed);
                if (elapsed > 500) this.setPhase('waking');
                break;
            case 'waking':
                this.updateWaking(elapsed);
                if (elapsed > 2500) {
                    this.setPhase('sleeping');
                    this.resetScene();
                }
                break;
        }
    }

    setPhase(phase) {
        this.phase = phase;
        this.phaseStartTime = performance.now();
    }

    updateSleeping(elapsed) {
        // Animate Zzz floating
        const zzz = this.elements.zzz;
        const float = Math.sin(elapsed / 500) * 5;
        zzz.setAttribute('transform', `translate(0, ${float})`);
        zzz.setAttribute('opacity', 0.6 + Math.sin(elapsed / 300) * 0.4);
    }

    updateVibrating(elapsed) {
        // Hide Zzz
        this.elements.zzz.setAttribute('opacity', 0);

        // Show rings
        this.elements.rings.setAttribute('opacity', 1);

        // Vibrate clock
        const shake = Math.sin(elapsed / 30) * (3 + elapsed / 500);
        const rotation = Math.sin(elapsed / 50) * (2 + elapsed / 400);
        this.elements.clock.setAttribute('transform',
            `translate(${this.clockStartX + shake}, ${this.clockStartY}) rotate(${rotation})`);

        // Animate ring positions
        const ringFloat = Math.sin(elapsed / 200) * 5;
        this.elements.rings.setAttribute('transform', `translate(0, ${ringFloat})`);
    }

    updateLaunching(elapsed) {
        const t = elapsed / 400;

        // Clock lifts off
        const x = this.clockStartX - t * 30;
        const y = this.clockStartY - t * 50;
        const rotation = t * 45;

        this.elements.clock.setAttribute('transform',
            `translate(${x}, ${y}) rotate(${rotation})`);

        // Show plug, cord falls
        if (t > 0.3) {
            this.elements.plug.setAttribute('opacity', 1);
            this.elements.cord.setAttribute('d',
                `M 320 340 Q 325 380, 320 400 L 318 420`);
        }

        // Hide rings
        this.elements.rings.setAttribute('opacity', 1 - t);
    }

    updateFlying(elapsed) {
        const t = elapsed / 800;

        // Parabolic arc from nightstand to head
        const startX = this.clockStartX - 30;
        const startY = this.clockStartY - 50;
        const endX = 130;
        const endY = 255;
        const peakY = 150;

        // Quadratic bezier calculation
        const midX = (startX + endX) / 2;
        const mt = 1 - t;
        const x = mt * mt * startX + 2 * mt * t * midX + t * t * endX;
        const y = mt * mt * startY + 2 * mt * t * peakY + t * t * endY;

        const rotation = t * 720; // Two full spins

        this.elements.clock.setAttribute('transform',
            `translate(${x}, ${y}) rotate(${rotation})`);

        // Motion lines follow clock
        this.elements.motionLines.setAttribute('opacity', 1);
        this.elements.motionLines.setAttribute('transform',
            `translate(${x + 30}, ${y - 10}) rotate(${-30})`);
    }

    updateImpact(elapsed) {
        const t = elapsed / 500;

        // Clock bounces back
        const x = 130 - t * 50;
        const y = 255 + t * t * 150;
        const rotation = 720 + t * 180;

        this.elements.clock.setAttribute('transform',
            `translate(${x}, ${y}) rotate(${rotation})`);

        // Hide motion lines
        this.elements.motionLines.setAttribute('opacity', 0);

        // Show BONK and stars
        if (t < 0.8) {
            this.elements.bonk.setAttribute('opacity', 1);
            this.elements.stars.setAttribute('opacity', 1);

            // Shake stars
            const starShake = Math.sin(elapsed / 30) * 5;
            this.elements.stars.setAttribute('transform', `translate(${starShake}, 0)`);
        }

        // Wake up the person
        this.svg.querySelector('#left-eye-closed').setAttribute('opacity', 0);
        this.svg.querySelector('#right-eye-closed').setAttribute('opacity', 0);
        this.svg.querySelector('#left-eye-open').setAttribute('opacity', 1);
        this.svg.querySelector('#right-eye-open').setAttribute('opacity', 1);
        this.svg.querySelector('#mouth-sleeping').setAttribute('opacity', 0);
        this.svg.querySelector('#mouth-shocked').setAttribute('opacity', 1);
    }

    updateWaking(elapsed) {
        const t = Math.min(elapsed / 500, 1);

        // Hide BONK
        this.elements.bonk.setAttribute('opacity', Math.max(0, 1 - t * 2));
        this.elements.stars.setAttribute('opacity', Math.max(0, 1 - t * 2));

        // Show arms raised
        this.svg.querySelector('#left-arm').setAttribute('opacity', t);
        this.svg.querySelector('#right-arm').setAttribute('opacity', t);

        // Clock continues falling off screen
        const x = 80 - elapsed / 20;
        const y = 255 + 150 + elapsed / 5;
        this.elements.clock.setAttribute('transform',
            `translate(${x}, ${y}) rotate(${900 + elapsed / 5})`);

        // Blink effect
        if (elapsed > 1000) {
            const blink = Math.floor(elapsed / 200) % 2;
            const eyeSize = blink ? 4 : 2;
            this.svg.querySelector('#left-eye-open').setAttribute('r', eyeSize);
            this.svg.querySelector('#right-eye-open').setAttribute('r', eyeSize);
        }
    }
}

let alarmAnimation = null;
