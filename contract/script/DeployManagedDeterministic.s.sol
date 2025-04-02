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

contract DeployManagedDeterministicScript is Script {
    // Zero salt for deterministic deployment
    bytes32 constant ZERO_SALT = bytes32(0);

    // Define the chains in the superchain, more to come
    string[] public chains = ["optimism", "base", "linea", "unichain", "opbnb"];

    // Deployment addresses
    address public implementationLogicAddr;
    address public implementationProxyAddr;
    address public resolverLogicAddr;
    address public resolverProxyAddr;
    address public rootAddr;
    address public registryAddr;
    address public registrationServer;

    function setUp() public {
        // Set registration server address (this should be set to your server's address)
        registrationServer = address(0x1234); // Replace with actual server address

        // Compute deterministic addresses
        implementationLogicAddr =
            vm.computeCreate2Address(ZERO_SALT, keccak256(type(DomainImplementation).creationCode), CREATE2_FACTORY);

        bytes memory proxyInitCode = abi.encodePacked(
            type(DomainUpgradeableProxy).creationCode, abi.encode(implementationLogicAddr, msg.sender, "")
        );
        implementationProxyAddr = vm.computeCreate2Address(ZERO_SALT, keccak256(proxyInitCode), CREATE2_FACTORY);

        bytes memory rootInitCode =
            abi.encodePacked(type(DomainRoot).creationCode, abi.encode(implementationProxyAddr, msg.sender));
        rootAddr = vm.computeCreate2Address(ZERO_SALT, keccak256(rootInitCode), CREATE2_FACTORY);

        bytes memory resolverInitCode = abi.encodePacked(type(SingularResolver).creationCode, abi.encode(rootAddr));
        resolverLogicAddr = vm.computeCreate2Address(ZERO_SALT, keccak256(resolverInitCode), CREATE2_FACTORY);

        proxyInitCode = abi.encodePacked(
            type(TransparentUpgradeableProxy).creationCode, abi.encode(resolverLogicAddr, msg.sender, "")
        );
        resolverProxyAddr = vm.computeCreate2Address(ZERO_SALT, keccak256(proxyInitCode), CREATE2_FACTORY);

        registryAddr =
            vm.computeCreate2Address(ZERO_SALT, keccak256(type(ManagedRegistry).creationCode), CREATE2_FACTORY);
    }

    function deployImplementation() internal returns (DomainImplementation, DomainUpgradeableProxy) {
        // Deploy implementation logic if needed
        DomainImplementation implementationLogic = DomainImplementation(implementationLogicAddr);
        if (address(implementationLogic).code.length == 0) {
            implementationLogic = new DomainImplementation{ salt: ZERO_SALT }();
        }

        // Deploy implementation proxy if needed
        DomainUpgradeableProxy implementationProxy = DomainUpgradeableProxy(payable(implementationProxyAddr));
        if (address(implementationProxy).code.length == 0) {
            implementationProxy =
                new DomainUpgradeableProxy{ salt: ZERO_SALT }(address(implementationLogic), msg.sender, "");
        }

        return (implementationLogic, implementationProxy);
    }

    function deployResolver(address root) internal returns (SingularResolver, TransparentUpgradeableProxy) {
        // Deploy resolver logic if needed
        SingularResolver resolverLogic = SingularResolver(resolverLogicAddr);
        if (address(resolverLogic).code.length == 0) {
            resolverLogic = new SingularResolver{ salt: ZERO_SALT }(root);
        }

        // Deploy resolver proxy if needed
        TransparentUpgradeableProxy resolverProxy = TransparentUpgradeableProxy(payable(resolverProxyAddr));
        if (address(resolverProxy).code.length == 0) {
            resolverProxy = new TransparentUpgradeableProxy{ salt: ZERO_SALT }(address(resolverLogic), msg.sender, "");
        }

        return (resolverLogic, resolverProxy);
    }

    function run() public {
        // Print deterministic addresses
        console.log("Implementation Logic:", implementationLogicAddr);
        console.log("Implementation Proxy:", implementationProxyAddr);
        console.log("Resolver Logic:", resolverLogicAddr);
        console.log("Resolver Proxy:", resolverProxyAddr);
        console.log("Root:", rootAddr);
        console.log("Registry:", registryAddr);
        console.log("Registration Server:", registrationServer);

        vm.startBroadcast();

        // Deploy implementation contracts
        (DomainImplementation implementationLogic, DomainUpgradeableProxy implementationProxy) = deployImplementation();

        // Deploy root if needed
        DomainRoot root = DomainRoot(rootAddr);
        if (address(root).code.length == 0) {
            root = new DomainRoot{ salt: ZERO_SALT }(address(implementationProxy), msg.sender);
        }

        root.setSubdomainOwnerDelegation(true, true);

        // Deploy resolver contracts
        (SingularResolver resolverLogic, TransparentUpgradeableProxy resolverProxy) = deployResolver(address(root));

        // Set resolver if needed
        if (root.resolver() != address(resolverProxy)) {
            root.setResolver(address(resolverProxy));
        }

        // Deploy managed registry if needed
        ManagedRegistry registry = ManagedRegistry(registryAddr);
        if (address(registry).code.length == 0) {
            registry = new ManagedRegistry{ salt: ZERO_SALT }(registrationServer);
        }

        // Setup .opti.id domain instead of .id
        DomainImplementation optiDomain = DomainImplementation(root.subdomains("opti"));
        if (address(optiDomain) == address(0)) {
            optiDomain = DomainImplementation(root.registerSubdomain("opti", msg.sender));
            optiDomain.setSubdomainOwnerDelegation(true, true);
            optiDomain.addAuthorizedDelegate(address(registry), true);
        }

        // Create subdomains for each chain in the superchain
        for (uint256 i = 0; i < chains.length; i++) {
            DomainImplementation chainDomain = DomainImplementation(optiDomain.subdomains(chains[i]));
            if (address(chainDomain) == address(0)) {
                address chainSubdomain = optiDomain.registerSubdomain(chains[i], msg.sender);
                chainDomain = DomainImplementation(chainSubdomain);

                // Configure chain subdomain
                chainDomain.setSubdomainOwnerDelegation(true, true);
                chainDomain.addAuthorizedDelegate(address(registry), true);

                console.log(string.concat(chains[i], ".opti.id:"), address(chainDomain));
            }
        }

        vm.stopBroadcast();

        // Log deployed addresses
        console.log("Deployment Addresses:");
        console.log("--------------------");
        console.log("Implementation Logic:", address(implementationLogic));
        console.log("Implementation Proxy:", address(implementationProxy));
        console.log("Resolver Logic:", address(resolverLogic));
        console.log("Resolver Proxy:", address(resolverProxy));
        console.log("Root:", address(root));
        console.log("opti.id:", address(optiDomain));
        console.log("Registry:", address(registry));
        console.log("Registration Server:", registrationServer);
    }
}
