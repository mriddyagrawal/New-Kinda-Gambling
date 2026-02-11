// Game Configuration
const CONFIG = {
    GRID_SIZE: 10,
    STARTING_CREDITS: 1000,
    BET_AMOUNT: 10,
    TIME_STEPS: 10, // Number of time columns (X-axis)
    PRICE_LEVELS: 10, // Number of price rows (Y-axis)
    STEP_DELAY: 200, // ms between time steps
    BASE_PRICE: 100, // Base price for display
    PRICE_STEP: 5, // Price increment per level
    BET_INTENSITY_STEP: 20, // Bet amount per intensity level
    MAX_INTENSITY: 5, // Maximum bet intensity level
};

// Game State
const gameState = {
    credits: CONFIG.STARTING_CREDITS,
    bets: {}, // { "row-col": betAmount }
    volatility: 5,
    isPlaying: false,
    gridCells: [],
    pricePath: [], // Array of {time, price} representing the stock price line
    currentTimeStep: 0,
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

    // Create grid with price levels (rows) and time steps (columns)
    for (let priceLevel = 0; priceLevel < CONFIG.PRICE_LEVELS; priceLevel++) {
        for (let timeStep = 0; timeStep < CONFIG.TIME_STEPS; timeStep++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.priceLevel = priceLevel;
            cell.dataset.timeStep = timeStep;
            
            // Calculate actual price for this level (inverted: top = high price)
            const price = getPriceFromLevel(priceLevel);
            
            // Add cell info display
            const info = document.createElement('div');
            info.className = 'cell-info';
            info.innerHTML = `
                <span class="time-label">T${timeStep}</span>
                <span class="price-label">$${price}</span>
            `;
            cell.appendChild(info);

            // Add hover tooltip
            cell.title = `Time: ${timeStep}, Price: $${price}`;

            // Add click handler for betting
            cell.addEventListener('click', () => handleCellClick(priceLevel, timeStep));

            // Add hover effect to show details
            cell.addEventListener('mouseenter', () => showCellDetails(cell, priceLevel, timeStep, price));
            cell.addEventListener('mouseleave', () => hideCellDetails());

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
function handleCellClick(priceLevel, timeStep) {
    if (gameState.isPlaying) return;

    const cellKey = `${priceLevel}-${timeStep}`;
    
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
    gameState.pricePath = [];
    gameState.currentTimeStep = 0;
    elements.results.style.display = 'none';
    updateUI();
    updateStatus('Game in progress... Watch the price line move through time!');

    // Clear previous path visualization
    clearPathClasses();

    // Starting price level (middle of the grid)
    let currentPriceLevel = Math.floor(CONFIG.PRICE_LEVELS / 2);
    
    // Generate and animate the price path moving through time
    for (let timeStep = 0; timeStep < CONFIG.TIME_STEPS; timeStep++) {
        gameState.currentTimeStep = timeStep;
        
        // Record current position in path
        gameState.pricePath.push({ time: timeStep, price: currentPriceLevel });
        
        // Highlight current column
        highlightColumn(timeStep, true);
        
        // Highlight current cell with glowing marker
        const cell = getCellElement(currentPriceLevel, timeStep);
        cell.classList.add('price-path');
        cell.classList.add('current-price');
        
        // Draw connection line to previous cell if not first step
        if (timeStep > 0) {
            const prevPriceLevel = gameState.pricePath[timeStep - 1].price;
            drawConnectionLine(prevPriceLevel, timeStep - 1, currentPriceLevel, timeStep);
        }
        
        // Wait before next move
        await sleep(CONFIG.STEP_DELAY);
        
        // Remove current highlight but keep path marking
        cell.classList.remove('current-price');
        
        // Dim the previous column
        if (timeStep > 0) {
            highlightColumn(timeStep - 1, false);
        }
        
        // Calculate next price level based on volatility (for next iteration)
        if (timeStep < CONFIG.TIME_STEPS - 1) {
            currentPriceLevel = getNextPriceLevel(currentPriceLevel, gameState.volatility);
        }
    }

    // Highlight final position and final column
    const finalPriceLevel = gameState.pricePath[gameState.pricePath.length - 1].price;
    const finalTimeStep = gameState.pricePath[gameState.pricePath.length - 1].time;
    const finalCell = getCellElement(finalPriceLevel, finalTimeStep);
    finalCell.classList.add('final-price');
    
    // Keep final column highlighted
    highlightColumn(finalTimeStep, true);

    // Calculate and display results
    await sleep(500);
    calculateResults();
}

// Get next price level based on volatility (random walk in price)
function getNextPriceLevel(currentLevel, volatility) {
    // Higher volatility = larger possible price changes
    const maxChange = Math.ceil(volatility / 3); // volatility 1-3: 1 level, 4-6: 2 levels, 7-9: 3 levels, 10: 4 levels
    
    // Random price change (can go up or down)
    const change = Math.floor(Math.random() * (maxChange * 2 + 1)) - maxChange;
    let newLevel = currentLevel + change;

    // Keep within bounds (price can't go negative or beyond max)
    newLevel = Math.max(0, Math.min(CONFIG.PRICE_LEVELS - 1, newLevel));

    return newLevel;
}

// Calculate results and payouts
function calculateResults() {
    // Only the FINAL COLUMN square wins (parimutuel for that column)
    const finalPoint = gameState.pricePath[gameState.pricePath.length - 1];
    const finalCellKey = `${finalPoint.price}-${finalPoint.time}`;
    
    // Calculate total pool from ALL bets
    const totalPool = Object.values(gameState.bets).reduce((sum, bet) => sum + bet, 0);
    
    // Player's bet on the winning square
    const playerBetOnWinner = gameState.bets[finalCellKey] || 0;

    let resultMessage = '';
    let isWin = playerBetOnWinner > 0;

    const finalPrice = getPriceFromLevel(finalPoint.price);

    if (isWin) {
        // Player wins! Gets entire pool since it's single-player
        const payout = totalPool;
        
        gameState.credits += payout;

        resultMessage = `
            <p class="result-win">🎉 YOU WIN! 🎉</p>
            <p>Final price at T${finalPoint.time}: <strong>$${finalPrice}</strong></p>
            <p>Price Level: <strong>${finalPoint.price}</strong></p>
            <p>Your bet on winning square: <strong>${playerBetOnWinner} credits</strong></p>
            <p>Total pool: <strong>${totalPool} credits</strong></p>
            <p>Payout: <strong>+${payout} credits</strong></p>
        `;

        elements.creditsDisplay.classList.add('win');
        setTimeout(() => elements.creditsDisplay.classList.remove('win'), 500);
        
        // Highlight winning cells along the path
        gameState.pricePath.forEach(point => {
            const cellKey = `${point.price}-${point.time}`;
            if (gameState.bets[cellKey]) {
                const cell = getCellElement(point.price, point.time);
                cell.classList.add('path-win');
            }
        });
    } else {
        // Player loses
        resultMessage = `
            <p class="result-loss">😔 YOU LOSE 😔</p>
            <p>Final price at T${finalPoint.time}: <strong>$${finalPrice}</strong></p>
            <p>Price Level: <strong>${finalPoint.price}</strong></p>
            <p>You did not bet on the winning square.</p>
            <p>Total lost: <strong>-${totalPool} credits</strong></p>
        `;

        elements.creditsDisplay.classList.add('loss');
        setTimeout(() => elements.creditsDisplay.classList.remove('loss'), 500);

        // Mark losing bet cells
        Object.keys(gameState.bets).forEach(cellKey => {
            if (cellKey !== finalCellKey) {
                const [priceLevel, timeStep] = cellKey.split('-').map(Number);
                const cell = getCellElement(priceLevel, timeStep);
                cell.classList.add('lost-bet');
            }
        });
    }

    elements.resultsContent.innerHTML = resultMessage;
    elements.results.style.display = 'block';

    updateStatus(isWin ? 'You won! Click Reset to play again.' : 'You lost. Click Reset to try again.');
    
    gameState.isPlaying = false;
    updateUI();
}

// Helper function to get price from price level
function getPriceFromLevel(priceLevel) {
    return CONFIG.BASE_PRICE + (CONFIG.PRICE_LEVELS - 1 - priceLevel) * CONFIG.PRICE_STEP;
}

// Reset the game
function resetGame() {
    gameState.credits = CONFIG.STARTING_CREDITS;
    gameState.bets = {};
    gameState.isPlaying = false;
    gameState.pricePath = [];
    gameState.currentTimeStep = 0;

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
    updateStatus('Place your bets! Click on cells to bet on the price path.');
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
        const priceLevel = parseInt(cell.dataset.priceLevel);
        const timeStep = parseInt(cell.dataset.timeStep);
        const cellKey = `${priceLevel}-${timeStep}`;
        const betAmount = gameState.bets[cellKey] || 0;

        // Remove existing bet display
        let betDisplay = cell.querySelector('.bet-amount');
        if (betDisplay) {
            betDisplay.remove();
        }

        if (betAmount > 0) {
            cell.classList.add('has-bet');
            // Add intensity class based on bet amount
            const intensity = Math.min(Math.floor(betAmount / CONFIG.BET_INTENSITY_STEP), CONFIG.MAX_INTENSITY);
            cell.dataset.betIntensity = intensity;
            
            betDisplay = document.createElement('div');
            betDisplay.className = 'bet-amount';
            betDisplay.textContent = `$${betAmount}`;
            cell.appendChild(betDisplay);
        } else {
            cell.classList.remove('has-bet');
            delete cell.dataset.betIntensity;
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

// Clear path classes from all cells
function clearPathClasses() {
    gameState.gridCells.forEach(cell => {
        cell.classList.remove('price-path', 'current-price', 'final-price', 'active-column', 'path-win');
    });
}

// Highlight a column (for scrolling effect)
function highlightColumn(timeStep, active) {
    for (let priceLevel = 0; priceLevel < CONFIG.PRICE_LEVELS; priceLevel++) {
        const cell = getCellElement(priceLevel, timeStep);
        if (active) {
            cell.classList.add('active-column');
        } else {
            cell.classList.remove('active-column');
        }
    }
}

// Draw visual connection line between cells (SVG overlay could be added here)
function drawConnectionLine(fromPrice, fromTime, toPrice, toTime) {
    // For now, we'll use CSS classes to create the visual connection
    // A more advanced implementation could add SVG lines
    const fromCell = getCellElement(fromPrice, fromTime);
    const toCell = getCellElement(toPrice, toTime);
    
    // Add directional class
    if (toPrice < fromPrice) {
        toCell.classList.add('price-up'); // Lower index = higher price
    } else if (toPrice > fromPrice) {
        toCell.classList.add('price-down');
    } else {
        toCell.classList.add('price-flat');
    }
}

// Show cell details on hover
function showCellDetails(cell, priceLevel, timeStep, price) {
    if (gameState.isPlaying) return;
    
    const cellKey = `${priceLevel}-${timeStep}`;
    const betAmount = gameState.bets[cellKey] || 0;
    const totalPool = Object.values(gameState.bets).reduce((sum, bet) => sum + bet, 0);
    
    // Calculate implied odds (simple version)
    const impliedOdds = totalPool > 0 ? (totalPool / Math.max(betAmount, 1)).toFixed(2) : 'N/A';
    
    // Update tooltip
    cell.title = `Time Step: ${timeStep}\nPrice Level: $${price}\nYour Bet: $${betAmount}\nImplied Odds: ${impliedOdds}x`;
}

// Hide cell details
function hideCellDetails() {
    // Placeholder for future tooltip implementation
}

// Get cell element by price level and time step
function getCellElement(priceLevel, timeStep) {
    return gameState.gridCells[priceLevel * CONFIG.TIME_STEPS + timeStep];
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
