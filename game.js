// Game Configuration
const CONFIG = {
    GRID_SIZE: 10,
    STARTING_CREDITS: 1000,
    BET_AMOUNT: 10,
    MIN_STEPS: 20,
    MAX_STEPS: 50,
    STEP_DELAY: 150, // ms between cursor moves
};

// Game State
const gameState = {
    credits: CONFIG.STARTING_CREDITS,
    bets: {}, // { "row-col": betAmount }
    volatility: 5,
    isPlaying: false,
    gridCells: [],
    currentPosition: null,
    finalPosition: null,
};

// DOM Elements
const elements = {
    gameBoard: null,
    creditsDisplay: null,
    volatilitySlider: null,
    volatilityValue: null,
    startBtn: null,
    resetBtn: null,
    totalBet: null,
    cellsCount: null,
    gameStatus: null,
    results: null,
    resultsContent: null,
};

// Initialize the game
function initGame() {
    // Get DOM elements
    elements.gameBoard = document.getElementById('game-board');
    elements.creditsDisplay = document.getElementById('credits');
    elements.volatilitySlider = document.getElementById('volatility-slider');
    elements.volatilityValue = document.getElementById('volatility-value');
    elements.startBtn = document.getElementById('start-btn');
    elements.resetBtn = document.getElementById('reset-btn');
    elements.totalBet = document.getElementById('total-bet');
    elements.cellsCount = document.getElementById('cells-count');
    elements.gameStatus = document.getElementById('game-status');
    elements.results = document.getElementById('results');
    elements.resultsContent = document.getElementById('results-content');

    // Create grid
    createGrid();

    // Setup event listeners
    setupEventListeners();

    // Update UI
    updateUI();
}

// Create the game grid
function createGrid() {
    elements.gameBoard.innerHTML = '';
    gameState.gridCells = [];

    for (let row = 0; row < CONFIG.GRID_SIZE; row++) {
        for (let col = 0; col < CONFIG.GRID_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            // Add cell coordinate display
            const coord = document.createElement('div');
            coord.className = 'cell-coord';
            coord.textContent = `${row},${col}`;
            cell.appendChild(coord);

            // Add click handler for betting
            cell.addEventListener('click', () => handleCellClick(row, col));

            elements.gameBoard.appendChild(cell);
            gameState.gridCells.push(cell);
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    elements.volatilitySlider.addEventListener('input', (e) => {
        gameState.volatility = parseInt(e.target.value);
        elements.volatilityValue.textContent = gameState.volatility;
    });

    elements.startBtn.addEventListener('click', startGame);
    elements.resetBtn.addEventListener('click', resetGame);
}

// Handle cell click for betting
function handleCellClick(row, col) {
    if (gameState.isPlaying) return;

    const cellKey = `${row}-${col}`;
    
    // Check if player has enough credits
    if (gameState.credits < CONFIG.BET_AMOUNT) {
        updateStatus('Insufficient credits!');
        return;
    }

    // Place bet
    if (!gameState.bets[cellKey]) {
        gameState.bets[cellKey] = 0;
    }
    gameState.bets[cellKey] += CONFIG.BET_AMOUNT;
    gameState.credits -= CONFIG.BET_AMOUNT;

    updateUI();
    updateStatus('Bet placed! Click Start when ready.');
}

// Start the game
async function startGame() {
    gameState.isPlaying = true;
    elements.results.style.display = 'none';
    updateUI();
    updateStatus('Game in progress... Watch the cursor!');

    // Clear previous cursor positions
    clearCursorClasses();

    // Determine number of steps based on volatility
    const steps = Math.floor(
        CONFIG.MIN_STEPS + (CONFIG.MAX_STEPS - CONFIG.MIN_STEPS) * (gameState.volatility / 10)
    );

    // Random starting position
    let row = Math.floor(Math.random() * CONFIG.GRID_SIZE);
    let col = Math.floor(Math.random() * CONFIG.GRID_SIZE);

    // Animate cursor movement
    for (let step = 0; step < steps; step++) {
        // Clear previous cursor
        clearCursorClasses();

        // Update current position
        gameState.currentPosition = { row, col };
        const cell = getCellElement(row, col);
        cell.classList.add('cursor');

        // Wait before next move
        await sleep(CONFIG.STEP_DELAY);

        // Calculate next position based on volatility
        const move = getNextMove(row, col, gameState.volatility);
        row = move.row;
        col = move.col;
    }

    // Final position
    clearCursorClasses();
    gameState.finalPosition = { row, col };
    const finalCell = getCellElement(row, col);
    finalCell.classList.add('final');

    // Calculate and display results
    await sleep(500);
    calculateResults();
}

// Get next move based on volatility
function getNextMove(currentRow, currentCol, volatility) {
    // Higher volatility = larger possible jumps
    const maxJump = Math.ceil(volatility / 3); // volatility 1-3: 1 cell, 4-6: 2 cells, 7-10: 3-4 cells
    
    const rowChange = Math.floor(Math.random() * (maxJump * 2 + 1)) - maxJump;
    const colChange = Math.floor(Math.random() * (maxJump * 2 + 1)) - maxJump;

    let newRow = currentRow + rowChange;
    let newCol = currentCol + colChange;

    // Wrap around edges
    newRow = (newRow + CONFIG.GRID_SIZE) % CONFIG.GRID_SIZE;
    newCol = (newCol + CONFIG.GRID_SIZE) % CONFIG.GRID_SIZE;

    return { row: newRow, col: newCol };
}

// Calculate results and payouts
function calculateResults() {
    const finalKey = `${gameState.finalPosition.row}-${gameState.finalPosition.col}`;
    const totalPool = Object.values(gameState.bets).reduce((sum, bet) => sum + bet, 0);
    const playerBetOnWinner = gameState.bets[finalKey] || 0;

    let resultMessage = '';
    let isWin = false;

    if (playerBetOnWinner > 0) {
        // Player wins! Gets the entire pool since it's single player
        const payout = totalPool;
        gameState.credits += payout;
        isWin = true;

        resultMessage = `
            <p class="result-win">🎉 YOU WIN! 🎉</p>
            <p>Cursor landed on: <strong>[${gameState.finalPosition.row}, ${gameState.finalPosition.col}]</strong></p>
            <p>Your bet on this cell: <strong>${playerBetOnWinner} credits</strong></p>
            <p>Total pool: <strong>${totalPool} credits</strong></p>
            <p>Payout: <strong>+${payout} credits</strong></p>
        `;

        elements.creditsDisplay.classList.add('win');
        setTimeout(() => elements.creditsDisplay.classList.remove('win'), 500);
    } else {
        // Player loses
        resultMessage = `
            <p class="result-loss">😔 YOU LOSE 😔</p>
            <p>Cursor landed on: <strong>[${gameState.finalPosition.row}, ${gameState.finalPosition.col}]</strong></p>
            <p>You did not bet on this cell.</p>
            <p>Total lost: <strong>-${totalPool} credits</strong></p>
        `;

        elements.creditsDisplay.classList.add('loss');
        setTimeout(() => elements.creditsDisplay.classList.remove('loss'), 500);

        // Mark losing bet cells
        Object.keys(gameState.bets).forEach(cellKey => {
            const [row, col] = cellKey.split('-').map(Number);
            const cell = getCellElement(row, col);
            cell.classList.add('lost-bet');
        });
    }

    elements.resultsContent.innerHTML = resultMessage;
    elements.results.style.display = 'block';

    updateStatus(isWin ? 'You won! Click Reset to play again.' : 'You lost. Click Reset to try again.');
    
    gameState.isPlaying = false;
    updateUI();
}

// Reset the game
function resetGame() {
    gameState.credits = CONFIG.STARTING_CREDITS;
    gameState.bets = {};
    gameState.isPlaying = false;
    gameState.currentPosition = null;
    gameState.finalPosition = null;

    // Clear all cell classes
    gameState.gridCells.forEach(cell => {
        cell.className = 'cell';
        // Remove bet amount display
        const betDisplay = cell.querySelector('.bet-amount');
        if (betDisplay) {
            betDisplay.remove();
        }
    });

    elements.results.style.display = 'none';
    updateUI();
    updateStatus('Place your bets! Click on cells to bet.');
}

// Update UI elements
function updateUI() {
    // Update credits display
    elements.creditsDisplay.textContent = gameState.credits;

    // Update total bet and cells count
    const totalBet = Object.values(gameState.bets).reduce((sum, bet) => sum + bet, 0);
    const cellsWithBets = Object.keys(gameState.bets).length;
    elements.totalBet.textContent = totalBet;
    elements.cellsCount.textContent = cellsWithBets;

    // Update bet displays on cells
    gameState.gridCells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const cellKey = `${row}-${col}`;
        const betAmount = gameState.bets[cellKey] || 0;

        // Remove existing bet display
        let betDisplay = cell.querySelector('.bet-amount');
        if (betDisplay) {
            betDisplay.remove();
        }

        if (betAmount > 0) {
            cell.classList.add('has-bet');
            betDisplay = document.createElement('div');
            betDisplay.className = 'bet-amount';
            betDisplay.textContent = `${betAmount}`;
            cell.appendChild(betDisplay);
        } else {
            cell.classList.remove('has-bet');
        }

        // Update clickability
        if (gameState.isPlaying) {
            cell.classList.add('no-bet-allowed');
        } else {
            cell.classList.remove('no-bet-allowed');
        }
    });

    // Update button states
    elements.startBtn.disabled = gameState.isPlaying || Object.keys(gameState.bets).length === 0;
    elements.volatilitySlider.disabled = gameState.isPlaying;
}

// Update status message
function updateStatus(message) {
    elements.gameStatus.textContent = message;
}

// Clear cursor classes from all cells
function clearCursorClasses() {
    gameState.gridCells.forEach(cell => {
        cell.classList.remove('cursor');
    });
}

// Get cell element by row and col
function getCellElement(row, col) {
    return gameState.gridCells[row * CONFIG.GRID_SIZE + col];
}

// Sleep utility
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Initialize game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}
