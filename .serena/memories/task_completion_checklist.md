# Task Completion Checklist

## When Completing Any Development Task

### 1. Code Quality Checks
- [ ] TypeScript strict mode compliance
- [ ] No TypeScript errors or warnings
- [ ] ESLint rules followed (when implemented)
- [ ] Code follows project naming conventions

### 2. Testing Requirements
- [ ] Unit tests written for core simulation logic
- [ ] Tests pass successfully
- [ ] Coverage meets project requirements

### 3. Build Verification
```bash
cd web
bun run build    # Ensure production build succeeds
```

### 4. Code Review Checklist
- [ ] All simulation logic is client-side only
- [ ] No secrets or keys exposed in code
- [ ] Japanese text used for all user-facing content
- [ ] Responsive design implemented (mobile/desktop)
- [ ] Performance targets met (<3 seconds response time)

### 5. Aptos-specific Validation
- [ ] Aptos SDK integration working correctly
- [ ] Transaction simulation accuracy >95%
- [ ] Gas estimation calculations verified
- [ ] Network switching functionality tested
- [ ] Error handling for Move VM status codes

### 6. Documentation Updates
- [ ] Update relevant documentation if architecture changes
- [ ] Update TODO status in development plan
- [ ] Add any new dependencies to tech stack documentation

### 7. Final Verification
- [ ] Development server starts without errors: `bun run dev`
- [ ] All features work as expected in browser
- [ ] No console errors or warnings
- [ ] Mobile responsiveness tested

## Phase-specific Completion Criteria

### Phase 1: Project Foundation
- [ ] Next.js project structure complete
- [ ] All required dependencies installed
- [ ] Basic Aptos SDK integration
- [ ] Wallet connection setup

### Phase 2: Core Simulation
- [ ] Transaction simulation engine functional
- [ ] Gas estimation working
- [ ] Error analysis implemented
- [ ] State management with Zustand

### Phase 3: UI Implementation
- [ ] Transaction builder form complete
- [ ] Simulation results display working
- [ ] Wallet connection UI implemented

### Phase 4: Testing & Deployment
- [ ] Comprehensive test suite
- [ ] Vercel deployment configuration
- [ ] Performance optimization complete