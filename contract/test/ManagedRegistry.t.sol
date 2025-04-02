// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "forge-std/Test.sol";
import { DomainImplementation } from "../src/DomainImplementation.sol";
import "../src/ManagedRegistry.sol";
import "../src/DomainRoot.sol";

contract ManagedRegistryTest is Test {
    using ClonesWithImmutableArgs for address;

    ManagedRegistry public registry;
    DomainImplementation public root;
    address public implementation;
    uint256 public ownerPrivateKey;
    address public owner;
    address public registrationServer;
    uint256 public serverPrivateKey;

    function setUp() public {
        implementation = address(new DomainImplementation());
        ownerPrivateKey = 0x1234;
        owner = vm.addr(ownerPrivateKey);
        serverPrivateKey = 0x5678;
        registrationServer = vm.addr(serverPrivateKey);
        root = new DomainRoot(implementation, owner);

        registry = new ManagedRegistry(registrationServer);
        vm.startPrank(owner);
        root.addAuthorizedDelegate(address(registry), true);
        vm.stopPrank();
    }

    function testRegisterWithValidSignature() public {
        string memory label = "swift-mighty-fox";
        address newOwner = address(0xabc);
        uint256 deadline = vm.getBlockTimestamp() + 1 hours;
        bytes32 nonce = bytes32(uint256(1));

        bytes32 structHash = registry.getStructHash(address(root), label, newOwner, deadline, nonce);
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", registry.getDomainSeparator(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(registrationServer);
        registry.register(address(root), label, newOwner, deadline, nonce, signature);

        // Verify registration count is incremented
        assertEq(registry.userRegistrationCount(newOwner), 1);
    }

    function testUnauthorizedRegistration() public {
        string memory label = "swift-mighty-fox";
        address newOwner = address(0xabc);
        uint256 deadline = vm.getBlockTimestamp() + 1 hours;
        bytes32 nonce = bytes32(uint256(1));

        bytes32 structHash = registry.getStructHash(address(root), label, newOwner, deadline, nonce);
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", registry.getDomainSeparator(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        // Try to register from non-server address
        vm.prank(newOwner);
        vm.expectRevert(ManagedRegistry.Unauthorized.selector);
        registry.register(address(root), label, newOwner, deadline, nonce, signature);
    }

    function testInvalidLabelFormat() public {
        string memory label = "invalid-label"; // Not in adjective-descriptor-noun format
        address newOwner = address(0xabc);
        uint256 deadline = vm.getBlockTimestamp() + 1 hours;
        bytes32 nonce = bytes32(uint256(1));

        bytes32 structHash = registry.getStructHash(address(root), label, newOwner, deadline, nonce);
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", registry.getDomainSeparator(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(registrationServer);
        vm.expectRevert(ManagedRegistry.InvalidLabelFormat.selector);
        registry.register(address(root), label, newOwner, deadline, nonce, signature);
    }

    function testUserRegistrationLimit() public {
        address newOwner = address(0xabc);
        uint256 deadline = vm.getBlockTimestamp() + 1 hours;
        bytes memory signature;
        bytes32 digest;
        bytes32 structHash;
        bytes32 nonce;
        string memory label;

        // Use these adjectives that exist in our wordlist
        string[5] memory adjectives = ["swift", "brave", "wise", "calm", "bold"];

        vm.startPrank(registrationServer);

        // Register MAX_DOMAINS_PER_USER domains
        for (uint256 i = 0; i < 5; i++) {
            label = string(abi.encodePacked(adjectives[i], "-mighty-fox"));
            nonce = bytes32(i + 1);

            structHash = registry.getStructHash(address(root), label, newOwner, deadline, nonce);
            digest = keccak256(abi.encodePacked("\x19\x01", registry.getDomainSeparator(), structHash));
            (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, digest);
            signature = abi.encodePacked(r, s, v);

            registry.register(address(root), label, newOwner, deadline, nonce, signature);
        }

        // Try to register one more (should fail)
        label = "pure-mighty-fox";
        nonce = bytes32(uint256(6));
        structHash = registry.getStructHash(address(root), label, newOwner, deadline, nonce);
        digest = keccak256(abi.encodePacked("\x19\x01", registry.getDomainSeparator(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, digest);
        signature = abi.encodePacked(r, s, v);

        vm.expectRevert(ManagedRegistry.LimitExceeded.selector);
        registry.register(address(root), label, newOwner, deadline, nonce, signature);

        vm.stopPrank();

        // Verify registration count is at max
        assertEq(registry.userRegistrationCount(newOwner), 5);
    }

    function testExpiredSignature() public {
        vm.warp(1738428733);

        string memory label = "swift-mighty-fox";
        address newOwner = address(0xabc);
        uint256 deadline = vm.getBlockTimestamp() - 1 hours;
        bytes32 nonce = bytes32(uint256(1));

        bytes32 structHash = registry.getStructHash(address(root), label, newOwner, deadline, nonce);
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", registry.getDomainSeparator(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(registrationServer);
        vm.expectRevert(ManagedRegistry.SignatureExpired.selector);
        registry.register(address(root), label, newOwner, deadline, nonce, signature);
    }

    function testReuseNonce() public {
        string memory label = "swift-mighty-fox";
        address newOwner = address(0xabc);
        uint256 deadline = vm.getBlockTimestamp() + 1 hours;
        bytes32 nonce = bytes32(uint256(1));

        bytes32 structHash = registry.getStructHash(address(root), label, newOwner, deadline, nonce);
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", registry.getDomainSeparator(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.prank(registrationServer);
        registry.register(address(root), label, newOwner, deadline, nonce, signature);

        // Try to reuse the same nonce
        string memory label2 = "brave-mighty-tiger";
        vm.prank(registrationServer);
        vm.expectRevert(ManagedRegistry.NonceAlreadyUsed.selector);
        registry.register(address(root), label2, newOwner, deadline, nonce, signature);
    }
}
