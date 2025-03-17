// js/leaderboard.js
class Leaderboard {
    constructor() {
        console.log('Initializing Leaderboard...');
        this.dailyScores = JSON.parse(localStorage.getItem('golf/daily_scores') || '[]');
        this.legendsScores = JSON.parse(localStorage.getItem('golf/legends_scores') || '[]');
    }

    saveScores(type, scores) {
        localStorage.setItem(`golf/${type}_scores`, JSON.stringify(scores));
    }

    getScores(type) {
        return JSON.parse(localStorage.getItem(`golf/${type}_scores`) || '[]');
    }

    // Add a score to the leaderboard
    addScore(type, name, score) {
        const scores = this.getScores(type);
        scores.push({ name, score, date: new Date().toISOString() });
        scores.sort((a, b) => a.score - b.score);
        if (type === 'daily') {
            const today = new Date().toISOString().split('T')[0];
            this.dailyScores = scores.filter(score => score.date.startsWith(today)).slice(0, 10);
            this.saveScores('daily', this.dailyScores);
        } else {
            this.legendsScores = scores.slice(0, 10);
            this.saveScores('legends', this.legendsScores);
        }
    }
}

window.Leaderboard = Leaderboard;