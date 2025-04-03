// SPDX-License-Identifier: MIT
// This file is auto-generated. Do not edit directly.
pragma solidity ^0.8.17;

/**
 * @title Constants
 * @notice Auto-generated constants for use in Solidity contracts
 */
contract Constants {
    // Chain names in the superchain
    string[] public CHAINS = [
        "Automata",
        "BOB",
        "Base",
        "Binary",
        "Cyber",
        "Ethernity",
        "Funki",
        "HashKey-Chain",
        "Ink",
        "Lisk",
        "Lyra-Chain",
        "Metal-L2",
        "Mint",
        "Mode",
        "OP",
        "Orderly",
        "Polynomial",
        "RACE",
        "Redstone",
        "Settlus",
        "Shape",
        "SnaxChain",
        "Soneium",
        "Superseed",
        "Swan-Chain",
        "Swellchain",
        "Unichain",
        "World-Chain",
        "Xterio-Chain",
        "Zora",
        "Arena-z"
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
}