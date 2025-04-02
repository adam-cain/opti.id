// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title OptiIdRegistry
 * @dev A registry for managing domain names with the format {adjective}-{descriptor}-{noun}.{chain}.opti.id
 */
contract OptiIdRegistry is Ownable {
    using Strings for uint256;

    // ===============
    // STATE VARIABLES
    // ===============

    // Constants
    uint256 public constant MAX_DOMAINS_PER_USER = 5;
    uint256 public constant REGISTRATION_FEE = 0.0001 ether;
    bytes private constant OPTI_SUFFIX = ".opti.id";

    // Domain components storage
    string[] public validAdjectives;
    string[] public validDescriptors;
    string[] public validNouns; 
    string[] public validChains;

    // Domain storage using index-based representation
    struct DomainComponents {
        uint8 adjectiveIndex;
        uint8 descriptorIndex;
        uint8 nounIndex;
        uint8 chainIndex;
        bool exists;
    }

    // Domain ownership information
    struct DomainOwnership {
        address owner;
        uint256 timestamp;
    }

    // Mappings for domain data
    mapping(string => DomainOwnership) public domainOwners;
    mapping(string => bool) public domainExists;
    mapping(bytes32 => DomainComponents) public domainComponents;
    mapping(address => string[]) public userDomains;

    // Nonce for randomness
    mapping(address => uint256) private userNonces;

    // ======
    // EVENTS
    // ======
    event DomainRegistered(string name, address owner);
    event DomainTransferred(string name, address from, address to);
    event ValidComponentsSet(uint256 adjectivesCount, uint256 descriptorsCount, uint256 nounsCount, uint256 chainsCount);

    // ============
    // CONSTRUCTOR
    // ============
    constructor() Ownable() {
        // Transfer ownership to msg.sender
        _transferOwnership(msg.sender);
    }

    // =================
    // ADMIN FUNCTIONS
    // =================

    /**
     * @dev Set the valid components for domain names
     * @param adjectives Array of valid adjectives
     * @param descriptors Array of valid descriptors
     * @param nouns Array of valid nouns
     * @param chains Array of valid chains
     */
    function setValidComponents(
        string[] calldata adjectives,
        string[] calldata descriptors,
        string[] calldata nouns,
        string[] calldata chains
    ) external onlyOwner {
        // Clear existing arrays
        delete validAdjectives;
        delete validDescriptors;
        delete validNouns;
        delete validChains;
        
        // Add new components
        for (uint i = 0; i < adjectives.length; i++) {
            validAdjectives.push(adjectives[i]);
        }
        
        for (uint i = 0; i < descriptors.length; i++) {
            validDescriptors.push(descriptors[i]);
        }
        
        for (uint i = 0; i < nouns.length; i++) {
            validNouns.push(nouns[i]);
        }
        
        for (uint i = 0; i < chains.length; i++) {
            validChains.push(chains[i]);
        }
        
        emit ValidComponentsSet(
            validAdjectives.length,
            validDescriptors.length,
            validNouns.length,
            validChains.length
        );
    }

    /**
     * @dev Withdraw contract funds to the owner
     */
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // ======================
    // USER-FACING FUNCTIONS
    // ======================

    /**
     * @dev Register a random domain name for the caller
     * @param chainIndex Index of the chain to use for the domain
     */
    function registerRandomDomain(uint8 chainIndex) external payable {
        // Validate payment
        require(msg.value >= REGISTRATION_FEE, "Insufficient payment");
        
        // Check user's domain limit
        string[] storage userDomainsList = userDomains[msg.sender];
        require(userDomainsList.length < MAX_DOMAINS_PER_USER, "Too many domains");
        
        // Ensure we have valid components
        require(
            validAdjectives.length > 0 && 
            validDescriptors.length > 0 && 
            validNouns.length > 0 && 
            chainIndex < validChains.length,
            "Invalid components or chain index"
        );
        
        // Generate a random domain
        userNonces[msg.sender]++;
        string memory domainName = generateRandomDomain(msg.sender, userNonces[msg.sender], chainIndex);
        
        // Ensure domain isn't already registered (extremely unlikely but check anyway)
        require(!domainExists[domainName], "Domain already registered (try again)");
        
        // Store the domain components
        uint8 adjIndex = getRandomIndex(keccak256(abi.encodePacked(msg.sender, block.timestamp, userNonces[msg.sender], "adj")), validAdjectives.length);
        uint8 descIndex = getRandomIndex(keccak256(abi.encodePacked(msg.sender, block.timestamp, userNonces[msg.sender], "desc")), validDescriptors.length);
        uint8 nounIndex = getRandomIndex(keccak256(abi.encodePacked(msg.sender, block.timestamp, userNonces[msg.sender], "noun")), validNouns.length);
        
        // Create ID key (hash of domain name)
        bytes32 idKey = keccak256(bytes(domainName));
        
        // Store ID components
        domainComponents[idKey] = DomainComponents({
            adjectiveIndex: adjIndex,
            descriptorIndex: descIndex,
            nounIndex: nounIndex,
            chainIndex: chainIndex,
            exists: true
        });
        
        // Record ownership
        domainOwners[domainName] = DomainOwnership({
            owner: msg.sender,
            timestamp: block.timestamp
        });
        
        domainExists[domainName] = true;
        userDomainsList.push(domainName);
        
        emit DomainRegistered(domainName, msg.sender);
    }

    /**
     * @dev Transfer domain ownership to another address
     * @param name Domain name to transfer
     * @param to Address to transfer ownership to
     */
    function transferDomain(string calldata name, address to) external {
        // Verify ownership
        require(domainExists[name], "Domain does not exist");
        require(domainOwners[name].owner == msg.sender, "Not domain owner");
        
        // Remove from current owner's list (gas-optimized loop)
        string[] storage currentOwnerDomains = userDomains[msg.sender];
        uint256 length = currentOwnerDomains.length;
        
        for (uint i = 0; i < length; i++) {
            if (keccak256(bytes(currentOwnerDomains[i])) == keccak256(bytes(name))) {
                // Move the last element to the position being removed
                if (i < length - 1) {
                    currentOwnerDomains[i] = currentOwnerDomains[length - 1];
                }
                // Remove the last element
                currentOwnerDomains.pop();
                break;
            }
        }
        
        // Add to new owner's list
        string[] storage newOwnerDomains = userDomains[to];
        require(newOwnerDomains.length < MAX_DOMAINS_PER_USER, "Recipient has too many domains");
        newOwnerDomains.push(name);
        
        // Update ownership record
        domainOwners[name].owner = to;
        
        emit DomainTransferred(name, msg.sender, to);
    }

    // ====================
    // QUERY FUNCTIONS
    // ====================

    /**
     * @dev Get all domains owned by a user
     * @param user Address of the user
     * @return Array of domain names owned by the user
     */
    function getUserDomains(address user) external view returns (string[] memory) {
        return userDomains[user];
    }

    /**
     * @dev Get domain ownership information
     * @param name Domain name
     * @return owner The owner address of the domain
     * @return timestamp The registration timestamp
     * @return exists Whether the domain exists
     */
    function getDomainInfo(string calldata name) external view returns (
        address owner,
        uint256 timestamp,
        bool exists
    ) {
        DomainOwnership memory ownership = domainOwners[name];
        return (
            ownership.owner,
            ownership.timestamp,
            domainExists[name]
        );
    }

    /**
     * @dev Get the components of a domain
     * @param name Domain name
     * @return adjective The adjective component
     * @return descriptor The descriptor component
     * @return noun The noun component
     * @return chain The chain component
     */
    function getDomainComponents(string calldata name) external view returns (
        string memory adjective,
        string memory descriptor,
        string memory noun,
        string memory chain
    ) {
        bytes32 idKey = keccak256(bytes(name));
        DomainComponents memory components = domainComponents[idKey];
        
        require(components.exists, "Domain components not found");
        
        // Ensure indexes are valid
        require(components.adjectiveIndex < validAdjectives.length, "Invalid adjective index");
        require(components.descriptorIndex < validDescriptors.length, "Invalid descriptor index");
        require(components.nounIndex < validNouns.length, "Invalid noun index");
        require(components.chainIndex < validChains.length, "Invalid chain index");
        
        return (
            validAdjectives[components.adjectiveIndex],
            validDescriptors[components.descriptorIndex],
            validNouns[components.nounIndex],
            validChains[components.chainIndex]
        );
    }

    /**
     * @dev Peek at what random domain would be generated without actually registering it
     * @param user Address to generate for
     * @param nonce Nonce to use for randomness
     * @param chainIndex Chain index to use
     * @return Domain name that would be generated
     */
    function previewRandomDomain(address user, uint256 nonce, uint8 chainIndex) external view returns (string memory) {
        require(chainIndex < validChains.length, "Invalid chain index");
        return generateRandomDomain(user, nonce, chainIndex);
    }

    /**
     * @dev Get all valid components for name generation
     * @return Arrays of valid adjectives, descriptors, nouns, and chains
     */
    function getAllComponents() external view returns (
        string[] memory, 
        string[] memory, 
        string[] memory, 
        string[] memory
    ) {
        return (validAdjectives, validDescriptors, validNouns, validChains);
    }

    // ====================
    // INTERNAL FUNCTIONS
    // ====================

    /**
     * @dev Generate a random domain name
     * @param user Address to use for randomness
     * @param nonce Nonce to use for randomness
     * @param chainIndex Chain index to use
     * @return The generated domain name
     */
    function generateRandomDomain(address user, uint256 nonce, uint8 chainIndex) internal view returns (string memory) {
        require(chainIndex < validChains.length, "Invalid chain index");
        
        // Generate random indices for each component
        uint8 adjIndex = getRandomIndex(keccak256(abi.encodePacked(user, block.timestamp, nonce, "adj")), validAdjectives.length);
        uint8 descIndex = getRandomIndex(keccak256(abi.encodePacked(user, block.timestamp, nonce, "desc")), validDescriptors.length);
        uint8 nounIndex = getRandomIndex(keccak256(abi.encodePacked(user, block.timestamp, nonce, "noun")), validNouns.length);
        
        // Format domain with hyphens between words: adjective-descriptor-noun.chain.opti.id
        return string(
            abi.encodePacked(
                validAdjectives[adjIndex], 
                "-", 
                validDescriptors[descIndex], 
                "-", 
                validNouns[nounIndex], 
                ".", 
                validChains[chainIndex],
                OPTI_SUFFIX
            )
        );
    }
    
    /**
     * @dev Get a random index within the range [0, max)
     * @param seed Seed to use for randomness
     * @param max Maximum value (exclusive)
     * @return Random index
     */
    function getRandomIndex(bytes32 seed, uint256 max) internal pure returns (uint8) {
        require(max <= 255, "Max too large for uint8");
        require(max > 0, "Max must be positive");
        return uint8(uint256(seed) % max);
    }
} 