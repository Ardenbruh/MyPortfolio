import { WORDS } from './words.js';

/* =================================
   SOUND SYSTEM
   ================================= */
class GameSounds {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.initAudio();
    }

    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
            this.enabled = false;
        }
    }

    playTone(frequency, duration, type = 'sine', volume = 0.1) {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // Sound methods
    keyPress() { this.playTone(800, 0.1, 'square', 0.05); }
    backspace() { this.playTone(400, 0.15, 'sawtooth', 0.04); }
    correct() { this.playTone(523.25, 0.2, 'sine', 0.1); }
    present() { this.playTone(392, 0.2, 'triangle', 0.08); }
    absent() { this.playTone(220, 0.15, 'square', 0.06); }
    submit() { this.playTone(659.25, 0.1, 'sine', 0.08); }

    win() {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.4, 'sine', 0.12), i * 150);
        });
    }

    lose() {
        const notes = [440, 369.99, 293.66, 220];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.3, 'triangle', 0.1), i * 200);
        });
    }

    newGame() {
        this.playTone(880, 0.2, 'sine', 0.1);
        setTimeout(() => this.playTone(1108.73, 0.2, 'sine', 0.08), 100);
    }

    toggle() {
        this.enabled = !this.enabled;
        if (this.enabled && !this.audioContext) this.initAudio();
    }
}

/* =================================
   GAME STATE
   ================================= */
class GameState {
    constructor() {
        this.currentWord = '';
        this.currentRow = 0;
        this.currentCol = 0;
        this.gameOver = false;
        this.gameBoard = [];
        this.lastFiveKeys = [];
        this.hintsUsed = 0;
        this.maxHintsPerGame = 2;
        this.stats = {
            gamesPlayed: 0,
            gamesWon: 0,
            currentStreak: 0,
            maxStreak: 0
        };
    }

    reset() {
        this.currentWord = WORDS[Math.floor(Math.random() * WORDS.length)];
        this.currentRow = 0;
        this.currentCol = 0;
        this.gameOver = false;
        this.hintsUsed = 0;
        this.lastFiveKeys = [];
        console.log('New word:', this.currentWord);
    }

    updateStats(won) {
        this.stats.gamesPlayed++;
        if (won) {
            this.stats.gamesWon++;
            this.stats.currentStreak++;
            if (this.stats.currentStreak > this.stats.maxStreak) {
                this.stats.maxStreak = this.stats.currentStreak;
            }
        } else {
            this.stats.currentStreak = 0;
        }
    }
}

/* =================================
   GAME CONTROLLER
   ================================= */
class WordleGame {
    constructor() {
        this.sounds = new GameSounds();
        this.state = new GameState();
        this.init();
    }

    init() {
        this.loadStats();
        this.createGameBoard();
        this.newGame();
        this.setupEventListeners();
        this.loadThemePreference();
    }

    createGameBoard() {
        const board = document.getElementById('gameBoard');
        board.innerHTML = '';
        this.state.gameBoard = [];

        for (let i = 0; i < 6; i++) {
            const row = document.createElement('div');
            row.className = 'word-row';
            const rowData = [];

            for (let j = 0; j < 5; j++) {
                const tile = document.createElement('div');
                tile.className = 'letter-tile';
                tile.id = `tile-${i}-${j}`;
                row.appendChild(tile);
                rowData.push('');
            }

            board.appendChild(row);
            this.state.gameBoard.push(rowData);
        }
    }

    newGame() {
        this.state.reset();
        this.resetBoard();
        this.resetKeyboard();
        this.hideMessage();
        this.enableKeyboard(); // Re-enable keyboard for new game
        this.sounds.newGame();
        console.log('New game started, gameOver set to false');
    }

    resetBoard() {
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 5; j++) {
                this.state.gameBoard[i][j] = '';
                const tile = document.getElementById(`tile-${i}-${j}`);
                tile.textContent = '';
                tile.className = 'letter-tile';
            }
        }
    }

    resetKeyboard() {
        document.querySelectorAll('.key').forEach(key => {
            key.className = 'key' + (key.dataset.key === 'Enter' || key.dataset.key === 'Backspace' ? ' wide' : '');
        });
    }

    setupEventListeners() {
        // Virtual keyboard
        document.querySelectorAll('.key').forEach(key => {
            key.addEventListener('click', () => {
                // Get the data-key attribute value
                const keyValue = key.getAttribute('data-key');
                this.handleKeyPress(keyValue);
            });
        });
        
        // Physical keyboard
        document.addEventListener('keydown', (e) => {
            if (e.altKey || e.ctrlKey || e.metaKey) return;
            
            // Handle spacebar for new game
            if (e.code === 'Space') {
                e.preventDefault();
                this.newGame();
                return;
            }
            
            const key = e.key.toUpperCase();
            if (key === 'ENTER' || key === 'BACKSPACE' || 
                (key.length === 1 && /^[A-Z]$/.test(key))) {
                e.preventDefault();
                this.handleKeyPress(key);
            }
        });
    }

    handleKeyPress(key) {
        // Add comprehensive game over check at the very beginning
        if (this.state.gameOver) {
            console.log('Game is over, ignoring key press');
            return;
        }

        // Track keys for test mode
        if (key.match(/[A-Z]/) && key.length === 1) {
            this.state.lastFiveKeys.push(key);
            if (this.state.lastFiveKeys.length > 5) {
                this.state.lastFiveKeys.shift();
            }
            
            if (this.state.lastFiveKeys.join('') === 'QWERT') {
                this.showMessage(`Current word is: ${this.state.currentWord}`, "info");
                this.state.lastFiveKeys = [];
                return;
            }
        }

        // Handle different key types
        if (key === 'ENTER' || key === 'Enter') {
            if (this.state.currentCol === 5) {
                this.sounds.submit();
                this.submitGuess();
            }
        } else if (key === 'BACKSPACE' || key === 'Backspace') {
            if (this.state.currentCol > 0) {
                this.sounds.backspace();
                this.state.currentCol--;
                this.state.gameBoard[this.state.currentRow][this.state.currentCol] = '';
                this.updateDisplay();
            }
        } else if (key.match(/[A-Z]/) && this.state.currentCol < 5 && key.length === 1) {
            this.sounds.keyPress();
            this.state.gameBoard[this.state.currentRow][this.state.currentCol] = key;
            this.state.currentCol++;
            this.updateDisplay();
        }
    }

    updateDisplay() {
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 5; j++) {
                const tile = document.getElementById(`tile-${i}-${j}`);
                tile.textContent = this.state.gameBoard[i][j];
                tile.classList.toggle('filled', !!this.state.gameBoard[i][j]);
            }
        }
    }

    submitGuess() {
        // Don't allow submission if game is over
        if (this.state.gameOver) return;
        
        const guess = this.state.gameBoard[this.state.currentRow].join('');
        if (guess.length !== 5) return;
        
        const result = this.checkGuess(guess);
        this.animateRow(this.state.currentRow, result);

        setTimeout(() => {
            this.updateKeyboard(guess, result);
            
            if (guess === this.state.currentWord) {
                this.handleWin();
            } else if (this.state.currentRow === 5) {
                this.handleLoss();
            } else {
                this.state.currentRow++;
                this.state.currentCol = 0;
            }
        }, 1000);
    }

    checkGuess(guess) {
        const result = [];
        const wordArray = this.state.currentWord.split('');
        const guessArray = guess.split('');

        // First pass: mark correct letters
        for (let i = 0; i < 5; i++) {
            if (guessArray[i] === wordArray[i]) {
                result[i] = 'correct';
                wordArray[i] = null;
            }
        }

        // Second pass: mark present letters
        for (let i = 0; i < 5; i++) {
            if (result[i] !== 'correct') {
                const letterIndex = wordArray.indexOf(guessArray[i]);
                if (letterIndex !== -1) {
                    result[i] = 'present';
                    wordArray[letterIndex] = null;
                } else {
                    result[i] = 'absent';
                }
            }
        }

        return result;
    }

    animateRow(row, result) {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const tile = document.getElementById(`tile-${row}-${i}`);
                tile.classList.add(result[i]);
                
                // Play sound based on result
                this.sounds[result[i]]();
            }, i * 100);
        }
    }

    updateKeyboard(guess, result) {
        for (let i = 0; i < guess.length; i++) {
            const key = document.querySelector(`[data-key="${guess[i]}"]`);
            if (key && !key.classList.contains('correct')) {
                if (result[i] === 'correct') {
                    key.className = 'key correct';
                } else if (result[i] === 'present' && !key.classList.contains('correct')) {
                    key.className = 'key present';
                } else if (result[i] === 'absent' && !key.classList.contains('correct') && !key.classList.contains('present')) {
                    key.className = 'key absent';
                }
            }
        }
    }

    handleWin() {
        console.log('Game won! Setting gameOver to true');
        this.state.gameOver = true; // Set this IMMEDIATELY
        this.state.updateStats(true);
        
        // Disable all keyboard interactions immediately
        this.disableKeyboard();
        
        // Show confetti immediately instead of waiting
        this.celebrateWin();
        
        // Play win sound with shorter delay
        setTimeout(() => {
            this.sounds.win();
        }, 200);
        
        this.showMessage('Congratulations! You guessed it!', 'win');
        this.saveStats();
        this.updateStatsDisplay();
    }

    handleLoss() {
        console.log('Game lost! Setting gameOver to true');
        this.state.gameOver = true; // Set this IMMEDIATELY
        this.state.updateStats(false);
        
        // Disable all keyboard interactions immediately
        this.disableKeyboard();
        
        setTimeout(() => this.sounds.lose(), 200);
        this.showMessage(`Game Over! The word was: ${this.state.currentWord}`, 'lose');
        this.saveStats();
        this.updateStatsDisplay();
    }

    disableKeyboard() {
        // Disable virtual keyboard buttons
        document.querySelectorAll('.key').forEach(key => {
            key.style.pointerEvents = 'none';
            key.style.opacity = '0.5';
        });
    }

    enableKeyboard() {
        // Re-enable virtual keyboard buttons
        document.querySelectorAll('.key').forEach(key => {
            key.style.pointerEvents = 'auto';
            key.style.opacity = '1';
        });
    }

    getHint() {
        const { gameOver, hintsUsed, maxHintsPerGame, currentRow, gameBoard, currentWord } = this.state;
        
        if (gameOver || hintsUsed >= maxHintsPerGame) {
            const message = gameOver ? "Game is already over!" : "No more hints available!";
            this.showMessage(message, "info");
            return;
        }
        
        if (currentRow === 0) {
            this.showMessage("Make at least one guess first!", "info");
            return;
        }
        
        // Check if player has at least one correct letter
        let hasCorrectLetter = false;
        for (let row = 0; row < currentRow && !hasCorrectLetter; row++) {
            for (let col = 0; col < 5; col++) {
                if (gameBoard[row][col] === currentWord[col]) {
                    hasCorrectLetter = true;
                    break;
                }
            }
        }
        
        if (!hasCorrectLetter) {
            this.showMessage("You need to guess at least one letter correctly first!", "info");
            return;
        }
        
        // Find unguessed positions
        const unguessedPositions = [];
        for (let i = 0; i < 5; i++) {
            let positionCorrectlyGuessed = false;
            
            for (let row = 0; row < currentRow; row++) {
                if (gameBoard[row][i] === currentWord[i]) {
                    positionCorrectlyGuessed = true;
                    break;
                }
            }
            
            if (!positionCorrectlyGuessed) {
                unguessedPositions.push(i);
            }
        }
        
        if (unguessedPositions.length === 0) {
            this.showMessage("You've already found all letter positions!", "info");
            return;
        }
        
        // Provide hint
        const position = unguessedPositions[Math.floor(Math.random() * unguessedPositions.length)];
        const correctLetter = currentWord[position];
        
        this.showMessage(`Letter "${correctLetter}" is at position ${position + 1}`, "info");
        this.state.hintsUsed++;
        
        const hintBtn = document.getElementById('hintBtn');
        hintBtn.disabled = true;
        hintBtn.classList.add('disabled');
    }

    celebrateWin() {
        console.log('Starting confetti celebration');
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080'];
        
        // Create confetti in bursts for immediate effect
        for (let burst = 0; burst < 3; burst++) {
            setTimeout(() => {
                for (let i = 0; i < 40; i++) {
                    setTimeout(() => {
                        const confetti = document.createElement('div');
                        confetti.className = 'confetti';
                        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                        confetti.style.left = Math.random() * 100 + 'vw';
                        confetti.style.animationDuration = (Math.random() * 1.5 + 2) + 's'; // 2-3.5 seconds (faster)
                        confetti.style.animationDelay = '0s'; // No delay
                        document.body.appendChild(confetti);
                        
                        // Remove confetti after animation
                        setTimeout(() => {
                            if (confetti.parentNode) {
                                confetti.remove();
                            }
                        }, 4000); // Remove sooner
                    }, i * 20); // Faster stagger (20ms instead of 50ms)
                }
            }, burst * 300); // Multiple bursts
        }
    }

    async showWordDefinition() {
        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${this.state.currentWord.toLowerCase()}`);
            const data = await response.json();
            
            if (data?.[0]?.meanings?.[0]?.definitions?.[0]) {
                const definition = data[0].meanings[0].definitions[0].definition;
                this.showMessage(`${this.state.currentWord}: ${definition}`, "info");
            }
        } catch (error) {
            console.error("Failed to fetch definition:", error);
        }
    }

    /* =================================
       UI METHODS
       ================================= */
    showMessage(text, type) {
        const message = document.getElementById('message');
        message.textContent = text;
        message.className = `message ${type} show`;
    }

    hideMessage() {
        const message = document.getElementById('message');
        message.className = 'message';
    }

    updateStatsDisplay() {
        const { stats } = this.state;
        document.getElementById('gamesPlayed').textContent = stats.gamesPlayed;
        document.getElementById('winPercentage').textContent = 
            stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;
        document.getElementById('currentStreak').textContent = stats.currentStreak;
    }

    toggleSound() {
        this.sounds.toggle();
        const soundBtn = document.getElementById('soundBtn');
        if (this.sounds.enabled) {
            soundBtn.textContent = '🔊 Sound On';
            this.sounds.keyPress();
        } else {
            soundBtn.textContent = '🔇 Sound Off';
        }
    }

    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const isDarkMode = document.body.classList.contains('dark-theme');
        
        const themeBtn = document.getElementById('themeBtn');
        themeBtn.textContent = isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
        
        localStorage.setItem('darkMode', isDarkMode);
    }

    loadThemePreference() {
        const darkModePreference = localStorage.getItem('darkMode');
        
        if (darkModePreference === 'true') {
            document.body.classList.add('dark-theme');
            const themeBtn = document.getElementById('themeBtn');
            if (themeBtn) {
                themeBtn.textContent = '☀️ Light Mode';
            }
        }
    }

    loadStats() {
        // In a real app, this would load from localStorage
    }

    saveStats() {
        // In a real app, this would save to localStorage
    }
}

/* =================================
   INITIALIZE GAME
   ================================= */
const game = new WordleGame();

// Global functions for HTML buttons
window.newGame = () => game.newGame();
window.getHint = () => game.getHint();
window.toggleSound = () => game.toggleSound();
window.toggleTheme = () => game.toggleTheme();