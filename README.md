# 🎰 Roulette for Stocks 📈

A browser-based gambling game that simulates stock market volatility through a random-walk cursor on a grid board. Players place bets on cells and win if the cursor lands on their chosen cell(s). Features a parimutuel betting system where winners take the entire pool!

## 🎮 Game Description

**Roulette for Stocks** combines the excitement of roulette with the unpredictability of stock market movements. A cursor performs a random walk across a 10×10 grid, with movement patterns influenced by a volatility setting. Players bet virtual credits on which cell(s) the cursor will land on, creating a thrilling casino-meets-trading experience.

## 🎯 How to Play

1. **Start with Credits**: You begin with 1,000 virtual credits
2. **Adjust Volatility**: Use the slider to control market volatility (1-10)
   - Low volatility = predictable, small movements
   - High volatility = erratic, large jumps
3. **Place Your Bets**: Click on grid cells to place 10-credit bets
   - Click multiple times on the same cell to increase your bet
   - Bet on multiple cells to improve your chances
4. **Start the Game**: Click "Start Game" and watch the cursor's random walk
5. **Win or Lose**:
   - **WIN**: If the cursor lands on a cell you bet on, you win the entire pot!
   - **LOSE**: If it lands elsewhere, you lose all bets

## 💰 Betting System

- **Bet Amount**: 10 credits per click
- **Multiple Bets**: Increase bets by clicking the same cell multiple times
- **Parimutuel System**: Winner(s) split the entire betting pool
- **Single Player**: You compete against the house (random walk)

## 🎲 Game Features

- **10×10 Interactive Grid**: Click cells to place bets
- **Volatility Control**: Adjust how erratically the cursor moves
- **Animated Random Walk**: Watch the cursor move step-by-step
- **Real-time Credits Display**: Track your balance with visual feedback
- **Detailed Results**: See breakdown of winnings/losses after each round
- **Dark Casino Theme**: Professional trading/casino aesthetic
- **Fully Responsive**: Works on desktop, tablet, and mobile

## 🚀 How to Run

Simply open `index.html` in any modern web browser. No installation or build process required!

```bash
# Clone the repository
git clone https://github.com/mriddyagrawal/New-Kinda-Gambling.git

# Navigate to the directory
cd New-Kinda-Gambling

# Open in browser (or just double-click index.html)
open index.html
```

## 📁 File Structure

```
/
├── index.html      # Main HTML page with game structure
├── styles.css      # All CSS styling and animations
├── game.js         # Complete game logic and interactions
└── README.md       # This file
```

## 🛠️ Technical Details

- **Pure Vanilla JavaScript**: No frameworks or dependencies
- **CSS Grid Layout**: Responsive grid system
- **Smooth Animations**: CSS transitions and JavaScript-based cursor movement
- **Event-Driven Architecture**: Clean state management
- **Modern ES6+**: Uses modern JavaScript features

## 🎨 Game Mechanics

### Random Walk Algorithm
The cursor starts at a random position and takes 20-50 steps (based on volatility). Each step:
- Calculates a random direction and distance based on volatility
- Higher volatility = larger possible jumps (1-4 cells)
- Lower volatility = smaller movements (1 cell)
- Wraps around grid edges for continuous play

### Volatility Impact
| Volatility | Max Jump | Steps | Behavior |
|------------|----------|-------|----------|
| 1-3 (Low)  | 1 cell   | ~20   | Predictable, local movement |
| 4-6 (Med)  | 2 cells  | ~30   | Moderate randomness |
| 7-10 (High)| 3-4 cells| ~50   | Erratic, large jumps |

## 🎲 Strategy Tips

1. **Spread Your Bets**: Bet on multiple cells to increase winning chances
2. **Adjust Volatility**: Lower volatility = more concentrated area to bet on
3. **Manage Your Bankroll**: Don't bet everything on one round
4. **Center Bias**: Due to wrapping, central cells might have slight advantages

## 📸 Screenshots

![Game Board](screenshot-placeholder.png)
*The main game interface with grid, controls, and betting information*

## 🤝 Contributing

Feel free to fork this repository and submit pull requests with improvements!

## 📜 License

MIT License - feel free to use and modify as you wish.

---

**Enjoy the game! May volatility be in your favor! 🎰📈**
