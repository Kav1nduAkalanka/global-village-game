// Shared UI elements and helpers

class GameTimer {
    constructor(seconds, onExpire, onTick) {
        this.total = seconds;
        this.remaining = seconds;
        this.onExpire = onExpire;
        this.onTick = onTick;
        this.interval = null;
        this.svgProgress = document.querySelector('.timer-progress');
        this.textElement = document.getElementById('timer-text');
        this.container = document.querySelector('.timer-container');
    }

    start() {
        this.updateVisuals();
        this.interval = setInterval(() => {
            this.remaining -= 0.1;
            
            if (this.onTick) {
                // Call onTick every full second
                if (Math.abs(this.remaining % 1) < 0.1) {
                   this.onTick(Math.ceil(this.remaining));
                }
            }

            this.updateVisuals();

            if (this.remaining <= 0) {
                this.stop();
                this.remaining = 0;
                this.updateVisuals();
                if (this.onExpire) this.onExpire();
            }
        }, 100);
    }

    stop() {
        if (this.interval) clearInterval(this.interval);
    }

    reset(seconds) {
        this.stop();
        this.total = seconds;
        this.remaining = seconds;
        this.updateVisuals();
    }

    updateVisuals() {
        if (!this.svgProgress) return;
        
        // Max stroke-dashoffset is 157
        const percentage = this.remaining / this.total;
        const offset = 157 - (percentage * 157);
        this.svgProgress.style.strokeDashoffset = offset;
        
        if (this.textElement) {
            this.textElement.textContent = Math.ceil(this.remaining);
        }

        if (this.container) {
            if (this.remaining <= 5) {
                this.container.classList.add('danger');
                this.container.classList.remove('warning');
            } else if (this.remaining <= 10) {
                this.container.classList.add('warning');
                this.container.classList.remove('danger');
            } else {
                this.container.classList.remove('warning', 'danger');
            }
        }
    }
}

const UI = {
    chatLog: document.getElementById('chat-log'),

    addChatMessage(type, text) {
        if (!this.chatLog) return;
        const msg = document.createElement("div");
        msg.className = `chat-msg chat-msg--${type}`;
        msg.textContent = text;
        this.chatLog.appendChild(msg);
        this.chatLog.scrollTop = this.chatLog.scrollHeight;
    },
    
    clearChat() {
        if (!this.chatLog) return;
        this.chatLog.innerHTML = '';
        this.addChatMessage('system', 'Welcome to the game!');
    },

    playSound(type) {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            if (type === 'correct') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                osc.start();
                osc.stop(ctx.currentTime + 0.2);
            } else if (type === 'wrong') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                osc.start();
                osc.stop(ctx.currentTime + 0.2);
            }
        } catch (e) {
            console.log("Audio not supported or disabled");
        }
    },

    showConfetti() {
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti');
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
            confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
            
            document.body.appendChild(confetti);
            
            // CSS for animation since we can't reliably inject @keyframes dynamically here
            confetti.animate([
                { transform: `translate3d(0, -10vh, 0) rotate(0deg)`, opacity: 1 },
                { transform: `translate3d(${Math.random()*100 - 50}px, 110vh, 0) rotate(${Math.random()*720}deg)`, opacity: 0 }
            ], {
                duration: Math.random() * 2000 + 1000,
                easing: 'cubic-bezier(.37,0,.63,1)'
            });
            
            setTimeout(() => {
                confetti.remove();
            }, 3000);
        }
    }
};
