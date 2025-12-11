# Tarkov Stats Web

A modern, high-performance web-based analytics dashboard for Escape from Tarkov log files. Runs entirely in the browser - no server required.

## Features

- **Drag & Drop Import**: Simply drop your EFT log folder or files into the browser
- **Comprehensive Statistics**: Overview, sessions, errors, inventory, network, matchmaking, and quests
- **Interactive Charts**: Visualize errors, inventory operations, and connectivity data
- **Session Timelines**: Track startup and matchmaking durations over time
- **High Performance**: Web Worker parsing, virtualized lists, and downsampled charts for large datasets
- **Export**: Download all parsed data and insights as JSON

## Architecture

```
src/
├── app/                    # Next.js App Router pages
├── components/
│   ├── ui/                # Reusable UI primitives (Card, Button, StatCard, etc.)
│   ├── layout/            # Layout components (Header, Navigation, DropZone)
│   └── views/             # Tab view components (Overview, Sessions, Errors, etc.)
├── hooks/                 # React hooks (useLogImport)
├── lib/
│   ├── ingest/           # File reading and worker pool for parsing
│   └── logs/             # Type definitions, selectors, and fixtures
└── state/                # Zustand store with selectors and persistence
```

## Tech Stack

- [Next.js 16](https://nextjs.org/) - React framework with App Router
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS 4](https://tailwindcss.com/) - Styling
- [Recharts](https://recharts.org/) - Charts
- [Framer Motion](https://www.framer.com/motion/) - Animations
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [TanStack Virtual](https://tanstack.com/virtual) - List virtualization
- [TarkovLogsLib](../TarkovLogsLib) - Log parsing library
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
2. Drag and drop your EFT log folder or files onto the drop zone
   - Logs are typically located at: `%LOCALAPPDATA%\Battlestate Games\Escape from Tarkov\Logs`
3. Wait for parsing to complete (uses Web Workers for performance)
4. Navigate through the tabs to explore different statistics

### Supported Log Types

- Application logs (`application_*.log`)
- Backend logs (`backend_*.log`)
- Error logs (`errors_*.log`)
- Inventory logs (`inventory_*.log`)
- Network connection logs (`network_connection_*.log`)
- Network messages logs (`network_messages_*.log`)
- Push notifications logs (`push-notifications_*.log`)
- And many more...

## Performance Optimizations

- **Web Worker Parsing**: Large log files are parsed in parallel using a worker pool
- **Virtualized Lists**: Large tables and JSON viewers use virtualization for smooth scrolling
- **Data Downsampling**: Charts automatically downsample data points for better performance
- **Lazy Loading**: Chart components are lazy-loaded to reduce initial bundle size
- **State Persistence**: UI preferences are persisted to localStorage

## Privacy

All log parsing happens locally in your browser. No data is sent to any server.

## Scripts

```bash
pnpm dev       # Start development server
pnpm build     # Build for production
pnpm start     # Start production server
pnpm lint      # Run ESLint
```
