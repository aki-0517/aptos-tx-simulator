# Project Structure

## Current Directory Layout
```
aptos-tx-simulator/
├── .claude/                    # Claude Code configuration
├── .serena/                    # Serena agent configuration
├── CLAUDE.md                   # Project instructions for Claude
├── docs/                       # Comprehensive documentation
│   ├── mvp-development-todos.md
│   ├── mvp-requirements.md
│   ├── architecture.md
│   ├── aptos-sdk-guide.md
│   └── ... (additional docs)
└── web/                        # Next.js application
    ├── app/                    # Next.js App Router
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── globals.css
    ├── public/                 # Static assets
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts
    └── bun.lockb
```

## Planned Source Structure (to be implemented)
```
web/src/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home page
│   ├── simulator/             # Simulation pages
│   └── globals.css            # Global styles
├── components/
│   ├── ui/                    # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── simulation/            # Transaction building and simulation
│   │   ├── TransactionBuilder.tsx
│   │   ├── SimulationResults.tsx
│   │   └── GasEstimator.tsx
│   ├── debugging/             # Debug tools and trace viewers
│   │   ├── TransactionTrace.tsx
│   │   └── ErrorAnalyzer.tsx
│   └── common/                # Shared layout components
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── Navigation.tsx
├── hooks/                     # Custom React hooks
│   ├── useAptosClient.ts
│   ├── useSimulation.ts
│   ├── useWallet.ts
│   └── useGasEstimation.ts
├── lib/                       # Core simulation logic
│   ├── simulator.ts           # Main simulation engine
│   ├── aptos-client.ts        # Aptos SDK configuration
│   ├── gas-calculator.ts      # Gas estimation logic
│   └── error-handler.ts       # Move VM error interpretation
├── stores/                    # Zustand state stores
│   ├── simulationStore.ts     # Simulation state
│   ├── walletStore.ts         # Wallet connection state
│   └── networkStore.ts        # Network selection state
└── types/                     # TypeScript type definitions
    ├── simulation.ts          # Simulation-related types
    ├── wallet.ts              # Wallet-related types
    └── aptos.ts               # Aptos-specific types
```

## Key Files and Their Purposes

### Configuration Files
- `package.json`: Dependencies and scripts
- `tsconfig.json`: TypeScript configuration with strict mode
- `next.config.ts`: Next.js configuration
- `tailwind.config.js`: Tailwind CSS configuration (to be added)

### Entry Points
- `app/layout.tsx`: Root layout with providers
- `app/page.tsx`: Main application entry point
- `app/simulator/page.tsx`: Core simulation interface

### Core Logic
- `lib/simulator.ts`: Main transaction simulation engine
- `lib/aptos-client.ts`: Aptos SDK setup and network management
- `stores/simulationStore.ts`: Global simulation state management

## Implementation Status
- ✅ Basic Next.js project structure
- ✅ TypeScript configuration
- ⏳ Source directory structure (planned)
- ⏳ Component architecture (planned)
- ⏳ Aptos SDK integration (planned)