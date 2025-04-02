import { ethers, network } from "hardhat";
import { formatEther } from "ethers/lib/utils";
import { wordList, chains } from "../constants/domainData";

async function main() {
  // Get the network information
  const networkName = network.name;
  const chainId = network.config.chainId;

  console.log(
    `\n📝 Deploying OptiIdRegistry to ${networkName} (Chain ID: ${chainId})\n`
  );

  const [deployer] = await ethers.getSigners();
  console.log(`🔑 Deployer Account: ${deployer.address}`);
  console.log(
    `💰 Deployer Balance: ${formatEther(
      await ethers.provider.getBalance(deployer.address)
    )} ETH\n`
  );

  // Deploy the contract
  console.log(`⏳ Deploying contract...`);
  const OptiIdRegistry = await ethers.getContractFactory("OptiIdRegistry");
  const registry = await OptiIdRegistry.deploy();

  console.log(`⏳ Waiting for deployment transaction to be mined...`);
  await registry.deployed();

  // Set valid components for name generation
  console.log(`⏳ Setting valid components for name generation...`);
  await registry.setValidComponents(
    wordList.adjectives,
    wordList.descriptors,
    wordList.nouns,
    chains
  );

  const address = registry.address;
  const txHash = registry.deployTransaction.hash;

  console.log(`\n✅ OptiIdRegistry deployed successfully!`);
  console.log(`📍 Contract Address: ${address}`);
  console.log(`🔗 Transaction Hash: ${txHash}`);
  
  // Print the registration fee
  const regFee = await registry.REGISTRATION_FEE();
  console.log(`💰 Registration Fee: ${formatEther(regFee)} ETH`);
  
  // Generate a preview of what a random domain would look like
  const previewDomain = await registry.previewRandomDomain(deployer.address, 1, 0);
  console.log(`🔮 Sample Domain Preview: ${previewDomain}`);
  
  // Parse the domain to show its components 
  const dotParts = previewDomain.split('.');
  const nameParts = dotParts[0].split('-');
  
  console.log(`
📋 Domain Format Explanation:
  Adjective: ${nameParts[0]}
  Descriptor: ${nameParts[1]}
  Noun: ${nameParts[2]}
  Chain: ${dotParts[1]}
  TLD: .opti.id
`);
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(`\n❌ Deployment failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
