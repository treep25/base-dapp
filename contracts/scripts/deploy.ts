import { ethers, network, run } from "hardhat";

async function main() {
  console.log("Starting FlappyLeaderboard deployment...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  const signerAddress = process.env.SIGNER_ADDRESS;
  if (!signerAddress) {
    throw new Error("SIGNER_ADDRESS environment variable is required");
  }
  console.log("Signer address for score verification:", signerAddress);

  console.log("\nDeploying FlappyLeaderboard contract...");
  const FlappyLeaderboard = await ethers.getContractFactory("FlappyLeaderboard");
  const leaderboard = await FlappyLeaderboard.deploy(signerAddress);
  
  await leaderboard.waitForDeployment();
  const contractAddress = await leaderboard.getAddress();
  
  console.log("FlappyLeaderboard deployed to:", contractAddress);
  console.log("Network:", network.name);
  console.log("Chain ID:", network.config.chainId);

  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\nWaiting for block confirmations...");
    await leaderboard.deploymentTransaction()?.wait(5);
    console.log("Confirmed!");

    console.log("\nVerifying contract on BaseScan...");
    try {
      await run("verify:verify", {
        address: contractAddress,
        constructorArguments: [signerAddress],
      });
      console.log("Contract verified on BaseScan!");
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log("Contract already verified!");
      } else {
        console.log("Verification failed:", error.message);
      }
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(50));
  console.log("Contract:      FlappyLeaderboard");
  console.log("Address:      ", contractAddress);
  console.log("Signer:       ", signerAddress);
  console.log("Network:      ", network.name);
  console.log("Chain ID:     ", network.config.chainId);
  console.log("=".repeat(50));

  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
