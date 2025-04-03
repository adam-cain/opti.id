# Opti.ID

A decentralized domain name system for blockchain domains with the format `{adjective}-{descriptor}-{noun}.{chain}.opti.id`

## Project Overview

Opti.ID is a web3 platform that allows users to register and manage domain names on various blockchain networks. The project consists of:

- Smart contracts for domain registration and management
- A modern web frontend built with Next.js and React
- Integration with Farcaster Frames

## Project Structure

This is a monorepo project with the following packages:

- `packages/contracts` - Solidity smart contracts for the domain registry
- `packages/frontend` - Next.js web application

## Features

- Register custom domains in the format `{adjective}-{descriptor}-{noun}.{chain}.opti.id`
- Limit of 5 domains per user
- Low registration fee of 0.0001 ETH
- Support for multiple blockchain networks
- Modern and responsive frontend

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- pnpm package manager
- Hardhat for smart contract development
- Metamask or other Web3 wallet

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/opti.id.git
cd opti.id
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in the contracts and frontend packages
   - Configure the required environment variables

### Development

#### Running the frontend:
```bash
pnpm frontend
# or
pnpm -filter frontend run dev
```

#### Running the smart contract tests:
```bash
pnpm test
# or
pnpm -filter contracts run test
```

#### Compiling the smart contracts:
```bash
pnpm compile
# or
pnpm -filter contracts run compile
```

#### Building the entire project:
```bash
pnpm build
```

## Smart Contracts

The core of the project is the `OptiIdRegistry.sol` contract, which handles:
- Domain registration and ownership
- Component-based domain structure
- Fee management
- Domain transfers and updates

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)

## Shared Constants

This project uses a shared constants package for both the TypeScript frontend and Solidity contracts:

```
packages/
  constants/         # Shared constants package
    src/
      wordLists.ts   # Word lists for random name generation
      chains.ts      # Chain list for the superchain
      index.ts       # Main exports
      generateSolidityConstants.ts  # Script to generate Solidity constants
```

### Using Constants

#### In TypeScript (apps/farcaster-frame)

```typescript
import { ADJECTIVES, DESCRIPTORS, NOUNS, CHAINS } from '@opti.id/constants';
```

#### In Solidity (contract/)

First, generate the Solidity constants file:

```bash
pnpm run generate:solidity
```

Then import in your contract:

```solidity
import { Constants } from "../src/generated/Constants.sol";
```

### Adding or Modifying Constants

1. Edit the relevant files in `packages/constants/src/`
2. Run `pnpm run build:constants` to build the TypeScript package
3. Run `pnpm run generate:solidity` to generate the Solidity file 