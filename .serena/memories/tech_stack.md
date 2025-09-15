# Tech Stack

## Core Technologies
- **Frontend Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode enabled)
- **Package Manager**: Bun (as specified in CLAUDE.md)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand + SWR for caching
- **Icons**: Lucide React
- **Theming**: next-themes

## Aptos Integration
- **SDK**: @aptos-labs/ts-sdk
- **Wallet**: @aptos-labs/wallet-adapter-react (Petra wallet prioritized)
- **Networks**: Devnet, Testnet (Mainnet in v1.1)

## UI Components
- **Base**: @radix-ui/react-* primitives
- **Design System**: shadcn/ui
- **Utilities**: class-variance-authority, clsx, tailwind-merge

## Development Environment
- **Runtime**: Node.js with TypeScript 5+
- **Linting**: ESLint
- **Testing**: To be implemented (unit tests for core simulation logic)
- **Deployment**: Vercel (planned)

## Project Structure
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