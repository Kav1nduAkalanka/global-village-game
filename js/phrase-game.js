class PhraseGame {
    constructor(gameState) {
        this.gameState = gameState;
        this.maxAttempts = 5;
        this.attempts = [];
        this.currentAttempt = 0;
        this.isGameOver = false;

        this.clueDisplayArea = document.getElementById('clue-display-area');
        this.clueTitle = document.getElementById('clue-title');
        this.clueProgressBar = document.getElementById('clue-progress-bar');
        this.mcSection = document.getElementById('multiple-choice-section');
        this.answerSection = document.getElementById('answer-section');
        this.answerInput = document.getElementById('answer-input');
        this.btnSubmit = document.getElementById('btn-submit-answer');
        this.hintText = document.getElementById('hint-text');
        
        this.nextRoundTimeout = null;
    }

    startRound() {
        this.currentPhrase = this.gameState.getCurrentTarget();
        this.targetWord = this.currentPhrase.answer.toUpperCase().replace(/[^A-Z]/g, '');
        this.wordLength = this.targetWord.length;
        this.attempts = [];
        this.currentAttempt = 0;
        this.isGameOver = false;

        // Hide MC section, Show text input section
        this.mcSection.style.display = 'none';
        this.answerSection.style.display = 'flex';

        this.answerInput.value = '';
        this.answerInput.disabled = false;
        this.btnSubmit.disabled = false;
        this.answerInput.maxLength = this.wordLength;
        this.answerInput.placeholder = `Type a ${this.wordLength}-letter word...`;
        this.answerInput.classList.remove('input-success', 'input-error');

        // Add event listeners safely via property assignment
        this.btnSubmit.onclick = () => this.handleGuessSubmit();
        this.answerInput.onkeypress = (e) => { if (e.key === 'Enter') this.handleGuessSubmit(); };

        this.clueTitle.textContent = `WORDLE CLUE — ${this.currentPhrase.categoryEmoji} ${this.currentPhrase.category.toUpperCase()} (${this.wordLength} Letters)`;
        this.clueProgressBar.style.width = `100%`;

        if (this.hintText) {
            this.hintText.textContent = `💡 Hint: ${this.currentPhrase.hint} | Try 1 of 5`;
        }

        UI.addChatMessage('system', `Round ${this.gameState.currentRound} of ${this.gameState.totalRounds} — Wordle Mode! Guess the ${this.wordLength}-letter word.`);
        
        this.renderWordleBoard();
        setTimeout(() => this.answerInput.focus(), 100);
    }

    renderWordleBoard() {
        this.clueDisplayArea.innerHTML = '';
        
        const boardWrapper = document.createElement('div');
        boardWrapper.className = 'wordle-game-container';

        // Header image card (if available) + info bar
        if (this.currentPhrase.image) {
            const imgCard = document.createElement('div');
            imgCard.className = 'wordle-image-banner';
            imgCard.innerHTML = `<img src="${this.currentPhrase.image}" alt="${this.currentPhrase.answer}"><div class="wordle-banner-overlay">${this.currentPhrase.originEmoji} ${this.currentPhrase.origin} • ${this.currentPhrase.category.toUpperCase()}</div>`;
            boardWrapper.appendChild(imgCard);
        } else {
            const headerInfo = document.createElement('div');
            headerInfo.className = 'wordle-header-info';
            headerInfo.innerHTML = `
                <span>${this.currentPhrase.originEmoji} <strong>${this.currentPhrase.origin}</strong></span>
                <span>Category: <strong>${this.currentPhrase.category.toUpperCase()}</strong></span>
            `;
            boardWrapper.appendChild(headerInfo);
        }

        // Wordle Grid
        const grid = document.createElement('div');
        grid.className = 'wordle-grid';

        for (let rowIdx = 0; rowIdx < this.maxAttempts; rowIdx++) {
            const row = document.createElement('div');
            row.className = `wordle-row ${rowIdx === this.currentAttempt ? 'active-row' : ''}`;
            row.style.gridTemplateColumns = `repeat(${this.wordLength}, 1fr)`;

            const guess = this.attempts[rowIdx] || "";
            const isEvaluated = rowIdx < this.currentAttempt;
            const evaluation = isEvaluated ? this.evaluateGuess(guess) : [];

            for (let colIdx = 0; colIdx < this.wordLength; colIdx++) {
                const tile = document.createElement('div');
                tile.className = 'wordle-tile';
                const char = guess[colIdx] || "";
                tile.textContent = char;

                if (isEvaluated) {
                    const status = evaluation[colIdx];
                    tile.classList.add(`tile-${status}`, 'tile-flip');
                    tile.style.animationDelay = `${colIdx * 0.08}s`;
                } else if (char) {
                    tile.classList.add('tile-filled');
                }

                row.appendChild(tile);
            }
            grid.appendChild(row);
        }

        boardWrapper.appendChild(grid);
        this.clueDisplayArea.appendChild(boardWrapper);
    }

    evaluateGuess(guess) {
        const result = new Array(this.wordLength).fill('absent');
        const targetArr = this.targetWord.split('');
        const guessArr = guess.split('');
        const targetCounts = {};

        // Count letters in target
        targetArr.forEach(ch => {
            targetCounts[ch] = (targetCounts[ch] || 0) + 1;
        });

        // Pass 1: Correct letters in correct positions (Green)
        for (let i = 0; i < this.wordLength; i++) {
            if (guessArr[i] === targetArr[i]) {
                result[i] = 'correct';
                targetCounts[guessArr[i]]--;
            }
        }

        // Pass 2: Present letters in wrong positions (Yellow)
        for (let i = 0; i < this.wordLength; i++) {
            if (result[i] !== 'correct' && targetCounts[guessArr[i]] > 0) {
                result[i] = 'present';
                targetCounts[guessArr[i]]--;
            }
        }

        return result;
    }

    handleGuessSubmit() {
        if (this.isGameOver) return;

        const guess = this.answerInput.value.trim().toUpperCase().replace(/[^A-Z]/g, '');

        if (guess.length !== this.wordLength) {
            this.answerInput.classList.remove('input-error');
            void this.answerInput.offsetWidth;
            this.answerInput.classList.add('input-error');
            UI.playSound('wrong');
            UI.addChatMessage('wrong', `⚠️ Guess must be exactly ${this.wordLength} letters!`);
            return;
        }

        this.attempts.push(guess);
        this.currentAttempt++;
        this.answerInput.value = '';

        this.renderWordleBoard();

        const pointsMap = [500, 400, 300, 200, 100];

        if (guess === this.targetWord) {
            // WIN!
            this.isGameOver = true;
            const points = pointsMap[this.currentAttempt - 1] || 100;

            const panel = document.getElementById('panel-main');
            panel.classList.remove('panel-flash-correct');
            void panel.offsetWidth;
            panel.classList.add('panel-flash-correct');

            UI.playSound('correct');
            UI.showConfetti();
            UI.addChatMessage('correct', `🎉 Spot on! You solved '${this.currentPhrase.answer}' in attempt ${this.currentAttempt}! +${points} pts`);

            this.revealAnswer(true, points);
        } else if (this.currentAttempt >= this.maxAttempts) {
            // FAIL
            this.isGameOver = true;
            UI.playSound('wrong');
            this.revealAnswer(false, 0);
        } else {
            // Continue next attempt
            UI.playSound('hint');
            if (this.hintText) {
                this.hintText.textContent = `💡 Hint: ${this.currentPhrase.hint} | Try ${this.currentAttempt + 1} of 5`;
            }
            UI.addChatMessage('hint', `Attempt ${this.currentAttempt}/5 submitted. Keep going!`);
            setTimeout(() => this.answerInput.focus(), 100);
        }
    }

    revealAnswer(isCorrect, pointsEarned) {
        this.btnSubmit.onclick = null;
        this.answerInput.onkeypress = null;
        this.answerInput.disabled = true;
        this.btnSubmit.disabled = true;

        setTimeout(() => {
            this.clueDisplayArea.innerHTML = '';
            const reveal = document.createElement('div');
            reveal.className = `clue-reveal ${isCorrect ? '' : 'wrong-reveal'}`;
            
            reveal.innerHTML = `
                <h2>${isCorrect ? '✅ WORD SOLVED!' : '⏰ OUT OF TRIES!'}</h2>
                <div style="font-size: 2.5rem; margin: 10px 0;">
                    ${this.currentPhrase.categoryEmoji} <strong>${this.currentPhrase.answer}</strong>
                </div>
                ${this.currentPhrase.image ? `<img src="${this.currentPhrase.image}" class="clue-image" style="max-height: 160px; border-radius: 8px; margin: 10px 0; border: 2px solid #fff;" alt="${this.currentPhrase.answer}">` : ''}
                <p>${isCorrect ? `Solved in ${this.currentAttempt} tries! <strong>+${pointsEarned} points</strong>` : `The word was ${this.currentPhrase.answer}. 0 points.`}</p>
                <p style="font-size: 0.9rem; margin-top: 10px;"><em>Fun Fact: ${this.currentPhrase.funFact}</em></p>
            `;
            
            this.clueDisplayArea.appendChild(reveal);

            this.gameState.recordRound(this.currentPhrase.answer, this.currentPhrase.categoryEmoji, pointsEarned, this.currentAttempt, isCorrect);

            if (!isCorrect) {
                UI.addChatMessage('timeout', `⏰ Out of tries! The answer was ${this.currentPhrase.answer}.`);
            }

            if (this.nextRoundTimeout) clearTimeout(this.nextRoundTimeout);
            this.nextRoundTimeout = setTimeout(() => {
                this.gameState.nextRound();
            }, 4500);
        }, 1000);
    }
}
