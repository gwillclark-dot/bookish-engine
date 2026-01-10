/**
 * Bonk Alarm - Main Application
 * Alarm management, screen navigation, and dismiss handling
 */

class BonkAlarmApp {
    constructor() {
        this.alarms = [];
        this.currentScreen = 'clock-screen';
        this.editingAlarmId = null;
        this.checkInterval = null;
        this.activeAlarmId = null;

        // Dismiss tracking
        this.dismissTaps = 0;
        this.dismissRequired = 10; // Taps needed to dismiss
        this.lastShakeTime = 0;

        this.init();
    }

    init() {
        this.loadAlarms();
        this.bindEvents();
        this.startClock();
        this.startAlarmChecker();
        this.renderAlarms();

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        // Initialize audio context on first interaction
        document.addEventListener('click', () => {
            alarmAudio.init();
        }, { once: true });
    }

    // ==================== Storage ====================

    loadAlarms() {
        const stored = localStorage.getItem('bonkAlarms');
        this.alarms = stored ? JSON.parse(stored) : [];
    }

    saveAlarms() {
        localStorage.setItem('bonkAlarms', JSON.stringify(this.alarms));
    }

    // ==================== Event Binding ====================

    bindEvents() {
        // Navigation
        document.getElementById('add-alarm-btn').addEventListener('click', () => this.showSetAlarm());
        document.getElementById('cancel-alarm-btn').addEventListener('click', () => this.showClock());
        document.getElementById('save-alarm-btn').addEventListener('click', () => this.saveAlarm());

        // Time picker
        document.getElementById('am-btn').addEventListener('click', () => this.setPeriod('AM'));
        document.getElementById('pm-btn').addEventListener('click', () => this.setPeriod('PM'));

        // Input formatting
        const hourInput = document.getElementById('hour-input');
        const minuteInput = document.getElementById('minute-input');

        hourInput.addEventListener('input', () => {
            let val = parseInt(hourInput.value) || 0;
            if (val > 12) val = 12;
            if (val < 1 && hourInput.value !== '') val = 1;
            hourInput.value = val || '';
        });

        minuteInput.addEventListener('input', () => {
            let val = parseInt(minuteInput.value) || 0;
            if (val > 59) val = 59;
            minuteInput.value = val.toString().padStart(2, '0');
        });

        minuteInput.addEventListener('blur', () => {
            let val = parseInt(minuteInput.value) || 0;
            minuteInput.value = val.toString().padStart(2, '0');
        });

        // Dismiss handlers
        this.bindDismissEvents();
    }

    bindDismissEvents() {
        const animScreen = document.getElementById('animation-screen');

        // Tap to dismiss
        animScreen.addEventListener('click', () => this.handleDismissTap());
        animScreen.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleDismissTap();
        });

        // Shake to dismiss
        if ('DeviceMotionEvent' in window) {
            window.addEventListener('devicemotion', (e) => this.handleDeviceMotion(e));
        }
    }

    // ==================== Clock Display ====================

    startClock() {
        const updateClock = () => {
            const now = new Date();
            let hours = now.getHours();
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const seconds = now.getSeconds().toString().padStart(2, '0');
            const period = hours >= 12 ? 'PM' : 'AM';

            hours = hours % 12 || 12;

            document.getElementById('current-time').innerHTML =
                `${hours}:${minutes}<span class="seconds">:${seconds} ${period}</span>`;
        };

        updateClock();
        setInterval(updateClock, 1000);
    }

    // ==================== Alarm Checker ====================

    startAlarmChecker() {
        this.checkInterval = setInterval(() => this.checkAlarms(), 1000);
    }

    checkAlarms() {
        if (this.activeAlarmId) return; // Already ringing

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        for (const alarm of this.alarms) {
            if (!alarm.enabled) continue;

            // Convert alarm time to 24h
            let alarmHour = alarm.hour;
            if (alarm.period === 'PM' && alarm.hour !== 12) {
                alarmHour += 12;
            } else if (alarm.period === 'AM' && alarm.hour === 12) {
                alarmHour = 0;
            }

            if (currentHour === alarmHour && currentMinute === alarm.minute) {
                // Check if we already triggered this minute
                const lastTrigger = alarm.lastTriggered || 0;
                const nowTime = now.getTime();
                if (nowTime - lastTrigger < 60000) continue;

                this.triggerAlarm(alarm);
                break;
            }
        }
    }

    // ==================== Alarm Trigger ====================

    triggerAlarm(alarm) {
        this.activeAlarmId = alarm.id;
        alarm.lastTriggered = Date.now();
        this.saveAlarms();

        // Reset dismiss counter
        this.dismissTaps = 0;
        this.updateDismissProgress();

        // Show animation screen
        this.showScreen('animation-screen');

        // Initialize and start animation
        const container = document.getElementById('animation-container');
        if (!alarmAnimation) {
            alarmAnimation = new AlarmAnimation(container);
        }
        alarmAnimation.start();

        // Start alarm sound
        alarmAudio.playAlarm();

        // Send notification if tab not focused
        this.sendNotification(alarm);

        // Prevent screen sleep (if supported)
        this.requestWakeLock();
    }

    async requestWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                this.wakeLock = await navigator.wakeLock.request('screen');
            } catch (e) {
                console.log('Wake lock not available');
            }
        }
    }

    sendNotification(alarm) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const label = alarm.label || 'Alarm';
            new Notification('Bonk Alarm', {
                body: `${label} - Time to wake up!`,
                icon: '🔔',
                requireInteraction: true
            });
        }
    }

    // ==================== Dismiss Handling ====================

    handleDismissTap() {
        if (!this.activeAlarmId) return;

        this.dismissTaps++;
        this.updateDismissProgress();

        // Visual feedback
        const animScreen = document.getElementById('animation-screen');
        animScreen.classList.add('shaking');
        setTimeout(() => animScreen.classList.remove('shaking'), 100);

        if (this.dismissTaps >= this.dismissRequired) {
            this.dismissAlarm();
        }
    }

    handleDeviceMotion(event) {
        if (!this.activeAlarmId) return;

        const acceleration = event.accelerationIncludingGravity;
        if (!acceleration) return;

        const magnitude = Math.sqrt(
            acceleration.x ** 2 +
            acceleration.y ** 2 +
            acceleration.z ** 2
        );

        // Detect shake (threshold of 20 m/s²)
        if (magnitude > 20) {
            const now = Date.now();
            if (now - this.lastShakeTime > 200) { // Debounce
                this.lastShakeTime = now;
                this.dismissTaps += 2; // Shaking counts double
                this.updateDismissProgress();

                if (this.dismissTaps >= this.dismissRequired) {
                    this.dismissAlarm();
                }
            }
        }
    }

    updateDismissProgress() {
        const progress = Math.min((this.dismissTaps / this.dismissRequired) * 100, 100);
        const progressBar = document.getElementById('dismiss-progress');
        progressBar.style.setProperty('--progress', `${progress}%`);
    }

    dismissAlarm() {
        // Stop everything
        alarmAudio.stop();
        alarmAudio.playDismiss();

        if (alarmAnimation) {
            alarmAnimation.stop();
        }

        // Release wake lock
        if (this.wakeLock) {
            this.wakeLock.release();
            this.wakeLock = null;
        }

        this.activeAlarmId = null;
        this.dismissTaps = 0;

        // Return to clock screen
        setTimeout(() => this.showClock(), 500);
    }

    // ==================== Screen Navigation ====================

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
        this.currentScreen = screenId;
    }

    showClock() {
        this.showScreen('clock-screen');
        this.editingAlarmId = null;
    }

    showSetAlarm(alarmId = null) {
        this.editingAlarmId = alarmId;

        // Set default or existing values
        const hourInput = document.getElementById('hour-input');
        const minuteInput = document.getElementById('minute-input');
        const labelInput = document.getElementById('label-input');

        if (alarmId) {
            const alarm = this.alarms.find(a => a.id === alarmId);
            if (alarm) {
                hourInput.value = alarm.hour;
                minuteInput.value = alarm.minute.toString().padStart(2, '0');
                labelInput.value = alarm.label || '';
                this.setPeriod(alarm.period);
            }
        } else {
            // Default to next hour
            const now = new Date();
            let hour = (now.getHours() % 12) || 12;
            const period = now.getHours() >= 12 ? 'PM' : 'AM';

            hourInput.value = hour;
            minuteInput.value = '00';
            labelInput.value = '';
            this.setPeriod(period);
        }

        this.showScreen('set-alarm-screen');
    }

    setPeriod(period) {
        const amBtn = document.getElementById('am-btn');
        const pmBtn = document.getElementById('pm-btn');

        if (period === 'AM') {
            amBtn.classList.add('active');
            pmBtn.classList.remove('active');
        } else {
            amBtn.classList.remove('active');
            pmBtn.classList.add('active');
        }
    }

    // ==================== Alarm CRUD ====================

    saveAlarm() {
        const hourInput = document.getElementById('hour-input');
        const minuteInput = document.getElementById('minute-input');
        const labelInput = document.getElementById('label-input');
        const period = document.getElementById('am-btn').classList.contains('active') ? 'AM' : 'PM';

        const hour = parseInt(hourInput.value) || 7;
        const minute = parseInt(minuteInput.value) || 0;
        const label = labelInput.value.trim();

        if (this.editingAlarmId) {
            // Update existing
            const alarm = this.alarms.find(a => a.id === this.editingAlarmId);
            if (alarm) {
                alarm.hour = hour;
                alarm.minute = minute;
                alarm.period = period;
                alarm.label = label;
            }
        } else {
            // Create new
            const alarm = {
                id: Date.now().toString(),
                hour,
                minute,
                period,
                label,
                enabled: true,
                lastTriggered: 0
            };
            this.alarms.push(alarm);
        }

        this.saveAlarms();
        this.renderAlarms();
        this.showClock();
    }

    toggleAlarm(id) {
        const alarm = this.alarms.find(a => a.id === id);
        if (alarm) {
            alarm.enabled = !alarm.enabled;
            this.saveAlarms();
            this.renderAlarms();
        }
    }

    deleteAlarm(id) {
        this.alarms = this.alarms.filter(a => a.id !== id);
        this.saveAlarms();
        this.renderAlarms();
    }

    // ==================== Rendering ====================

    renderAlarms() {
        const container = document.getElementById('alarms-container');

        if (this.alarms.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⏰</div>
                    <p>No alarms set</p>
                    <p>Tap + to add one</p>
                </div>
            `;
            return;
        }

        // Sort by time
        const sorted = [...this.alarms].sort((a, b) => {
            const aTime = this.getAlarmMinutes(a);
            const bTime = this.getAlarmMinutes(b);
            return aTime - bTime;
        });

        container.innerHTML = sorted.map(alarm => `
            <div class="alarm-item" data-id="${alarm.id}">
                <div class="alarm-info" onclick="app.showSetAlarm('${alarm.id}')">
                    <div class="alarm-time">
                        ${alarm.hour}:${alarm.minute.toString().padStart(2, '0')}
                        <span class="period">${alarm.period}</span>
                    </div>
                    ${alarm.label ? `<div class="alarm-label">${alarm.label}</div>` : ''}
                </div>
                <div class="alarm-controls">
                    <div class="toggle-switch ${alarm.enabled ? 'active' : ''}"
                         onclick="app.toggleAlarm('${alarm.id}')"></div>
                    <button class="delete-btn" onclick="app.deleteAlarm('${alarm.id}')">✕</button>
                </div>
            </div>
        `).join('');
    }

    getAlarmMinutes(alarm) {
        let hours = alarm.hour;
        if (alarm.period === 'PM' && hours !== 12) hours += 12;
        if (alarm.period === 'AM' && hours === 12) hours = 0;
        return hours * 60 + alarm.minute;
    }

    // ==================== Testing ====================

    // Test method to trigger alarm immediately
    testAlarm() {
        const testAlarm = {
            id: 'test',
            hour: 12,
            minute: 0,
            period: 'PM',
            label: 'Test Alarm',
            enabled: true
        };
        this.triggerAlarm(testAlarm);
    }
}

// Initialize app
const app = new BonkAlarmApp();

// Expose test method for console
window.testAlarm = () => app.testAlarm();
console.log('💤 Bonk Alarm ready! Type testAlarm() in console to test the animation.');
