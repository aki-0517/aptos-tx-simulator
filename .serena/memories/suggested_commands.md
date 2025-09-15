# Suggested Development Commands

## Package Management (Bun)
```bash
# Install dependencies
bun install

# Add new dependencies
bun add <package-name>
bun add -d <dev-package>

# Update dependencies
bun update
```

## Development Workflow
```bash
# Navigate to web directory
cd web

# Start development server
bun run dev

# Build for production
bun run build

# Start production server
bun run start
```

## Code Quality (To be implemented)
```bash
# Run linting
bun run lint

# TypeScript type checking
bun run type-check

# Run tests
bun test
```

## Aptos-specific Setup Commands
```bash
# Install Aptos dependencies
bun add @aptos-labs/ts-sdk @aptos-labs/wallet-adapter-react

# Install UI dependencies  
bun add zustand @radix-ui/react-* class-variance-authority clsx tailwind-merge lucide-react next-themes

# Setup shadcn/ui
bunx shadcn-ui@latest init
bunx shadcn-ui@latest add button input card select textarea alert badge tabs form toast
```

## Git Commands (Darwin/macOS)
```bash
# Standard git operations
git status
git add .
git commit -m "message"
git push

# View changes
git diff
git log --oneline
```

## System Utilities (Darwin/macOS)
```bash
# File operations
ls -la          # List files with details
find . -name    # Find files by name
grep -r         # Search in files
cat             # View file contents
head/tail       # View file parts

# Directory navigation
cd              # Change directory
pwd             # Print working directory
mkdir           # Create directory
```

## Project-specific Commands
```bash
# Initial project setup (when starting fresh)
bunx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir

# Development server with specific port
bun run dev -- -p 3000

# Environment-specific builds
NODE_ENV=production bun run build
```