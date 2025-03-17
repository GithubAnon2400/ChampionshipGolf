class UIManager {
    constructor(game) {
        this.game = game;
        this.elements = {
            startScreen: document.getElementById('start-screen'),
            gameScreen: document.getElementById('game-screen'),
            leaderboardScreen: document.getElementById('leaderboard-screen'),
            gameOverScreen: document.getElementById('game-over-screen'),
            loadingScreen: document.getElementById('loading-screen'),
            playerName: document.getElementById('player-name'),
            startGameBtn: document.getElementById('start-game-btn'),
            playerNameDisplay: document.getElementById('player-name-display'),
            playerScore: document.getElementById('player-score'),
            playerStrokes: document.getElementById('player-strokes'),
            holeNumber: document.getElementById('hole-number'),
            holePar: document.getElementById('hole-par'),
            gameDetails: document.getElementById('game-details'),
            powerMeter: document.getElementById('power-meter'),
            powerIndicator: document.getElementById('power-indicator'),
            swingBtn: document.getElementById('swing-btn'),
            rotateLeft: document.getElementById('rotate-left'),
            rotateRight: document.getElementById('rotate-right'),
            trickShotBtn: document.getElementById('trick-shot-btn'),
            openLeaderboardBtn: document.getElementById('open-leaderboard-btn'),
            closeLeaderboardBtn: document.getElementById('close-leaderboard-btn'),
            playAgainBtn: document.getElementById('play-again-btn'),
            finalScore: document.getElementById('final-score'),
            leaderboardForm: document.getElementById('leaderboard-form'),
            submitScoreBtn: document.getElementById('submit-score-btn'),
            dailyLeaderboardBody: document.getElementById('daily-leaderboard-body'),
            legendsLeaderboardBody: document.getElementById('legends-leaderboard-body'),
            notification: null
        };
    }

    initialize() {
        this.setupEventListeners();
        this.initializeCharacterSelection();
        this.elements.powerIndicator.style.left = '0%';
    }

    initializeScreens() {
        this.showScreen('start');
    }

    setupEventListeners() {
        this.elements.startGameBtn.addEventListener('click', () => {
            const name = this.elements.playerName.value.trim();
            if (name && this.game.state.selectedCharacter) {
                this.game.setPlayerName(name);
                this.game.startGame();
            } else {
                this.showNotification('Please enter a name and select a character!', 2000);
            }
        });

        this.elements.rotateLeft.addEventListener('mousedown', () => this.game.startRotation('left'));
        this.elements.rotateLeft.addEventListener('mouseup', () => this.game.stopRotation());
        this.elements.rotateLeft.addEventListener('mouseleave', () => this.game.stopRotation());
        this.elements.rotateRight.addEventListener('mousedown', () => this.game.startRotation('right'));
        this.elements.rotateRight.addEventListener('mouseup', () => this.game.stopRotation());
        this.elements.rotateRight.addEventListener('mouseleave', () => this.game.stopRotation());

        this.elements.swingBtn.addEventListener('click', () => {
            if (!this.game.state.ballInMotion) {
                this.game.swing(parseInt(this.elements.powerIndicator.style.left) / 3.33);
            }
        });

        this.elements.trickShotBtn.addEventListener('click', () => {
            this.game.state.trickShotActive = !this.game.state.trickShotActive;
            console.log('Trick shot mode:', this.game.state.trickShotActive);
            this.showNotification(this.game.state.trickShotActive ? 'Trick Shot Mode ON!' : 'Trick Shot Mode OFF!', 2000);
        });

        this.elements.openLeaderboardBtn.addEventListener('click', () => this.showScreen('leaderboard'));
        this.elements.closeLeaderboardBtn.addEventListener('click', () => this.showScreen('game'));
        this.elements.playAgainBtn.addEventListener('click', () => {
            this.game.resetGame();
            this.showScreen('start');
        });

        this.elements.leaderboardForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('submission-name').value;
            const email = document.getElementById('submission-email').value;
            if (name && email) {
                this.game.submitScore(name, email);
                this.showNotification('Score submitted successfully!', 2000);
            }
        });

        document.getElementById('power-meter-container').addEventListener('click', (e) => {
            const rect = e.target.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            const power = (clickX / width) * 100;
            this.elements.powerIndicator.style.left = `${Math.min(Math.max(power, 0), 100)}%`;
        });
    }

    initializeCharacterSelection() {
        const characters = document.querySelectorAll('.character');
        characters.forEach(char => {
            char.addEventListener('click', () => {
                characters.forEach(c => c.classList.remove('selected'));
                char.classList.add('selected');
                const characterName = char.getAttribute('data-character');
                this.game.selectCharacter(characterName);
                this.elements.startGameBtn.disabled = false;
                const stats = this.game.state.selectedCharacter?.stats || { power: 5, accuracy: 5, luck: 5 };
                char.querySelectorAll('.stat span').forEach((span, i) => {
                    span.textContent = [stats.power, stats.accuracy, stats.luck][i];
                });
            });
        });
    }

    showScreen(screenId) {
        Object.values(this.elements).filter(el => el instanceof HTMLElement && el.classList.contains('screen')).forEach(screen => {
            screen.style.display = screen.id === screenId ? 'flex' : 'none';
        });
        if (screenId === 'game') {
            this.elements.gameDetails.style.display = 'block';
        } else {
            this.elements.gameDetails.style.display = 'none';
        }
    }

    showLoading(message) {
        this.elements.loadingScreen.querySelector('p').textContent = message || 'Loading game assets...';
        this.elements.loadingScreen.style.display = message ? 'flex' : 'none';
    }

    showNotification(message, duration = 2000) {
        if (this.elements.notification) this.elements.notification.remove();
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #4CAF50;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(notification);
        this.elements.notification = notification;
        setTimeout(() => notification.remove(), duration);
    }

    updatePlayerInfo(name, score, strokes) {
        this.elements.playerNameDisplay.textContent = name;
        this.elements.playerScore.textContent = `Score: ${score > 0 ? '+' + score : score}`;
        this.elements.playerStrokes.textContent = `Strokes: ${strokes}`;
    }

    updateHoleInfo(holeNumber, par) {
        this.elements.holeNumber.textContent = `Hole ${holeNumber}`;
        this.elements.holePar.textContent = `Par ${par}`;
    }

    updateGameDetails({ distanceToHole, maxClubDistance, club }) {
        this.elements.gameDetails.innerHTML = `
            Distance to Hole: ${Math.round(distanceToHole)} yards<br>
            Club: ${club.toUpperCase()} (Max: ${maxClubDistance} yards)
        `;
    }

    showHoleCompletionMessage(strokes, par) {
        const diff = strokes - par;
        this.showNotification(`Hole completed in ${strokes} strokes! (${diff === 0 ? 'Par' : diff > 0 ? `+${diff}` : diff} ${diff !== 0 ? 'to par' : ''})`, 3000);
    }

    updateFinalScore(score) {
        this.elements.finalScore.textContent = score > 0 ? '+' + score : score;
    }

    updateLeaderboard(dailyScores, legendsScores) {
        this.updateLeaderboardTable(this.elements.dailyLeaderboardBody, dailyScores);
        this.updateLeaderboardTable(this.elements.legendsLeaderboardBody, legendsScores);
    }

    updateLeaderboardTable(body, scores) {
        body.innerHTML = '';
        scores.forEach((entry, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${entry.name}</td>
                <td>${entry.score > 0 ? '+' + entry.score : entry.score}</td>
                <td>${formatDate(entry.date)}</td>
            `;
            body.appendChild(row);
        });
    }
}

window.UIManager = UIManager;