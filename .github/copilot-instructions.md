# Internal Machine Monitor (ForgeGrid) - AI Coding Instructions

## Project Overview

ForgeGrid is a React-based production floor simulator and monitoring dashboard. It visualizes machine states, task queues, and real-time analytics.

- **Stack**: React 19, TypeScript, Vite, Zustand (State), Tailwind CSS (Styling).
- **Core Domain**: Manufacturing simulation (Machines, Tasks, Queues, Throughput).

## Architecture & Key Components

### State Management (Zustand)

- **Single Source of Truth**: `src/store.ts` contains the entire simulation state and logic.
- **Simulation Loop**: Driven by `tick()` action called via `setInterval` in `App.tsx`.
- **Key Actions**: `tick` (advances time), `addTaskBatch` (generates orders), `assignAllTasks` (allocates work).
- **Pattern**: Complex logic resides in the store actions, not components. Components trigger actions and react to state changes.

### Domain Model (`src/types.ts`)

- **Machine**: Entities like CNC, Assembly, Test. Properties: `status` (idle/processing/breakdown), `queue`, `effectiveTimeMultiplier`.
- **TaskInstance**: Jobs flowing through the system. Properties: `workloadMinutes`, `priority`, `assignedMachine`.
- **SystemState**: Global state including `productionTime`, `taskPool`, `eventLog`.

### UI Structure

- **Production View**: Real-time visualization (`MachineColumn`, `TaskPoolPanel`).
- **Analytics View**: Historical data and charts (`pages/Analytics.tsx`, `recharts`).
- **Styling**: Tailwind CSS with a custom dark/neon theme (Cyberpunk/Industrial aesthetic).

## Critical Workflows

### Development

- **Run**: `npm run dev` (Vite dev server).
- **Build**: `npm run build` (TypeScript check + Vite build).
- **Lint**: `npm run lint`.

### Simulation Logic

- **Time Scaling**: `productionTime` advances faster than real-time based on `timeScale`.
- **Wave System**: Task generation follows a "wave" pattern (Surge/Normal/Calm) defined in `store.ts` to simulate realistic load variance.
- **Task Distribution**: Logic for assigning tasks to specific machine types (CNC/Assembly/Test) is centralized in `generateTask` in `store.ts`.

## Coding Conventions

### TypeScript

- **Strict Typing**: Use interfaces from `types.ts`. Avoid `any`.
- **Props**: Define component props explicitly.

### React & Performance

- **Selectors**: Use specific selectors with Zustand (`useSystemStore(state => state.property)`) to minimize re-renders, especially for high-frequency updates like timers.
- **Memoization**: Use `useMemo` for expensive calculations in Analytics (e.g., chart data aggregation).

### Styling

- **Tailwind**: Use utility classes.
- **Theme**: Stick to the defined color palette (dark backgrounds, neon accents) visible in `index.css` and component classes.

## Integration Points

- **Config**: `src/config.ts` holds constants for machine definitions, task types, and system settings. Modify this to tune the simulation parameters.
