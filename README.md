# Tango Solver

A beautiful web-based implementation of the Tango logic puzzle game, inspired by LinkedIn's Tango game.

## Features

- Interactive puzzle grid with sun ☀️ and moon 🌙 symbols
- Constraint-based gameplay with equals (=) and not-equals (×) rules
- **Intelligent solver** with multiple logical rules
- **Step-by-step solving mode** with educational explanations
- **Cell highlighting** during solving to visualize reasoning
- Responsive design for mobile and desktop
- Win detection and celebration

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:5173`)

## Game Rules

- Each row and column must contain an equal number of suns ☀️ and moons 🌙
- No more than two identical symbols can appear consecutively in any row or column
- Cells connected by "=" must have the same symbol
- Cells connected by "×" must have different symbols

## Solver Features

The solver implements a comprehensive set of logical rules to solve puzzles step-by-step:

### Solving Modes

1. **Solve All**: Automatically solves the entire puzzle at once
2. **Solve Step-by-Step**: Interactive mode that shows one move at a time with explanations

### Implemented Solving Rules

1. **No-Three Rule**: If two equal cells are adjacent, neighboring cells must be opposite to avoid three in a row
2. **Parity Rule**: When a row/column reaches half capacity of one symbol, remaining cells must be the opposite
3. **Constraint Propagation**: Equals and not-equals constraints propagate values between connected cells
4. **Edge Case Rule**: If cells at both ends are equal, inner cells must be opposite
5. **Gap Rule**: If pattern X _ X exists, the middle must be opposite
6. **Two Equals at End Rule**: If two equal cells are at one end, the opposite end must be opposite
7. **Second-to-Last Equals First Rule**: If second-to-last equals first, the end must be opposite
8. **Modifier Balance Rule**: Uses constraint information with row/column balance to deduce values
9. **End with Equals Constraint Rule**: If one end is known and the other has equals constraints, those cells must be opposite

### Step-by-Step Mode Features

- **Visual Highlighting**: 
  - Yellow highlight for cells used in reasoning (affected cells)
  - Green highlight for the cell being filled (result cell)
- **Educational Explanations**: Each step includes:
  - Rule name
  - Detailed explanation of why the move is made
  - Reference to specific cells and positions

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── GameBoard/
│   │   │   ├── GameBoard.jsx
│   │   │   └── GameBoard.css
│   │   ├── Cell/
│   │   │   ├── Cell.jsx
│   │   │   └── Cell.css
│   │   ├── ConstraintToolbar/
│   │   │   ├── ConstraintToolbar.jsx
│   │   │   └── ConstraintToolbar.css
│   │   └── Header/
│   │       ├── Header.jsx
│   │       └── Header.css
│   ├── utils/
│   │   ├── gameLogic.js      # Game logic and validation
│   │   ├── solver.js         # Solving algorithms and rules
│   │   └── validator.js      # Starting position validation
│   ├── styles/
│   │   └── index.css
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── package.json
└── vite.config.js
```

## Technologies Used

- React 18
- Vite
- CSS3 (with modern features like backdrop-filter and animations)

## How to Use the Solver

1. **Set up your puzzle**: Place some initial sun/moon symbols and add constraints (= or ×) between cells
2. **Choose solving mode**:
   - Click "Solve All" to automatically solve the entire puzzle
   - Click "Solve Step-by-Step" to see each move explained
3. **In step-by-step mode**:
   - Click "Next Step" to see the next logical move
   - Read the explanation to understand the reasoning
   - Observe the highlighted cells to see which cells are involved
   - Click "Stop" to exit step-by-step mode at any time

## Development Notes

The solver uses constraint propagation and logical deduction rather than brute-force backtracking, making it efficient and educational. Each rule is implemented as a separate function that can be easily extended or modified.

## Deployment

This project is configured for deployment to GitHub Pages.

### Automatic Deployment (Recommended)

1. Push your code to GitHub
2. Go to your repository settings
3. Navigate to **Pages** in the left sidebar
4. Under **Source**, select **GitHub Actions**
5. The workflow will automatically build and deploy when you push to the `main` branch

### Manual Deployment

1. Build the project:
   ```bash
   cd frontend
   npm run build
   ```

2. The built files will be in `frontend/dist/`

3. Push the `dist` folder to the `gh-pages` branch (or use GitHub Pages settings)

### Important Notes

- Make sure to update the `base` path in `vite.config.js` if your repository name is different from `Tango-Solver`
- The site will be available at: `https://[your-username].github.io/Tango-Solver/`

## License

See LICENSE file for details.

