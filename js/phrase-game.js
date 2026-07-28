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
        this.targetWord = this.currentPhrase.answer.toUpperCase();
        this.normalizedAnswer = this.targetWord.replace(/[^A-Z]/g, '');
        this.attempts = [];
        this.currentAttempt = 0;
        this.isGameOver = false;

        // Hide MC section, Show text input section
        this.mcSection.style.display = 'none';
        this.answerSection.style.display = 'flex';

        this.answerInput.value = '';
        this.answerInput.disabled = false;
        this.btnSubmit.disabled = false;
        this.answerInput.removeAttribute('maxLength');
        this.answerInput.placeholder = `Type the idiom (${this.normalizedAnswer.length} letters)...`;
        this.answerInput.classList.remove('input-success', 'input-error');

        // Add event listeners safely via property assignment
        this.btnSubmit.onclick = () => this.handleGuessSubmit();
        this.answerInput.onkeypress = (e) => { if (e.key === 'Enter') this.handleGuessSubmit(); };

        this.clueTitle.textContent = `GUESS THE IDIOM (${this.normalizedAnswer.length} Letters)`;
        this.clueProgressBar.style.width = `100%`;

        if (this.hintText) {
            this.hintText.textContent = `💡 Hint: ${this.currentPhrase.hint} | Try 1 of 5`;
        }

        UI.addChatMessage('system', `Round ${this.gameState.currentRound} of ${this.gameState.totalRounds} — Wordle Mode! Guess the phrase from the emojis.`);
        
        this.renderClueBoard();
        setTimeout(() => this.answerInput.focus(), 100);
    }

    renderClueBoard() {
        this.clueDisplayArea.innerHTML = '';
        
        const boardWrapper = document.createElement('div');
        boardWrapper.style.padding = '10px';
        boardWrapper.style.width = '100%';
        boardWrapper.style.display = 'flex';
        boardWrapper.style.flexDirection = 'column';
        boardWrapper.style.alignItems = 'center';

        // Idiom Image Clue!
        if (this.currentPhrase.image) {
            const imgDiv = document.createElement('img');
            imgDiv.src = this.currentPhrase.image;
            imgDiv.alt = "Idiom Clue";
            imgDiv.style.width = '100%';
            imgDiv.style.maxWidth = '300px';
            imgDiv.style.borderRadius = '8px';
            imgDiv.style.marginBottom = '15px';
            imgDiv.style.boxShadow = '0 4px 15px rgba(0,0,0,0.5)';
            boardWrapper.appendChild(imgDiv);
        }

        // Emojis!
        const emojiDiv = document.createElement('div');
        emojiDiv.style.fontSize = '3.5rem';
        emojiDiv.style.marginBottom = '20px';
        emojiDiv.style.letterSpacing = '10px';
        emojiDiv.textContent = this.currentPhrase.emojis;
        boardWrapper.appendChild(emojiDiv);

        // Wordle Grid
        const grid = document.createElement('div');
        grid.className = 'wordle-grid';
        grid.style.display = 'flex';
        grid.style.flexDirection = 'column';
        grid.style.gap = '10px';
        grid.style.width = '100%';

        for (let rowIdx = 0; rowIdx < this.maxAttempts; rowIdx++) {
            const row = document.createElement('div');
            row.className = `wordle-row ${rowIdx === this.currentAttempt ? 'active-row' : ''}`;
            row.style.display = 'flex';
            row.style.flexWrap = 'wrap';
            row.style.justifyContent = 'center';
            row.style.gap = '4px';

            const rawGuess = this.attempts[rowIdx] || "";
            const isEvaluated = rowIdx < this.currentAttempt;
            const evaluation = isEvaluated ? this.evaluateGuess(rawGuess) : [];

            let letterIndex = 0;

            for (let i = 0; i < this.targetWord.length; i++) {
                const charTarget = this.targetWord[i];

                if (!/[A-Z]/.test(charTarget)) {
                    // Space or punctuation
                    const spacer = document.createElement('div');
                    spacer.style.width = '12px'; // width of space
                    row.appendChild(spacer);
                } else {
                    const tile = document.createElement('div');
                    tile.className = 'wordle-tile';
                    const char = rawGuess[letterIndex] || "";
                    tile.textContent = char;

                    if (isEvaluated) {
                        const status = evaluation[letterIndex];
                        tile.classList.add(`tile-${status}`, 'tile-flip');
                        tile.style.animationDelay = `${letterIndex * 0.05}s`;
                    } else if (char) {
                        tile.classList.add('tile-filled');
                    }

                    row.appendChild(tile);
                    letterIndex++;
                }
            }
            grid.appendChild(row);
        }

        boardWrapper.appendChild(grid);
        this.clueDisplayArea.appendChild(boardWrapper);
    }

    evaluateGuess(guessNormalized) {
        const result = new Array(this.normalizedAnswer.length).fill('absent');
        const targetArr = this.normalizedAnswer.split('');
        const guessArr = guessNormalized.split('');
        const targetCounts = {};

        targetArr.forEach(ch => {
            targetCounts[ch] = (targetCounts[ch] || 0) + 1;
        });

        for (let i = 0; i < targetArr.length; i++) {
            if (guessArr[i] === targetArr[i]) {
                result[i] = 'correct';
                targetCounts[guessArr[i]]--;
            }
        }

        for (let i = 0; i < targetArr.length; i++) {
            if (result[i] !== 'correct' && targetCounts[guessArr[i]] > 0) {
                result[i] = 'present';
                targetCounts[guessArr[i]]--;
            }
        }

        return result;
    }

    handleGuessSubmit() {
        if (this.isGameOver) return;

        const rawGuess = this.answerInput.value.trim().toUpperCase();
        if (!rawGuess) return;

        const guessNormalized = rawGuess.replace(/[^A-Z]/g, '');

        if (guessNormalized.length !== this.normalizedAnswer.length) {
            this.answerInput.classList.remove('input-error');
            void this.answerInput.offsetWidth;
            this.answerInput.classList.add('input-error');
            UI.playSound('wrong');
            UI.addChatMessage('wrong', `⚠️ Guess must contain exactly ${this.normalizedAnswer.length} letters!`);
            return;
        }

        this.attempts.push(guessNormalized);
        this.currentAttempt++;
        this.answerInput.value = '';

        this.renderClueBoard();

        const pointsMap = [500, 400, 300, 200, 100];

        if (guessNormalized === this.normalizedAnswer) {
            // WIN!
            this.isGameOver = true;
            const points = pointsMap[this.currentAttempt - 1] || 100;

            const panel = document.getElementById('panel-main');
            panel.classList.remove('panel-flash-correct');
            void panel.offsetWidth;
            panel.classList.add('panel-flash-correct');

            UI.playSound('correct');
            UI.showConfetti();
            UI.addChatMessage('correct', `🎉 Spot on! You solved it in attempt ${this.currentAttempt}! +${points} pts`);

            this.revealAnswer(true, points);
        } else if (this.currentAttempt >= this.maxAttempts) {
            // FAIL
            this.isGameOver = true;
            UI.playSound('wrong');
            this.revealAnswer(false, 0);
        } else {
            // Continue next attempt
            this.answerInput.classList.remove('input-error');
            void this.answerInput.offsetWidth;
            this.answerInput.classList.add('input-error');
            
            UI.playSound('wrong');
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
                <h2>${isCorrect ? '✅ IDIOM SOLVED!' : '⏰ OUT OF TRIES!'}</h2>
                ${this.currentPhrase.image ? `<img src="${this.currentPhrase.image}" style="max-height: 140px; border-radius: 8px; margin-top: 10px;">` : ''}
                <div style="font-size: 3.5rem; margin: 10px 0; letter-spacing: 10px;">
                    ${this.currentPhrase.emojis}
                </div>
                <div style="font-size: 2.2rem; margin: 10px 0; color: var(--accent-green); font-weight: 800;">
                    ${this.currentPhrase.answer}
                </div>
                <p>${isCorrect ? `Solved in ${this.currentAttempt} tries! <strong>+${pointsEarned} points</strong>` : `The phrase was "${this.currentPhrase.answer}". 0 points.`}</p>
                <p style="font-size: 1rem; margin-top: 15px; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px;"><em>Fun Fact: ${this.currentPhrase.funFact}</em></p>
            `;
            
            this.clueDisplayArea.appendChild(reveal);

            this.gameState.recordRound(this.currentPhrase.answer, this.currentPhrase.categoryEmoji, pointsEarned, this.currentAttempt, isCorrect);

            if (!isCorrect) {
                UI.addChatMessage('timeout', `⏰ Out of tries! The answer was ${this.currentPhrase.answer}.`);
            }

            if (this.nextRoundTimeout) clearTimeout(this.nextRoundTimeout);
            this.nextRoundTimeout = setTimeout(() => {
                this.gameState.nextRound();
            }, 5500);
        }, 1000);
    }
}
