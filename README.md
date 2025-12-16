# Tango Solver

A beautiful web-based implementation of the Tango logic puzzle game, inspired by LinkedIn's Tango game.

## Features

- Interactive puzzle grid with sun ☀️ and moon 🌙 symbols
- Constraint-based gameplay with equals (=) and not-equals (×) rules
- Beautiful, modern UI with smooth animations
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
│   │   └── Header/
│   │       ├── Header.jsx
│   │       └── Header.css
│   ├── utils/
│   │   └── gameLogic.js
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

## License

See LICENSE file for details.

