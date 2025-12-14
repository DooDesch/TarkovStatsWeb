# Tarkov Stats Web

A modern, high-performance web-based analytics dashboard for Escape from Tarkov log files. Runs entirely in the browser - no server required.

## Features

- **Drag & Drop Import**: Simply drop your EFT log folder or files into the browser
- **Comprehensive Statistics**: Overview, sessions, errors, inventory, network, matchmaking, quests, backend, and audio/push metrics
- **Interactive Charts**: Visualize errors, inventory operations, connectivity data, backend status codes, and cache performance
- **Session Timelines**: Track startup and matchmaking durations over time
- **Network Quality Metrics**: RTT, packet loss, RPI/LUD averages from network messages
- **Backend Analytics**: Request/response tracking, status codes, endpoint usage, cache hit rates
- **Audio & Push Stats**: Spatial audio initialization, BattlEye anti-cheat status, push notification delivery rates
- **High Performance**: Web Worker parsing, virtualized lists, and downsampled charts for large datasets
- **Export**: Download all parsed data, insights, and statistics as JSON
- **Optional Data Enrichment**: Resolve quest/trader/item IDs via TarkovDev GraphQL API or TarkovTracker static data

## Architecture

```
src/
├── app/                    # Next.js App Router pages
├── components/
│   ├── ui/                # Reusable UI primitives (Card, Button, StatCard, etc.)
│   ├── layout/            # Layout components (Header, Navigation, DropZone)
│   └── views/             # Tab view components (Overview, Sessions, Errors, Backend, Audio, etc.)
├── hooks/                 # React hooks (useLogImport)
├── lib/
│   ├── ingest/           # File reading and worker pool for parsing
│   └── logs/             # Type definitions, selectors, analytics, and fixtures
└── state/                # Zustand store with selectors and persistence
```

## Data Flow

```
parseText/worker pool → ParsedLogResult[] → TarkovLogsInsights → Insights
                                          → deriveStatistics  → Statistics
                                                              ↓
                                                        Zustand store → UI Views
```

## Tech Stack

- [Next.js 16](https://nextjs.org/) - React framework with App Router
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS 4](https://tailwindcss.com/) - Styling
- [Recharts](https://recharts.org/) - Charts
- [Framer Motion](https://www.framer.com/motion/) - Animations
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [TanStack Virtual](https://tanstack.com/virtual) - List virtualization
- [TarkovLogsLib](../TarkovLogsLib) - Log parsing library (local dependency)
- [Lucide React](https://lucide.dev/) - Icons

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
cd TarkovStatsWeb
pnpm install
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
pnpm build
pnpm start
```

## Usage

1. Open the app in your browser
2. Optionally select a data enrichment source (TarkovDev or TarkovTracker) to resolve IDs
3. Drag and drop your EFT log folder or files onto the drop zone
   - Logs are typically located at: `%LOCALAPPDATA%\Battlestate Games\Escape from Tarkov\Logs`
4. Wait for parsing to complete (uses Web Workers for performance)
5. Navigate through the tabs to explore different statistics:
   - **Overview**: Summary stats, event counts by log type, time range
   - **Sessions**: Session timelines with startup/matchmaking durations
   - **Errors**: Error family breakdown with charts
   - **Inventory**: Operation rejections by type and error code
   - **Network**: Connection success rates, address breakdown, RTT/packet metrics
   - **Matchmaking**: Match and startup duration trends over time
   - **Quests**: Quest tracking with status and trader info
   - **Backend**: Request/response stats, status codes, endpoint usage, cache performance
   - **Audio & Push**: Push notification delivery, spatial audio health, BattlEye status
   - **Raw Data**: Full JSON export of insights and parsed results

### Supported Log Types

- Application logs (`application_*.log`) - Bootstrap, GC, config, matchmaking events
- Backend logs (`backend_*.log`) - HTTP requests/responses, retries, errors
- Backend cache logs (`backendCache_*.log`) - Cache hit/miss tracking
- Backend queue logs (`backend_queue_*.log`) - Queue failure events
- Error logs (`errors_*.log`) - All error types (null ref, key not found, etc.)
- Files checker logs (`files-checker_*.log`) - Integrity verification
- Insurance logs (`insurance_*.log`) - Insurance warnings/errors
- Inventory logs (`inventory_*.log`) - Operation rejections
- Network connection logs (`network_connection_*.log`) - Connect/disconnect/timeout, RTT stats
- Network messages logs (`network_messages_*.log`) - RPI/LUD metrics
- Object pool logs (`objectPool_*.log`) - Pool return events
- Output logs (`output_*.log`) - General output
- Player logs (`player_*.log`) - Missing item/address errors
- Push notifications logs (`push-notifications_*.log`) - WebSocket notifications
- Seasons logs (`seasons_*.log`) - Seasons material fixer events
- Spatial audio logs (`spatial-audio_*.log`) - Audio init, DSP stats, occlusion errors
- AI data logs (`aiData_*.log`) - Wave count, door link errors
- AI errors logs (`aiErrors_*.log`) - AI-specific errors

## Performance Optimizations

- **Web Worker Parsing**: Large log files are parsed in parallel using a worker pool
- **Virtualized Lists**: Large tables and JSON viewers use virtualization for smooth scrolling
- **Data Downsampling**: Charts automatically downsample data points for better performance
- **Lazy Loading**: Chart components are lazy-loaded to reduce initial bundle size
- **State Persistence**: UI preferences are persisted to localStorage

## Privacy

All log parsing happens locally in your browser. No data is sent to any server unless you opt-in to data enrichment (TarkovDev/TarkovTracker APIs).

## Scripts

```bash
pnpm dev       # Start development server
pnpm build     # Build for production
pnpm start     # Start production server
pnpm lint      # Run ESLint
pnpm test      # Run tests (if configured)
```

## Related Projects

- [TarkovLogsLib](../TarkovLogsLib) - Core log parsing library
- [TarkovPilotExtensionTypescript](../TarkovPilotExtensionTypescript) - Browser extension for live log tracking
