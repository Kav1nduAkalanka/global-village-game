const GameState = {
    playerName: "Guest",
    playerAvatar: "🌍",
    currentGameType: null, // "country" | "phrase"
    currentRound: 0,
    totalRounds: 5,
    score: 0,
    roundHistory: [],
    currentClueIndex: 0,
    targetsList: [], // Shuffled list of countries or phrases for the game

    initGame(type) {
        this.currentGameType = type;
        this.currentRound = 0;
        this.score = 0;
        this.roundHistory = [];

        // Read mode-specific round setting from dropdown
        const selectId = type === 'country' ? 'select-country-rounds' : 'select-phrase-rounds';
        const defaultCount = type === 'country' ? 5 : 1;
        const roundsSelect = document.getElementById(selectId);
        
        if (roundsSelect) {
            this.totalRounds = parseInt(roundsSelect.value, 10) || defaultCount;
        } else {
            this.totalRounds = defaultCount;
        }

        const totalRoundsElem = document.getElementById('total-rounds-count');
        if (totalRoundsElem) {
            totalRoundsElem.textContent = this.totalRounds;
        }
        
        // Setup data
        let rawList = type === 'country' ? [...COUNTRIES] : [...PHRASES];
        this.targetsList = this.shuffle(rawList).slice(0, this.totalRounds);

        this.updateScoreDisplay();
        document.getElementById('round-history-list').innerHTML = '';
        UI.clearChat();
        
        this.nextRound();
    },

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    getCurrentTarget() {
        return this.targetsList[this.currentRound - 1];
    },

    nextRound() {
        this.currentRound++;
        if (this.currentRound > this.totalRounds) {
            this.showResults();
            return;
        }

        document.getElementById('round-number').textContent = this.currentRound;
        
        if (this.currentGameType === 'country') {
            gameInstance = new CountryGame(this);
            gameInstance.startRound();
        } else {
            gameInstance = new PhraseGame(this);
            gameInstance.startRound();
        }
    },

    recordRound(answer, icon, points, clueNum, isCorrect) {
        this.score += points;
        this.updateScoreDisplay();

        this.roundHistory.push({
            answer, icon, points, clueNum, isCorrect
        });

        // Update left panel
        const historyList = document.getElementById('round-history-list');
        const item = document.createElement('div');
        item.className = `history-item ${isCorrect ? 'correct' : 'wrong'}`;
        item.innerHTML = `
            <span>${icon} ${answer}</span>
            <span>${isCorrect ? `+${points}` : '0'}</span>
        `;
        historyList.appendChild(item);
    },

    updateScoreDisplay() {
        const scoreElem = document.getElementById('current-score');
        if (scoreElem) {
            scoreElem.textContent = this.score;
            scoreElem.classList.remove('score-pop');
            void scoreElem.offsetWidth; // trigger reflow
            scoreElem.classList.add('score-pop');
        }
    },

    showResults() {
        showScreen('screen-results');
        document.getElementById('final-score-value').textContent = this.score;
        
        let grade = "Explorer";
        if (this.score >= 2000) grade = "True Legend 🌟";
        else if (this.score >= 1200) grade = "World Citizen 🌍";
        else if (this.score >= 500) grade = "Globetrotter 🧳";
        
        document.getElementById('player-grade').textContent = grade;

        const resultsList = document.getElementById('results-history-list');
        resultsList.innerHTML = '';
        
        this.roundHistory.forEach((r, i) => {
            const item = document.createElement('div');
            item.className = 'res-item';
            
            let stars = "";
            if (r.isCorrect) {
                const numStars = 6 - r.clueNum; // Clue 1 = 5 stars, Clue 5 = 1 star
                stars = "⭐".repeat(numStars);
            }

            item.innerHTML = `
                <div>${i + 1}. ${r.icon} ${r.answer} ${r.isCorrect ? '✅' : '❌'}</div>
                <div>
                    <span style="margin-right: 15px;">${r.isCorrect ? `+${r.points}` : '0'}</span>
                    <span class="res-stars">${stars}</span>
                </div>
            `;
            resultsList.appendChild(item);
        });

        UI.showConfetti();
    }
};

let gameInstance = null;
const avatars = ["🌍", "😎", "👾", "🦊", "🚀", "🌮", "🦁"];
let currentAvatarIdx = 0;

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// Setup Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    
    // Avatar selection
    document.getElementById('btn-next-avatar').addEventListener('click', () => {
        currentAvatarIdx = (currentAvatarIdx + 1) % avatars.length;
        const avatar = avatars[currentAvatarIdx];
        document.getElementById('player-avatar').textContent = avatar;
        GameState.playerAvatar = avatar;
    });

    // Start Games
    document.getElementById('btn-start-country').addEventListener('click', () => {
        const name = document.getElementById('player-name').value.trim();
        if (name) GameState.playerName = name;
        showScreen('screen-game');
        GameState.initGame('country');
    });

    document.getElementById('btn-start-phrase').addEventListener('click', () => {
        const name = document.getElementById('player-name').value.trim();
        if (name) GameState.playerName = name;
        showScreen('screen-game');
        GameState.initGame('phrase');
    });

    // Play again
    document.getElementById('btn-play-again').addEventListener('click', () => {
        showScreen('screen-game');
        GameState.initGame(GameState.currentGameType);
    });

    // Home from Results
    document.getElementById('btn-home').addEventListener('click', () => {
        showScreen('screen-home');
    });

    // Quit from Game
    document.getElementById('btn-quit-game').addEventListener('click', () => {
        if (gameInstance) {
            if (gameInstance.timer) gameInstance.timer.stop();
            if (gameInstance.nextRoundTimeout) clearTimeout(gameInstance.nextRoundTimeout);
        }
        showScreen('screen-home');
    });
});
