# kcapp-venue-screen

A remote venue screen for displaying live darts match scoring in real time. Designed to run on a display at a venue, this application connects to kcapp's backend to show live game state as matches are played remotely or locally.

## Features

- **Live Score Display** – Real-time score updates as darts are thrown
- **Remote Match Control** – Start matches from another device and this screen will automatically connect
- **Manual Match Recovery** – Reconnect to an active match after browser refresh or connection loss
- **Checkout Suggestions** – Hardcoded checkout advice that updates based on remaining score and darts thrown
- **Match Celebration** – Displays winner message for 30 seconds before returning to waiting state
- **Vertical Player Layout** – Stacked player cards with active player highlighted
- **Score Input** – Keyboard-based dart entry with visual feedback

## System Architecture

### Components

- **React + TypeScript** – Type-safe UI components
- **Vite** – Fast build tooling and dev server
- **Socket.IO** – Real-time event streaming from kcapp backend
- **Tailwind CSS** – Responsive dark-mode styling

### Data Flow

```
Browser (kcapp-venue-screen)
    ↓
Socket.IO /venue/:venueId (listen for remote start)
    ↓
Socket.IO /legs/:legId (join active leg)
    ↓
score_update events → local state → render live scores
    ↓
Submit throws via /legs/:legId emit('throw')
```

### Backend Connection

- **REST API** – `/api/venue/:id/matches`, `/api/venue/:id/players`, `/checkout/:score`
- **WebSocket (Socket.IO)** – `/venue/:venueId`, `/legs/:legId` namespaces
- **Basic Auth** – Optional username/password for API endpoints

## Prerequisites

- Node.js 18+
- npm or yarn or pnpm
- Modern browser with WebSocket support
- kcapp backend running (https://darts.sanden.cloud or self-hosted)

## Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Development: Points to local dev proxy
VITE_KCAPP_API_BASE=http://localhost:5173/api
VITE_KCAPP_SOCKET_URL=http://localhost:8001
VITE_KCAPP_VENUE_LIST_URL=http://localhost:5173/api/venues

# Basic auth (optional)
VITE_KCAPP_BASIC_AUTH_USERNAME=your_username
VITE_KCAPP_BASIC_AUTH_PASSWORD=your_password
```

**Note**: `VITE_KCAPP_API_BASE` uses a relative path that's proxied by Vite dev server to avoid CORS issues. See [vite.config.ts](vite.config.ts).

### 3. Start Development Server

```bash
npm run dev
```

Opens at `http://localhost:5173`

### 4. Available Scripts

```bash
npm run dev        # Start dev server with hot reload
npm run build      # Build for production
npm run preview    # Preview production build locally
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript type checking
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_KCAPP_API_BASE` | `http://localhost:8001` | Base URL for API calls |
| `VITE_KCAPP_SOCKET_URL` | `http://localhost:8001` | WebSocket URL for Socket.IO |
| `VITE_KCAPP_VENUE_LIST_URL` | `http://localhost:5173/api/venues` | Endpoint for fetching venues |
| `VITE_KCAPP_BASIC_AUTH_USERNAME` | (empty) | Username for basic auth |
| `VITE_KCAPP_BASIC_AUTH_PASSWORD` | (empty) | Password for basic auth |

### For Local Development

If you have kcapp running locally on port 8001:

```env
VITE_KCAPP_API_BASE=http://localhost:5173/api
VITE_KCAPP_SOCKET_URL=http://localhost:8001
VITE_KCAPP_VENUE_LIST_URL=http://localhost:5173/api/venues
```

### For Remote/Production

```env
VITE_KCAPP_API_BASE=https://yourdomain.com/api
VITE_KCAPP_SOCKET_URL=https://yourdomain.com
VITE_KCAPP_VENUE_LIST_URL=https://yourdomain.com/api/venues
VITE_KCAPP_BASIC_AUTH_USERNAME=your_username
VITE_KCAPP_BASIC_AUTH_PASSWORD=your_password
```

## Project Structure

```
src/
├── components/
│   ├── GameBoard.tsx          # Original game board (unused)
│   ├── RemoteMatchBoard.tsx   # Main live scoring display
│   ├── ScoreInput.tsx         # Keyboard dart entry
│   ├── PlayerCard.tsx         # Player score card
│   ├── VenueSetup.tsx         # Venue selection screen
│   └── GameSetup.tsx          # Game setup form (unused)
├── lib/
│   ├── kcapp.ts              # Socket.IO + REST API helpers
│   └── checkoutSuggestions.ts # Hardcoded checkout table
├── types/
│   ├── kcapp.ts              # kcapp type definitions
│   └── game.ts               # Game logic types
├── App.tsx                    # Main app with venue/leg socket orchestration
├── main.tsx                   # React entry point
├── index.css                  # Global Tailwind styles
└── vite-env.d.ts             # Vite environment types
```

## How It Works

### 1. Venue Selection

User selects a venue from dropdown (fetched from `/api/venue`). The screen connects to the venue's Socket.IO namespace.

### 2. Waiting for Match

Screen listens on `/venue/:venueId` for:
- `start_remote` – Match started remotely from controller
- `venue_new_match` – New match created at venue

### 3. Active Match

Once a match starts, the app joins `/legs/:legId` namespace and subscribes to:
- `score_update` – Player score changed (dart entered)
- `new_leg` – Next leg in match (auto-join new leg)
- `leg_finished` – Current leg complete
- `connected` – Initial leg state

### 4. Score Entry

User enters darts via keyboard or on-screen buttons. Each dart:
1. Updates live remaining score locally
2. Fetches checkout suggestions for the updated score
3. On submit: sends throw payload to `/legs/:legId` via `emit('throw')`

### 5. Manual Match Recovery

If browser refreshes or connection drops:
- Click "Select Match Manually"
- Choose from active venue matches (fetched from `/api/venue/:id/matches`)
- Auto-joins selected leg

### 6. Match Finish

When match ends:
- Displays winner message for 30 seconds
- Auto-disconnects and returns to waiting screen

## Development Notes

### Keyboard Shortcuts (ScoreInput)

- **Number keys (0-20)** – Enter dart value
- **D** – Double (2x)
- **T** – Triple (3x)
- **Enter/Space** – Submit turn
- **Backspace** – Remove last dart
- **M** – Miss (0 score)

### Checkout Table

Hardcoded checkout suggestions in [src/lib/checkoutSuggestions.ts](src/lib/checkoutSuggestions.ts). Updates dynamically based on:
- **Dart 1** – Standard suggestions
- **Dart 2** – Two-dart finish variants (101, 104, 107, 110 special cases)
- **Dart 3** – One-dart finish (50 = D25)

### Live Score Calculation

As darts are entered, remaining score updates in real time:

```
Live Score = Player Score - Sum of Current Darts
```

Color changes to green when different from server score (indicating pending changes).

## Deployment (Non-Docker)

### Build for Production

```bash
npm run build
```

Creates optimized build in `dist/` folder (~200-300KB gzipped).

### Option 1: Static Host (Netlify, Vercel, GitHub Pages)

```bash
npm run build
# Deploy dist/ folder to your static host
```

### Option 2: Node.js Server

```bash
npm install -g serve
npm run build
serve -s dist -l 3000
```

### Option 3: Nginx/Apache

1. Build the app:
   ```bash
   npm run build
   ```

2. Configure reverse proxy to handle:
   - Static files from `dist/`
   - API proxy `/api/*` to your kcapp backend
   - SPA routing (all unknown routes serve `index.html`)

**Nginx example:**

```nginx
server {
    listen 80;
    root /var/www/kcapp-venue-screen/dist;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass https://darts.sanden.cloud/;
        proxy_set_header Host darts.sanden.cloud;
    }
}
```

3. Deploy:
   ```bash
   npm run build
   cp -r dist/* /var/www/kcapp-venue-screen/
   sudo systemctl restart nginx
   ```

### Environment Variables (Production)

Create `.env.production` for build-time variables:

```env
VITE_KCAPP_API_BASE=https://yourdomain.com/api
VITE_KCAPP_SOCKET_URL=https://yourdomain.com
VITE_KCAPP_VENUE_LIST_URL=https://yourdomain.com/api/venues
VITE_KCAPP_BASIC_AUTH_USERNAME=prod_user
VITE_KCAPP_BASIC_AUTH_PASSWORD=prod_pass
```

Then build:

```bash
npm run build
```

## Troubleshooting

### API Calls Blocked by CORS

Ensure your deployment setup has:
1. Reverse proxy handling `/api/*` → backend
2. Correct `VITE_KCAPP_API_BASE` pointing to proxy path
3. Backend CORS headers configured (if calling directly)

### Socket.IO Connection Fails

- Verify `VITE_KCAPP_SOCKET_URL` is reachable from browser
- Check firewall/network policies allow WebSocket (port 443 for WSS)
- Ensure backend Socket.IO is running

### Scores Not Updating

- Verify leg socket is connected (check connection status in header)
- Ensure throw payload is correct format (3 darts always)
- Check backend logs for validation errors

### Basic Auth Not Working

- Credentials must be set in `.env` at build time (embedded in HTML)
- For multi-tenant: use reverse proxy to inject headers instead
- Verify backend API requires/accepts Basic auth

## Architecture Decisions

- **Local Checkout Table** – Avoids network round-trip on every keystroke
- **Socket.IO only** – WebSocket ensures real-time updates vs polling
- **Minimal State** – App state is derived from server events
- **No Backend** – Pure frontend, no Node server needed (except for serve)
- **Tailwind Dark Mode** – Designed for venue display screens

## License

Proprietary. Part of kcapp ecosystem.

## Contributing

When adding features:
1. Ensure TypeScript type safety (`npm run typecheck` passes)
2. Test with hot reload (`npm run dev`)
3. Build for production (`npm run build`)
4. Check bundle size impact
5. Update this README if user-facing changes

## Contact

For kcapp integration issues, contact the kcapp team.
