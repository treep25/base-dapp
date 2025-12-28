import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";

/**
 * Hardhat Configuration for Flappy Leaderboard
 * 
 * This configuration supports:
 * - Local development with Hardhat Network
 * - Base Sepolia testnet deployment
 * - Base Mainnet deployment
 * 
 * Environment Variables Required:
 * - PRIVATE_KEY: Your deployer wallet private key
 * - BASESCAN_API_KEY: API key for contract verification on BaseScan
 */

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200, // Optimize for lower gas costs on frequent function calls
      },
      viaIR: true, // Enable IR-based code generation for better optimization
    },
  },
  networks: {
    // Local Hardhat network for development
    hardhat: {
      chainId: 31337,
    },
    // Base Sepolia Testnet
    baseSepolia: {
      url: "https://sepolia.base.org",
      chainId: 84532,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei
    },
    // Base Mainnet
    base: {
      url: "https://mainnet.base.org",
      chainId: 8453,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei
    },
  },
  etherscan: {
    apiKey: {
      baseSepolia: process.env.BASESCAN_API_KEY || "",
      base: process.env.BASESCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;

