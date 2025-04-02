// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { Script, console } from "forge-std/Script.sol";
import { DomainRoot } from "../src/DomainRoot.sol";
import { ManagedRegistry } from "../src/ManagedRegistry.sol";
import { SingularResolver } from "../src/SingularResolver.sol";
import { DomainImplementation } from "../src/DomainImplementation.sol";
import { DomainUpgradeableProxy } from "../src/DomainUpgradeableProxy.sol";
import { TransparentUpgradeableProxy } from "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import { ProxyAdmin } from "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

/**
 * @title DeployProductionRegistryScript
 * @notice Production deployment script for the Opti Registry system
 * @dev Uses deterministic deployment to maintain the same addresses across networks
 */
contract DeployProductionRegistryScript is Script {
    // Use current block timestamp as salt for deterministic deployment
    bytes32 internal immutable SALT;
    // Define the chains in the superchain
    string[] public chains = [
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

    // Deployment addresses
    address public implementationLogicAddr;
    address public implementationProxyAddr;
    address public resolverLogicAddr;
    address public resolverProxyAddr;
    address public rootAddr;
    address public registryAddr;
    address public registrationServer;
    address public proxyAdminAddr;

    // Deployer address that will own the contracts
    address public deployerAddress;

    // Configuration
    bool public skipExistingDeployments = true;

    constructor() {
        // Use current block timestamp as salt for new deployments every deployment, change to static value for deterministic deployments.
        SALT = bytes32(uint256(block.timestamp));
    }

    function setUp() public {
        // This should be set to the registration server address for production
        registrationServer = vm.envAddress("REGISTRATION_SERVER_ADDRESS");
        require(registrationServer != address(0), "Registration server address must be set");

        console.log("Registration server:", registrationServer);

        // Use the deployer address from environment or default to msg.sender
        address envDeployer = vm.envOr("DEPLOYER_ADDRESS", address(0));
        deployerAddress = envDeployer != address(0) ? envDeployer : msg.sender;

        // Create ProxyAdmin for better upgrade control in production
        bytes memory proxyAdminInitCode = abi.encodePacked(type(ProxyAdmin).creationCode);
        proxyAdminAddr = vm.computeCreate2Address(SALT, keccak256(proxyAdminInitCode), deployerAddress);

        // Compute deterministic addresses
        implementationLogicAddr =
            vm.computeCreate2Address(SALT, keccak256(type(DomainImplementation).creationCode), deployerAddress);

        bytes memory proxyInitCode = abi.encodePacked(
            type(DomainUpgradeableProxy).creationCode, abi.encode(implementationLogicAddr, deployerAddress, "")
        );
        implementationProxyAddr = vm.computeCreate2Address(SALT, keccak256(proxyInitCode), deployerAddress);

        bytes memory rootInitCode =
            abi.encodePacked(type(DomainRoot).creationCode, abi.encode(implementationProxyAddr, deployerAddress));
        rootAddr = vm.computeCreate2Address(SALT, keccak256(rootInitCode), deployerAddress);

        bytes memory resolverInitCode = abi.encodePacked(type(SingularResolver).creationCode, abi.encode(rootAddr));
        resolverLogicAddr = vm.computeCreate2Address(SALT, keccak256(resolverInitCode), deployerAddress);

        proxyInitCode = abi.encodePacked(
            type(TransparentUpgradeableProxy).creationCode, abi.encode(resolverLogicAddr, proxyAdminAddr, "")
        );
        resolverProxyAddr = vm.computeCreate2Address(SALT, keccak256(proxyInitCode), deployerAddress);

        // For ManagedRegistry, we only need to pass the registration server address to the constructor
        bytes memory registryInitCode =
            abi.encodePacked(type(ManagedRegistry).creationCode, abi.encode(registrationServer));
        registryAddr = vm.computeCreate2Address(SALT, keccak256(registryInitCode), deployerAddress);
    }

    function deployImplementation() internal returns (DomainImplementation, DomainUpgradeableProxy) {
        // Deploy ProxyAdmin if needed
        ProxyAdmin proxyAdmin = ProxyAdmin(proxyAdminAddr);
        if (address(proxyAdmin).code.length == 0) {
            proxyAdmin = new ProxyAdmin{ salt: SALT }(deployerAddress);
            console.log("Deployed ProxyAdmin at:", address(proxyAdmin));
        } else {
            console.log("Using existing ProxyAdmin at:", address(proxyAdmin));
        }

        // Deploy implementation logic if needed
        DomainImplementation implementationLogic = DomainImplementation(implementationLogicAddr);
        if (address(implementationLogic).code.length == 0) {
            implementationLogic = new DomainImplementation{ salt: SALT }();
            console.log("Deployed Implementation Logic at:", address(implementationLogic));
        } else {
            console.log("Using existing Implementation Logic at:", address(implementationLogic));
        }

        // Deploy implementation proxy if needed
        DomainUpgradeableProxy implementationProxy = DomainUpgradeableProxy(payable(implementationProxyAddr));
        if (address(implementationProxy).code.length == 0) {
            implementationProxy =
                new DomainUpgradeableProxy{ salt: SALT }(address(implementationLogic), deployerAddress, "");
            console.log("Deployed Implementation Proxy at:", address(implementationProxy));
        } else {
            console.log("Using existing Implementation Proxy at:", address(implementationProxy));
        }

        return (implementationLogic, implementationProxy);
    }

    function deployResolver(address root) internal returns (SingularResolver, TransparentUpgradeableProxy) {
        // Deploy resolver logic if needed
        SingularResolver resolverLogic = SingularResolver(resolverLogicAddr);
        if (address(resolverLogic).code.length == 0) {
            resolverLogic = new SingularResolver{ salt: SALT }(root);
            console.log("Deployed Resolver Logic at:", address(resolverLogic));
        }

        // Deploy resolver proxy if needed
        TransparentUpgradeableProxy resolverProxy = TransparentUpgradeableProxy(payable(resolverProxyAddr));
        if (address(resolverProxy).code.length == 0) {
            resolverProxy = new TransparentUpgradeableProxy{ salt: SALT }(address(resolverLogic), proxyAdminAddr, "");
            console.log("Deployed Resolver Proxy at:", address(resolverProxy));
        }

        return (resolverLogic, resolverProxy);
    }

    function run() public {
        // Print expected deterministic addresses
        console.log("\nExpected Deterministic Addresses:");
        console.log("--------------------------------");
        console.log("Implementation Logic:", implementationLogicAddr);
        console.log("Implementation Proxy:", implementationProxyAddr);
        console.log("Resolver Logic:", resolverLogicAddr);
        console.log("Resolver Proxy:", resolverProxyAddr);
        console.log("Root:", rootAddr);
        console.log("Registry:", registryAddr);
        console.log("Registration Server:", registrationServer);
        console.log("Proxy Admin:", proxyAdminAddr);
        console.log("Deployer:", deployerAddress);
        console.log("");

        vm.startBroadcast();

        // Deploy implementation contracts
        (DomainImplementation implementationLogic, DomainUpgradeableProxy implementationProxy) = deployImplementation();

        // Deploy root if needed
        DomainRoot root = DomainRoot(rootAddr);
        if (address(root).code.length == 0) {
            root = new DomainRoot{ salt: SALT }(address(implementationProxy), deployerAddress);
            console.log("Deployed Root at:", address(root));
            root.setSubdomainOwnerDelegation(true, true);
        } else if (skipExistingDeployments) {
            console.log("Using existing Root at:", address(root));
        } else {
            // Check if the subdomain delegation is enabled for existing root
            console.log("Root already deployed, checking configuration...");
        }

        // Deploy resolver contracts
        (SingularResolver resolverLogic, TransparentUpgradeableProxy resolverProxy) = deployResolver(address(root));

        // Set resolver if needed
        if (root.resolver() != address(resolverProxy)) {
            root.setResolver(address(resolverProxy));
            console.log("Set resolver to:", address(resolverProxy));
        }

        // Deploy managed registry if needed - pass only the registration server address
        ManagedRegistry registry = ManagedRegistry(registryAddr);
        if (address(registry).code.length == 0) {
            registry = new ManagedRegistry{ salt: SALT }(registrationServer);
            console.log("Deployed Registry at:", address(registry));
        } else {
            console.log("Using existing Registry at:", address(registry));

            // Verify registration server is correctly set
            address currentServer = registry.registrationServer();
            if (currentServer != registrationServer) {
                console.log("WARNING: Registration server mismatch!");
                console.log("Current:", currentServer);
                console.log("Expected:", registrationServer);
            }
        }

        // Setup .opti.id domain
        DomainImplementation optiDomain = DomainImplementation(root.subdomains("opti"));
        if (address(optiDomain) == address(0)) {
            optiDomain = DomainImplementation(root.registerSubdomain("opti", deployerAddress));
            console.log("Registered opti.id domain at:", address(optiDomain));

            optiDomain.setSubdomainOwnerDelegation(true, true);
            optiDomain.addAuthorizedDelegate(address(registry), true);
            console.log("Configured opti.id domain with registry delegation");
        } else {
            console.log("Using existing opti.id domain at:", address(optiDomain));

            // Ensure proper configuration
            if (!optiDomain.authorizedDelegates(address(registry))) {
                optiDomain.addAuthorizedDelegate(address(registry), true);
                console.log("Added registry as delegate for opti.id domain");
            }
        }

        // Create subdomains for each chain in the superchain
        console.log("\nConfiguring chain subdomains:");
        for (uint256 i = 0; i < chains.length; i++) {
            DomainImplementation chainDomain = DomainImplementation(optiDomain.subdomains(chains[i]));
            if (address(chainDomain) == address(0)) {
                address chainSubdomain = optiDomain.registerSubdomain(chains[i], deployerAddress);
                chainDomain = DomainImplementation(chainSubdomain);

                // Configure chain subdomain
                chainDomain.setSubdomainOwnerDelegation(true, true);

                chainDomain.addAuthorizedDelegate(address(registry), true);

                console.log(string.concat(chains[i], ".opti.id:"), address(chainDomain));
            } else {
                // Ensure proper configuration on existing subdomains
                if (!chainDomain.authorizedDelegates(address(registry))) {
                    chainDomain.addAuthorizedDelegate(address(registry), true);
                    console.log("Added registry as delegate for", string.concat(chains[i], ".opti.id"));
                }
            }
        }

        vm.stopBroadcast();

        // Final summary of deployed addresses
        console.log("\nProduction Deployment Complete");
        console.log("============================");
        console.log("Implementation Logic:", address(implementationLogic));
        console.log("Implementation Proxy:", address(implementationProxy));
        console.log("Resolver Logic:", address(resolverLogic));
        console.log("Resolver Proxy:", address(resolverProxy));
        console.log("Root:", address(root));
        console.log("opti.id:", address(optiDomain));
        console.log("Registry:", address(registry));
        console.log("Registration Server:", registrationServer);
        console.log("Proxy Admin:", proxyAdminAddr);
    }
}
