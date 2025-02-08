# Reya vs Hyperliquid Price Comparison Dashboard

Real-time price comparison dashboard between [Reya Network](https://reya.network/) and [Hyperliquid](https://hyperliquid.xyz/) DEX perpetual markets, with spread visualization and historical tracking.

## What it does

- Streams live prices from both Reya and Hyperliquid for common trading pairs
- Displays a real-time comparison grid showing prices from each exchange side-by-side
- Calculates and visualizes the spread between the two exchanges
- Tracks spread history over time with interactive charts

## Architecture

- **Backend** (Express + WebSocket): Connects to both Reya (WebSocket via `@reyaxyz/api-sdk`) and Hyperliquid (REST polling) APIs, merges price streams using RxJS, and pushes updates to the frontend over a single WebSocket connection.
- **Frontend** (React + Vite): Displays prices in an AG Grid table with spread heatmapping, and uses Highcharts for historical spread charts. State managed with Zustand.

## Quick Start

### Backend

```bash
cd backend
npm install
npm run start
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:5173` to view the dashboard.

### Test Scripts

```bash
# Test both price feeds together
cd backend
npm run test:feeds
```
