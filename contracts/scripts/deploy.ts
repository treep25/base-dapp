import { ethers, network, run } from "hardhat";

/**
 * Deployment Script for FlappyLeaderboard Contract
 * 
 * Usage:
 * - Local:        npx hardhat run scripts/deploy.ts --network localhost
 * - Base Sepolia: npx hardhat run scripts/deploy.ts --network baseSepolia
 * - Base Mainnet: npx hardhat run scripts/deploy.ts --network base
 * 
 * Requirements:
 * - Set PRIVATE_KEY environment variable
 * - Set BASESCAN_API_KEY for verification
 */

async function main() {
  console.log("🚀 Starting FlappyLeaderboard deployment...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy contract
  console.log("📦 Deploying FlappyLeaderboard contract...");
  const FlappyLeaderboard = await ethers.getContractFactory("FlappyLeaderboard");
  const leaderboard = await FlappyLeaderboard.deploy();
  
  await leaderboard.waitForDeployment();
  const contractAddress = await leaderboard.getAddress();
  
  console.log("✅ FlappyLeaderboard deployed to:", contractAddress);
  console.log("🔗 Network:", network.name);
  console.log("⛓️  Chain ID:", network.config.chainId);

  // Wait for block confirmations on testnet/mainnet
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\n⏳ Waiting for block confirmations...");
    await leaderboard.deploymentTransaction()?.wait(5);
    console.log("✅ Confirmed!");

    // Verify contract on BaseScan
    console.log("\n🔍 Verifying contract on BaseScan...");
    try {
      await run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on BaseScan!");
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log("✅ Contract already verified!");
      } else {
        console.log("❌ Verification failed:", error.message);
      }
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(50));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(50));
  console.log("Contract:      FlappyLeaderboard");
  console.log("Address:      ", contractAddress);
  console.log("Network:      ", network.name);
  console.log("Chain ID:     ", network.config.chainId);
  console.log("=".repeat(50));

  // Print frontend integration instructions
  console.log("\n📝 Next Steps:");
  console.log("1. Copy the contract address to frontend/src/config/contract.ts");
  console.log("2. Copy the ABI from artifacts/contracts/FlappyLeaderboard.sol/FlappyLeaderboard.json");
  console.log("3. Update the chain configuration if needed");
  
  // Return contract address for testing
  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

