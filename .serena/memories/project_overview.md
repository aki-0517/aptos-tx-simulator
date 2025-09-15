# Aptos Transaction Simulator - Project Overview

## Purpose
This is an Aptos transaction simulator - a web application that allows users to preview, debug, and analyze Aptos blockchain transactions before executing them on-chain. The project is inspired by Tenderly but specialized for the Aptos Move ecosystem.

## Current Status
- Planning phase completed, implementation partially started
- Basic Next.js project structure exists in `web/` directory
- Documentation and requirements are well-defined in `docs/` directory

## Architecture
Client-side architecture with these layers:
- **Frontend**: Next.js 15 + TypeScript + shadcn/ui + Tailwind CSS
- **Simulation Layer**: Client-side transaction simulation using Aptos SDK
- **Data Layer**: Direct RPC connection to Aptos networks (no backend/database)
- **State Management**: Zustand + SWR for caching

## Technical Constraints
- Client-side only: No backend server or database
- Aptos SDK dependent: Must work within Aptos TypeScript SDK limitations
- Network connectivity: Relies on Aptos RPC node availability
- MVP focused: Exclude advanced features until post-MVP

## Key Features
- Transaction simulation before execution
- Gas estimation and cost analysis
- Petra wallet integration
- Support for Devnet and Testnet (Mainnet in v1.1)
- Japanese UI and documentation