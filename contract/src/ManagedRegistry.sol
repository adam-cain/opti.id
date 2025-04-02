// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./interfaces/IDomain.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/Multicall.sol";
import "./lib/LabelValidator.sol";

/// @title PermissionedRegistry
/// @notice A registry contract that can be delegated to register subdomains with EIP-712 signature verification
contract ManagedRegistry is EIP712, Multicall {
    using LabelValidator for string;
    using LabelValidator for LabelValidator.WordList;

    // Max domains per user
    uint256 public constant MAX_DOMAINS_PER_USER = 5;

    //Problems of the eip 712:
    // 1. Users needs to be able to sign the eip message on the client side and submit it to the server where the register data is then generated and sent to the contract.
    // 2. The server needs to be trusted to generate the register data correctly and submit it to the contract.
    // 3. The user should not know what domain or label they are registering, as the eip message is generated on the server side and randomised.

    // EIP-712 type hash for user request
    bytes32 public constant REGISTER_TYPEHASH =
        keccak256("Register(address domain,string label,address owner,uint256 deadline,bytes32 nonce)");

    bytes32 public constant REGISTER_RANDOM_TYPEHASH =
        keccak256("Register Random(address owner,uint256 deadline,bytes32 nonce)");

    event LabelRequested(address indexed user, uint256 indexed requestId, uint256 deadline);
    event LabelAssigned(address indexed user, uint256 indexed requestId, string label);

    error Unauthorized();
    error LimitExceeded();
    error InvalidLabelFormat();
    error SignatureExpired();
    error InvalidSignature();
    error NonceAlreadyUsed();
    error RegistrationFailed();

    event SubdomainRegistered(
        address indexed domain, string label, address indexed owner, uint256 deadline, bytes32 nonce
    );

    // Server account that will register labels on behalf of users
    address public immutable registrationServer;
    // Track registrations per user
    mapping(address => uint256) public userRegistrationCount;
    // Mapping to track used nonces
    mapping(bytes32 => bool) public usedNonces;

    constructor(address _registrationServer) EIP712("OptiPermissionedRegistry", "1.0.0") {
        registrationServer = _registrationServer;
    }

    // Server assigns and registers a label for user
    function register(
        address domain, // I think this is the domain implementation contract, for the random chain ie base, op, ink etc
        string calldata label, // This is the label ie {adjective}-{descriptor}-{noun}
        address owner, // User address to assign the register to
        uint256 deadline,
        bytes32 nonce,
        bytes calldata signature
    ) external {
        if (userRegistrationCount[owner] >= MAX_DOMAINS_PER_USER) {
            revert LimitExceeded();
        }

        if (!verifySignatureRandom(domain, owner, deadline, nonce, signature)) {
            revert InvalidSignature();
        }

        usedNonces[nonce] = true;

        // This validates the label format and that the subdomain is not already registered.
        // This also only allows the registration server to register subdomains. by setting the registry as a delegate in the Domain Implementation contract.
        address subdomain = IDomain(domain).registerSubdomain(label, owner);

        if (subdomain == address(0)) revert RegistrationFailed();

        // Update user's registration count
        userRegistrationCount[owner]++;

        emit SubdomainRegistered(domain, label, owner, deadline, nonce);
    }

    /// @notice Verify if a signature is valid for a registration
    /// @param domain The domain contract address
    /// @param owner The intended owner
    /// @param deadline The expiration timestamp
    /// @param nonce The unique nonce
    /// @param signature The signature to verify
    /// @return bool True if the signature is valid
    function verifySignatureRandom(
        address domain,
        address owner,
        uint256 deadline,
        bytes32 nonce,
        bytes calldata signature
    ) public view returns (bool) {
        // Check expiration
        if (block.timestamp > deadline) revert SignatureExpired();

        // Check if nonce has been used
        if (usedNonces[nonce]) revert NonceAlreadyUsed();

        // Get domain owner
        address domainOwner = IDomain(domain).owner();

        // Verify signature using EIP-712
        bytes32 structHash = keccak256(abi.encode(REGISTER_RANDOM_TYPEHASH, owner, deadline, nonce));
        bytes32 hash = _hashTypedDataV4(structHash);

        // Verify using SignatureChecker
        return SignatureChecker.isValidSignatureNow(domainOwner, hash, signature);
    }

    /// @notice Get the EIP-712 domain separator
    function getDomainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    /// @notice Get the struct hash for signing
    /// @param domain The domain contract address
    /// @param label The subdomain label
    /// @param owner The intended owner
    /// @param deadline The expiration timestamp
    /// @param nonce The unique nonce
    /// @return The struct hash to sign
    function getStructHash(address domain, string calldata label, address owner, uint256 deadline, bytes32 nonce)
        external
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(REGISTER_TYPEHASH, domain, keccak256(bytes(label)), owner, deadline, nonce));
    }
}
