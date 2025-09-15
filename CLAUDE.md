# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Aptos transaction simulator - a web application that allows users to preview, debug, and analyze Aptos blockchain transactions before executing them on-chain. The project is inspired by Tenderly but specialized for the Aptos Move ecosystem.

**Current Status**: Planning phase completed, implementation not yet started.

## Architecture

The application follows a client-side architecture with these layers:

- **Frontend**: Next.js 15 + TypeScript + shadcn/ui + Tailwind CSS
- **Simulation Layer**: Client-side transaction simulation using Aptos SDK
- **Data Layer**: Direct RPC connection to Aptos networks (no backend/database)
- **State Management**: Zustand + SWR for caching

### Core Components Structure
```
src/
├── app/                    # Next.js App Router pages
├── components/
│   ├── ui/                 # shadcn/ui components  
│   ├── simulation/         # Transaction building and simulation
│   ├── debugging/          # Debug tools and trace viewers
│   └── common/             # Shared layout components
├── hooks/                  # Custom React hooks for Aptos integration
├── lib/                    # Core simulation logic and Aptos SDK setup
├── stores/                 # Zustand state stores
└── types/                  # TypeScript type definitions
```

## Development Commands

### Initial Setup
```bash
# Create Next.js project (when starting implementation)
npx create-next-app@latest aptos-tx-simulator --typescript --tailwind --eslint --app --src-dir

# Install Aptos dependencies
npm install @aptos-labs/ts-sdk @aptos-labs/wallet-adapter-react

# Install UI dependencies  
npm install zustand @radix-ui/react-* class-variance-authority clsx tailwind-merge lucide-react next-themes

# Setup shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input card select textarea alert badge tabs form toast
```

### Development Workflow
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm test             # Run tests (when implemented)
```

## Key Implementation Priorities

### Phase 1: Project Foundation (Weeks 1-2)
1. **TODO-001**: Next.js project setup with TypeScript strict mode
2. **TODO-002**: Project structure following the documented architecture
3. **TODO-005**: Aptos SDK integration with network switching (Devnet/Testnet)
4. **TODO-006**: Petra wallet connection setup

### Phase 2: Core Simulation (Weeks 3-5)  
1. **TODO-007**: Basic transaction simulation engine (`lib/simulator.ts`)
2. **TODO-008**: Gas estimation functionality
3. **TODO-009**: Error analysis and VM status interpretation
4. **TODO-010**: Zustand stores for state management

### Phase 3: UI Implementation (Weeks 6-7)
1. **TODO-012**: Transaction builder form with type validation
2. **TODO-013**: Simulation result display with gas breakdown
3. **TODO-014**: Wallet connection UI components

### Phase 4: Testing & Deployment (Week 8)
1. **TODO-017**: Unit tests for core simulation logic
2. **TODO-019**: Vercel deployment configuration

## Technical Constraints

- **Client-side only**: No backend server or database
- **Aptos SDK dependent**: Must work within Aptos TypeScript SDK limitations  
- **Network connectivity**: Relies on Aptos RPC node availability
- **MVP focused**: Exclude advanced features like 3D visualization, multi-sig, debugging tools until post-MVP

## Key Design Decisions

- **Framework**: Next.js 15 with App Router (not React+Vite due to user requirements)
- **Language**: Japanese documentation and UI (as requested by user)
- **Wallet Support**: Petra wallet prioritized for MVP
- **Network Support**: Devnet and Testnet for MVP (Mainnet in v1.1)
- **State Management**: Zustand for simplicity over Redux
- **Styling**: shadcn/ui + Tailwind for rapid development

## Development Notes

### Critical Implementation Details
- All simulation must happen client-side using `@aptos-labs/ts-sdk`
- Transaction simulation uses `aptos.transaction.simulate.simple()` 
- Gas estimation requires precise calculation: `gasUsed * gasUnitPrice`
- Error handling must interpret Move VM status codes into user-friendly messages
- Network switching requires reinitializing AptosConfig with different Network enum values

### File Structure Conventions
- Place simulation logic in `lib/` directory
- UI components follow shadcn/ui patterns
- Custom hooks prefix with `use` (e.g., `useAptosClient`, `useSimulation`)
- Store files end with `Store.ts` (e.g., `simulationStore.ts`)
- Type definitions organized by domain in `types/` directory

### Quality Requirements
- TypeScript strict mode enabled
- All user-facing text in Japanese
- Responsive design for mobile/desktop
- Simulation accuracy >95% compared to actual execution
- Response time <3 seconds for standard transactions

Refer to `docs/mvp-development-todos.md` for detailed task breakdown and `docs/mvp-requirements.md` for complete functional requirements.