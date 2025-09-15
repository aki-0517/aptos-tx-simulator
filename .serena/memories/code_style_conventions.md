# Code Style and Conventions

## Language and Localization
- **Primary Language**: TypeScript with strict mode enabled
- **UI Language**: Japanese (all user-facing text)
- **Documentation**: Mixed Japanese/English (Japanese for user docs, English for technical docs)

## Naming Conventions
- **Custom Hooks**: Prefix with `use` (e.g., `useAptosClient`, `useSimulation`)
- **Store Files**: End with `Store.ts` (e.g., `simulationStore.ts`)
- **Component Files**: PascalCase for React components
- **Type Definitions**: Organized by domain in `types/` directory

## File Organization
- **Simulation Logic**: Place in `lib/` directory
- **UI Components**: Follow shadcn/ui patterns
- **Hooks**: Custom React hooks in `hooks/` directory
- **Stores**: Zustand stores in `stores/` directory
- **Types**: Domain-organized TypeScript definitions in `types/`

## Code Quality Requirements
- **TypeScript**: Strict mode enabled
- **Responsiveness**: Mobile and desktop support
- **Performance**: Response time <3 seconds for standard transactions
- **Accuracy**: Simulation accuracy >95% compared to actual execution

## Design Patterns
- **State Management**: Zustand for simplicity over Redux
- **Component Design**: shadcn/ui component patterns
- **Error Handling**: Interpret Move VM status codes into user-friendly messages
- **Network Handling**: Reinitialize AptosConfig with different Network enum values

## Critical Implementation Guidelines
- All simulation must happen client-side using `@aptos-labs/ts-sdk`
- Transaction simulation uses `aptos.transaction.simulate.simple()`
- Gas estimation: `gasUsed * gasUnitPrice`
- Never expose or log secrets and keys
- Follow security best practices