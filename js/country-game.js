class CountryGame {
    constructor(gameState) {
        this.gameState = gameState;
        this.timer = new GameTimer(15, () => this.handleTimeout());
        this.clueDisplayArea = document.getElementById('clue-display-area');
        this.clueTitle = document.getElementById('clue-title');
        this.clueProgressBar = document.getElementById('clue-progress-bar');
        this.answerInput = document.getElementById('answer-input');
        this.btnSubmit = document.getElementById('btn-submit-answer');
        this.hintText = document.getElementById('hint-text');
        this.nextRoundTimeout = null;
        
        this.clueOrder = [
            { id: 1, title: 'CLUE 1 of 5 — Emoji Hints', points: 500, render: this.renderEmojiClue.bind(this) },
            { id: 2, title: 'CLUE 2 of 5 — The Flag', points: 400, render: this.renderFlagClue.bind(this) },
            { id: 3, title: 'CLUE 3 of 5 — Famous Landmark', points: 300, render: this.renderLandmarkClue.bind(this) },
            { id: 4, title: 'CLUE 4 of 5 — Capital City', points: 200, render: this.renderCapitalClue.bind(this) },
            { id: 5, title: 'CLUE 5 of 5 — Fun Fact', points: 100, render: this.renderFactClue.bind(this) }
        ];
    }

    startRound() {
        this.currentCountry = this.gameState.getCurrentTarget();
        this.gameState.currentClueIndex = 0;
        
        document.getElementById('answer-section').style.display = 'flex';
        document.getElementById('multiple-choice-section').style.display = 'none';
        
        this.answerInput.value = '';
        this.answerInput.disabled = false;
        this.btnSubmit.disabled = false;
        this.answerInput.classList.remove('input-success', 'input-error');
        
        // Add event listeners using direct assignment to prevent leaks
        this.btnSubmit.onclick = () => this.checkAnswer();
        this.answerInput.onkeypress = (e) => { if (e.key === 'Enter') this.checkAnswer(); };

        // Generate Hint Text
        let hint = "";
        for (let char of this.currentCountry.name) {
            if (char === ' ') hint += "  ";
            else hint += "_ ";
        }
        this.hintText.textContent = `Hint: ${hint} (${this.currentCountry.name.replace(/\s/g, '').length} letters)`;

        UI.addChatMessage('system', `Round ${this.gameState.currentRound} of ${this.gameState.totalRounds} — starting!`);
        this.showClue();
    }

    showClue() {
        if (this.gameState.currentClueIndex >= this.clueOrder.length) {
            this.revealAnswer(false, 0);
            return;
        }

        const clueInfo = this.clueOrder[this.gameState.currentClueIndex];
        
        this.clueTitle.textContent = clueInfo.title;
        this.clueProgressBar.style.width = `${((this.gameState.currentClueIndex + 1) / this.clueOrder.length) * 100}%`;
        
        this.clueDisplayArea.innerHTML = '';
        const slide = document.createElement('div');
        slide.className = 'clue-content-slide';
        
        clueInfo.render(slide);
        this.clueDisplayArea.appendChild(slide);

        // Focus input
        setTimeout(() => this.answerInput.focus(), 100);

        this.timer.reset(15);
        this.timer.start();
        
        if (this.gameState.currentClueIndex > 0) {
            UI.addChatMessage('hint', `💡 New clue revealed!`);
        }
    }

    renderEmojiClue(container) {
        const span = document.createElement('span');
        span.className = 'clue-emoji';
        span.textContent = this.currentCountry.emojis.join(' ');
        container.appendChild(span);
    }

    renderFlagClue(container) {
        const wrapper = document.createElement('div');
        wrapper.className = 'full-image-wrapper flag-wrapper';

        if (this.currentCountry.flagImage) {
            const img = document.createElement('img');
            img.className = 'clue-flag-full';
            img.src = this.currentCountry.flagImage;
            img.alt = `${this.currentCountry.name} Flag`;
            wrapper.appendChild(img);
        } else {
            const span = document.createElement('span');
            span.className = 'clue-emoji';
            span.textContent = this.currentCountry.flag;
            wrapper.appendChild(span);
        }
        container.appendChild(wrapper);
    }

    renderLandmarkClue(container) {
        const wrapper = document.createElement('div');
        wrapper.className = 'full-image-wrapper';

        const img = document.createElement('img');
        img.className = 'clue-image-full';
        img.src = this.currentCountry.landmark.image;
        img.alt = this.currentCountry.landmark.name;
        
        const overlay = document.createElement('div');
        overlay.className = 'clue-image-overlay';
        overlay.innerHTML = `📍 Landmark: <strong>${this.currentCountry.landmark.name}</strong>`;

        img.onerror = () => {
            wrapper.innerHTML = `<div class="clue-image-fallback"><span style="font-size: 4rem;">🏛️</span><br><strong>${this.currentCountry.landmark.name}</strong></div>`;
        };

        wrapper.appendChild(img);
        wrapper.appendChild(overlay);
        container.appendChild(wrapper);
    }

    renderCapitalClue(container) {
        if (this.currentCountry.capitalImage) {
            const wrapper = document.createElement('div');
            wrapper.className = 'full-image-wrapper';
            
            const img = document.createElement('img');
            img.className = 'clue-image-full';
            img.src = this.currentCountry.capitalImage;
            img.alt = `Capital City of ${this.currentCountry.name}`;
            
            const overlay = document.createElement('div');
            overlay.className = 'clue-image-overlay';
            overlay.innerHTML = `🏛️ Capital City: <strong>"${this.currentCountry.capital}"</strong>`;
            
            img.onerror = () => {
                wrapper.innerHTML = `<span style="font-size: 2.2rem; color: #fff;">🏛️ Capital: <strong>"${this.currentCountry.capital}"</strong></span>`;
            };

            wrapper.appendChild(img);
            wrapper.appendChild(overlay);
            container.appendChild(wrapper);
        } else {
            const span = document.createElement('span');
            span.style.fontSize = '2.2rem';
            span.innerHTML = `🏛️ Capital: <strong>"${this.currentCountry.capital}"</strong>`;
            container.appendChild(span);
        }
    }

    renderFactClue(container) {
        const span = document.createElement('span');
        span.style.fontSize = '1.5rem';
        span.style.padding = '20px';
        span.innerHTML = `💡 <em>"${this.currentCountry.funFact}"</em>`;
        container.appendChild(span);
    }

    handleTimeout() {
        this.gameState.currentClueIndex++;
        if (this.gameState.currentClueIndex < this.clueOrder.length) {
            UI.addChatMessage('timeout', `⏰ Clue time's up!`);
            this.showClue();
        } else {
            this.revealAnswer(false, 0);
        }
    }

    checkAnswer() {
        const input = this.answerInput.value.trim();
        if (!input) return;

        const normalize = str => str.toLowerCase().replace(/[^a-z]/g, "");
        const normalizedInput = normalize(input);
        
        const validAnswers = [this.currentCountry.name, ...(this.currentCountry.aliases || [])].map(normalize);

        if (validAnswers.includes(normalizedInput)) {
            // Correct
            this.timer.stop();
            const points = this.clueOrder[this.gameState.currentClueIndex].points;
            
            this.answerInput.classList.remove('input-error');
            this.answerInput.classList.add('input-success');
            
            const panel = document.getElementById('panel-main');
            panel.classList.remove('panel-flash-correct');
            void panel.offsetWidth;
            panel.classList.add('panel-flash-correct');
            
            UI.playSound('correct');
            UI.showConfetti();
            UI.addChatMessage('correct', `🎉 Correct! It was ${this.currentCountry.name}. +${points} points`);
            
            this.revealAnswer(true, points);
        } else {
            // Wrong
            this.answerInput.classList.remove('input-error');
            void this.answerInput.offsetWidth; // Trigger reflow
            this.answerInput.classList.add('input-error');
            
            UI.playSound('wrong');
            UI.addChatMessage('wrong', `❌ '${input}' is wrong. Try again!`);
            this.answerInput.value = '';
            
            if (Math.random() > 0.7) {
                UI.addChatMessage('flavor', `So close! (Maybe)`);
            }
        }
    }

    revealAnswer(isCorrect, pointsEarned) {
        this.timer.stop();
        this.btnSubmit.onclick = null;
        this.answerInput.onkeypress = null;
        this.answerInput.disabled = true;
        this.btnSubmit.disabled = true;

        this.clueDisplayArea.innerHTML = '';
        const reveal = document.createElement('div');
        reveal.className = `clue-reveal ${isCorrect ? '' : 'wrong-reveal'}`;
        
        const flagHtml = this.currentCountry.flagImage 
            ? `<img src="${this.currentCountry.flagImage}" class="flag-icon-large" style="height: 44px; border-radius: 4px; vertical-align: middle; box-shadow: 0 2px 6px rgba(0,0,0,0.3);" alt="Flag">`
            : this.currentCountry.flag;

        reveal.innerHTML = `
            <h2>${isCorrect ? '✅ CORRECT!' : '⏰ TIME IS UP!'}</h2>
            <div style="font-size: 2.5rem; margin: 10px 0; display: flex; align-items: center; justify-content: center; gap: 12px;">
                ${flagHtml} <strong>${this.currentCountry.name.toUpperCase()}</strong>
            </div>
            <p>${isCorrect ? `You guessed at Clue ${this.gameState.currentClueIndex + 1}! <strong>+${pointsEarned} points</strong>` : `The answer was ${this.currentCountry.name}. 0 points.`}</p>
        `;
        
        this.clueDisplayArea.appendChild(reveal);

        this.gameState.recordRound(this.currentCountry.name, this.currentCountry.flag, pointsEarned, this.gameState.currentClueIndex + 1, isCorrect);

        if (!isCorrect) {
            UI.addChatMessage('timeout', `⏰ Time's up! The answer was ${this.currentCountry.name}.`);
        }

        if (this.nextRoundTimeout) clearTimeout(this.nextRoundTimeout);
        this.nextRoundTimeout = setTimeout(() => {
            this.gameState.nextRound();
        }, 4000);
    }
}
