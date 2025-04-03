import * as fs from 'fs';
import * as path from 'path';
import { CHAINS } from './chains';

// Path to output the Solidity file
const outputPath = path.resolve(__dirname, '../../..', 'contract/src/generated/Constants.sol');

// Generate Solidity contract with constants
function generateSolidityConstants() {
  const content = `// SPDX-License-Identifier: MIT
// This file is auto-generated. Do not edit directly.
pragma solidity ^0.8.17;

/**
 * @title Constants
 * @notice Auto-generated constants for use in Solidity contracts
 */
contract Constants {
    // Chain names in the superchain
    string[] public CHAINS = [
${CHAINS.map(chain => `        "${chain}"`).join(',\n')}
    ];

    /**
     * @notice Returns the list of all chains
     * @return Array of chain names
     */
    function getChains() external view returns (string[] memory) {
        return CHAINS;
    }

    /**
     * @notice Returns the number of chains
     * @return Number of chains
     */
    function getChainsCount() external view returns (uint256) {
        return CHAINS.length;
    }
}`;

  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write the file
  fs.writeFileSync(outputPath, content);
  console.log(`Generated Solidity constants at: ${outputPath}`);
}

// If the script is run directly
if (require.main === module) {
  generateSolidityConstants();
}

export { generateSolidityConstants }; 