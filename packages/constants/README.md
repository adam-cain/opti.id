# @opti.id/constants

This package contains shared constants used across the Opti.id project, including:

- Word lists for random name generation
- Chain names for the superchain

## Usage

### In TypeScript/JavaScript

Install the package:

```bash
pnpm add @opti.id/constants
```

Import the constants:

```typescript
import { ADJECTIVES, DESCRIPTORS, NOUNS, CHAINS } from '@opti.id/constants';

// Use the constants in your code
const randomAdjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
```

### In Solidity

The constants are also available in Solidity by generating a Constants.sol file:

```bash
# From the root of the project
pnpm run generate:solidity
```

This will create a file at `contract/src/generated/Constants.sol` which you can import in your Solidity contracts:

```solidity
import { Constants } from "../src/generated/Constants.sol";

contract MyContract {
    Constants private constants;
    
    constructor() {
        constants = new Constants();
        
        // Access constants
        uint256 chainsCount = constants.getChainsCount();
        string[] memory allChains = constants.getChains();
        string memory firstChain = constants.CHAINS(0);
    }
}
```

## Development

To add or modify constants:

1. Edit the relevant files in `src/`
2. Run `pnpm run build` to compile TypeScript
3. Run `pnpm run generate-solidity` to generate the Solidity file

## Constants

### Word Lists

- `ADJECTIVES`: List of adjectives for random name generation
- `DESCRIPTORS`: List of descriptors for random name generation
- `NOUNS`: List of nouns for random name generation

### Chain Lists

- `CHAINS`: List of chains in the superchain 