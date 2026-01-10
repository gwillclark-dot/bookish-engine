/**
 * Bonk Alarm - ASCII Art Animation System
 * Retro text-based animation of alarm clock attacking sleeper
 */

class AlarmAnimation {
    constructor(container) {
        this.container = container;
        this.pre = document.createElement('pre');
        this.pre.id = 'ascii-animation';
        this.container.appendChild(this.pre);

        this.isRunning = false;
        this.animationId = null;
        this.frame = 0;
        this.phase = 'idle';
        this.phaseFrame = 0;

        // Animation timing
        this.lastFrameTime = 0;
        this.frameInterval = 120; // ms between frames

        // Clock position for flying phase
        this.clockX = 0;
        this.clockY = 0;
    }

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.phase = 'sleeping';
        this.phaseFrame = 0;
        this.frame = 0;
        this.lastFrameTime = performance.now();

        this.animate();
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.phase = 'idle';
        this.pre.textContent = '';
    }

    animate() {
        if (!this.isRunning) return;

        const now = performance.now();
        if (now - this.lastFrameTime >= this.frameInterval) {
            this.lastFrameTime = now;
            this.update();
            this.render();
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    update() {
        this.phaseFrame++;
        this.frame++;

        switch (this.phase) {
            case 'sleeping':
                if (this.phaseFrame > 20) {
                    this.phase = 'vibrating';
                    this.phaseFrame = 0;
                }
                break;
            case 'vibrating':
                if (this.phaseFrame > 25) {
                    this.phase = 'launching';
                    this.phaseFrame = 0;
                    alarmAudio.playWhoosh();
                }
                break;
            case 'launching':
                if (this.phaseFrame > 8) {
                    this.phase = 'flying';
                    this.phaseFrame = 0;
                }
                break;
            case 'flying':
                if (this.phaseFrame > 12) {
                    this.phase = 'impact';
                    this.phaseFrame = 0;
                    alarmAudio.playBonk();
                }
                break;
            case 'impact':
                if (this.phaseFrame > 15) {
                    this.phase = 'waking';
                    this.phaseFrame = 0;
                }
                break;
            case 'waking':
                if (this.phaseFrame > 25) {
                    this.phase = 'sleeping';
                    this.phaseFrame = 0;
                }
                break;
        }
    }

    render() {
        let art = '';

        switch (this.phase) {
            case 'sleeping':
                art = this.renderSleeping();
                break;
            case 'vibrating':
                art = this.renderVibrating();
                break;
            case 'launching':
                art = this.renderLaunching();
                break;
            case 'flying':
                art = this.renderFlying();
                break;
            case 'impact':
                art = this.renderImpact();
                break;
            case 'waking':
                art = this.renderWaking();
                break;
            default:
                art = this.renderSleeping();
        }

        this.pre.textContent = art;
    }

    renderSleeping() {
        const zzz = this.getZzz();
        const clockFrame = this.phaseFrame % 2;
        const clock = clockFrame === 0 ? this.getClock1() : this.getClock2();

        return `
                                                    ${zzz}
                                                  ${zzz}
                                                ${zzz}

                          ╭─────╮                         ┌─────┐
                         ╱       ╲                        │${clock}│
        ┌───────────────────────────────────────┐        │     │
        │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │        └──┬──┘
        │ ░░╭───────╮░░░░░░░░░░░░░░░░░░░░░░░░░░ │           │
        │ ░░│ ‿  ‿  │░░░░░░░░░░░░░░░░░░░░░░░░░░ │           │
        │ ░░│  ───  │░░░░░░░░░░░░░░░░░░░░░░░░░░ │           ║
        │ ░░╰───────╯░░░░░░░░░░░░░░░░░░░░░░░░░░ │           ║
        │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │          ═╩═
        │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
        │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│      ┌───────┐
        └───────────────────────────────────────┘      │ drawer│
            ║                              ║          └───────┘
`;
    }

    getZzz() {
        const frames = ['z', 'Z', 'z'];
        return frames[this.phaseFrame % 3];
    }

    getClock1() {
        return '◐ ◷';
    }

    getClock2() {
        return '◑ ◶';
    }

    renderVibrating() {
        const intensity = Math.min(this.phaseFrame / 5, 3);
        const offset = Math.floor(Math.sin(this.phaseFrame * 2) * intensity);
        const clockShake = offset > 0 ? ' '.repeat(offset) : '';
        const clockShakeR = offset < 0 ? ' '.repeat(-offset) : '';

        const ring1 = this.phaseFrame % 4 < 2 ? '♪' : '♫';
        const ring2 = this.phaseFrame % 4 < 2 ? '♫' : '♪';

        return `
                                                ${ring1}         ${ring2}
                                                   ${ring2}   ${ring1}
                                                     ${ring1}

                          ╭─────╮              ${clockShakeR}┌─────┐${clockShake}
                         ╱       ╲             ${clockShakeR}│◉ ◷ │${clockShake}  !!!
        ┌───────────────────────────────────────┐${clockShakeR}│ ⚡  │${clockShake}
        │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │   ${clockShakeR}└──┬──┘${clockShake}
        │ ░░╭───────╮░░░░░░░░░░░░░░░░░░░░░░░░░░ │        ∿│∿
        │ ░░│ ‿  ‿  │░░░░░░░░░░░░░░░░░░░░░░░░░░ │         │
        │ ░░│  ───  │░░░░░░░░░░░░░░░░░░░░░░░░░░ │         ║
        │ ░░╰───────╯░░░░░░░░░░░░░░░░░░░░░░░░░░ │         ║
        │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │        ═╩═
        │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
        │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│      ┌───────┐
        └───────────────────────────────────────┘      │ drawer│
            ║                              ║          └───────┘
`;
    }

    renderLaunching() {
        const launchFrames = [
            // Wind up
            `


                                              ╔═══╗
                          ╭─────╮              ║◉◷ ║ ←←←
                         ╱       ╲             ║ ⚡ ║
        ┌───────────────────────────────────────┐╚═══╝
        │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │     ┌──┴──┐
        │ ░░╭───────╮░░░░░░░░░░░░░░░░░░░░░░░░░░ │     │     │
        │ ░░│ ‿  ‿  │░░░░░░░░░░░░░░░░░░░░░░░░░░ │
        │ ░░│  ───  │░░░░░░░░░░░░░░░░░░░░░░░░░░ │         ∿∿∿
        │ ░░╰───────╯░░░░░░░░░░░░░░░░░░░░░░░░░░ │         ║
        │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │        ═╩═
        │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
        │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│      ┌───────┐
        └───────────────────────────────────────┘      │ drawer│
            ║                              ║          └───────┘
`,
            // Launch!
            `
                                            ╔═══╗
                                            ║◉◷ ║ →→→→→
                                            ╚═══╝    💨
                          ╭─────╮                    💨
                         ╱       ╲                 💨
        ┌───────────────────────────────────────┐     ┌─────┐
        │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │     │     │
        │ ░░╭───────╮░░░░░░░░░░░░░░░░░░░░░░░░░░ │
        │ ░░│ ‿  ‿  │░░░░░░░░░░░░░░░░░░░░░░░░░░ │        ┌─┐
        │ ░░│  ───  │░░░░░░░░░░░░░░░░░░░░░░░░░░ │        ╘═╛
        │ ░░╰───────╯░░░░░░░░░░░░░░░░░░░░░░░░░░ │         ║
        │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │        ═╩═
        │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
        │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│      ┌───────┐
        └───────────────────────────────────────┘      │ drawer│
            ║                              ║          └───────┘
`
        ];

        const frameIndex = Math.min(Math.floor(this.phaseFrame / 4), launchFrames.length - 1);
        return launchFrames[frameIndex];
    }

    renderFlying() {
        // Clock flies across in an arc
        const flyFrames = [
            `
                                   ╔═══╗
                                   ║◐◷ ║  ·
                                   ╚═══╝   ·
                          ╭─────╮           ·        ┌─────┐
                         ╱       ╲                   │     │
        ┌───────────────────────────────────────┐
        │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │     ┌─┐
        │ ░░╭───────╮░░░░░░░░░░░░░░░░░░░░░░░░░░ │     ╘═╛
        │ ░░│ ‿  ‿  │░░░░░░░░░░░░░░░░░░░░░░░░░░ │      ║
        │ ░░│  ───  │░░░░░░░░░░░░░░░░░░░░░░░░░░ │     ═╩═
        │ ░░╰───────╯░░░░░░░░░░░░░░░░░░░░░░░░░░ │
        │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
        │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│      ┌───────┐
        │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│      │ drawer│
        └───────────────────────────────────────┘      └───────┘
            ║                              ║
`,
            `
                           ╔═══╗
                           ║◑◶ ║
                           ╚═══╝
                          ╭─────╮                    ┌─────┐
                         ╱   ·   ╲                   │     │
        ┌───────────────────·───────────────────┐
        │ ░░░░░░░░░░░░░░░░░·░░░░░░░░░░░░░░░░░░░ │     ┌─┐
        │ ░░╭───────╮░░░░░░░░░░░░░░░░░░░░░░░░░░ │     ╘═╛
        │ ░░│ ‿  ‿  │░░░░░░░░░░░░░░░░░░░░░░░░░░ │      ║
        │ ░░│  ───  │░░░░░░░░░░░░░░░░░░░░░░░░░░ │     ═╩═
        │ ░░╰───────╯░░░░░░░░░░░░░░░░░░░░░░░░░░ │
        │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
        │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│      ┌───────┐
        │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│      │ drawer│
        └───────────────────────────────────────┘      └───────┘
            ║                              ║
`,
            `
                    ╔═══╗
                    ║◐◷ ║
                    ╚═══╝
                      ·   ╭─────╮                    ┌─────┐
                       ·╱       ╲                   │     │
        ┌───────────────·───────────────────────┐
        │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │     ┌─┐
        │ ░░╭───────╮░░░░░░░░░░░░░░░░░░░░░░░░░░ │     ╘═╛
        │ ░░│ ‿  ‿  │░░░░░░░░░░░░░░░░░░░░░░░░░░ │      ║
        │ ░░│  ───  │░░░░░░░░░░░░░░░░░░░░░░░░░░ │     ═╩═
        │ ░░╰───────╯░░░░░░░░░░░░░░░░░░░░░░░░░░ │
        │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
        │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│      ┌───────┐
        │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│      │ drawer│
        └───────────────────────────────────────┘      └───────┘
            ║                              ║
`,
            `
              ╔═══╗
              ║◑◶ ║→→
              ╚═══╝
                  · · ╭─────╮                    ┌─────┐
                     ╱       ╲                   │     │
        ┌───────────────────────────────────────┐
        │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │     ┌─┐
        │ ░░╭───────╮░░░░░░░░░░░░░░░░░░░░░░░░░░ │     ╘═╛
        │ ░░│ ‿  ‿  │░░░░░░░░░░░░░░░░░░░░░░░░░░ │      ║
        │ ░░│  ───  │░░░░░░░░░░░░░░░░░░░░░░░░░░ │     ═╩═
        │ ░░╰───────╯░░░░░░░░░░░░░░░░░░░░░░░░░░ │
        │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
        │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│      ┌───────┐
        │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│      │ drawer│
        └───────────────────────────────────────┘      └───────┘
            ║                              ║
`
        ];

        const frameIndex = Math.min(Math.floor(this.phaseFrame / 3), flyFrames.length - 1);
        return flyFrames[frameIndex];
    }

    renderImpact() {
        const impactFrames = [
            // Impact!
            `

                     ★ BONK! ★
              ╔═══╗
              ║◉◉ ║
              ╚═══╝ ╭─────╮                    ┌─────┐
                   ╱  ⊙ ⊙  ╲                   │     │
        ┌───────────────────────────────────────┐
        │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │     ┌─┐
        │ ░░╭───────╮░░░░░░░░░░░░░░░░░░░░░░░░░░ │     ╘═╛
        │ ░░│ ⊙  ⊙  │░░░░░░░░░░░░░░░░░░░░░░░░░░ │      ║
        │ ░░│   O   │░░░░░░░░░░░░░░░░░░░░░░░░░░ │     ═╩═
        │ ░░╰───────╯░░░░░░░░░░░░░░░░░░░░░░░░░░ │
        │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
        │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│      ┌───────┐
        │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│      │ drawer│
        └───────────────────────────────────────┘      └───────┘
            ║                              ║
`,
            // Recoil
            `

                   ✶ ✷ ✶

            ╔═══╗
            ║x x║  ╭─────╮                    ┌─────┐
            ╚═══╝ ╱  ◉ ◉  ╲                   │     │
        ┌─────────↘────────────────────────────┐
        │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │     ┌─┐
        │ ░░╭───────╮░░░░░░░░░░░░░░░░░░░░░░░░░░ │     ╘═╛
        │ ░░│ ◉  ◉  │░░░░░░░░░░░░░░░░░░░░░░░░░░ │      ║
        │ ░░│   □   │░░░░░░░░░░░░░░░░░░░░░░░░░░ │     ═╩═
        │ ░░╰───────╯░░░░░░░░░░░░░░░░░░░░░░░░░░ │
        │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
        │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│      ┌───────┐
        │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│      │ drawer│
        └───────────────────────────────────────┘      └───────┘
            ║                              ║
`,
            // Clock falls
            `




                    ╭─────╮                    ┌─────┐
           ╔═══╗   ╱  ◉ ◉  ╲                   │     │
        ┌──║x_x║────────────────────────────────┐
        │  ╚═══╝░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │     ┌─┐
        │ ░░╭───────╮░░░░░░░░░░░░░░░░░░░░░░░░░░ │     ╘═╛
        │ ░░│ ◉  ◉  │░░░░░░░░░░░░░░░░░░░░░░░░░░ │      ║
        │ ░░│   □   │░░░░░░░░░░░░░░░░░░░░░░░░░░ │     ═╩═
        │ ░░╰───────╯░░░░░░░░░░░░░░░░░░░░░░░░░░ │
        │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
        │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│      ┌───────┐
        │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│      │ drawer│
        └───────────────────────────────────────┘      └───────┘
            ║                              ║
`
        ];

        const frameIndex = Math.min(Math.floor(this.phaseFrame / 5), impactFrames.length - 1);
        return impactFrames[frameIndex];
    }

    renderWaking() {
        const blinkFrame = this.phaseFrame % 8 < 4;
        const eyes = blinkFrame ? '◉  ◉' : '◉  ◉';
        const mouth = this.phaseFrame % 6 < 3 ? '  O  ' : ' --- ';

        return `

              !?!?!


                    ╭─────╮                    ┌─────┐
                   ╱  ${eyes}  ╲                   │     │
        ┌───────────────────────────────────────┐
        │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │     ┌─┐
        │ ░░╭───────╮░░░░░░░░░░░░░░░░░░░░░░░░░░ │     ╘═╛
        │ ░░│ ${eyes} │░░░░░░░░░░░░░░░░░░░░░░░░░░ │      ║
        │ ░░│${mouth}│░░░░░░░░░░░░░░░░░░░░░░░░░░ │     ═╩═
        │ ░░╰───────╯░░░░░░░░░░░░░░░░░░░░░░░░░░ │
        │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
        │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│      ┌───────┐
        │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│      │ drawer│
        └───────────────────────────────────────┘      └───────┘
            ║                              ║

                    ╔═══╗  (clock is on floor)
                    ╚═══╝
`;
    }

    resize() {
        // ASCII art is fixed size, no resize needed
    }
}

// Will be initialized when animation screen is shown
let alarmAnimation = null;
