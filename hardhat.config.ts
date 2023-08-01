import { HardhatUserConfig, task } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config();

task("accounts", "Prints the list of accounts", async (_, hre) => {
  const accounts = await hre.ethers.getSigners();
  console.log("Number of accounts:", accounts.length);

  for (const account of accounts) {
    const balance = await hre.ethers.provider.getBalance(account.address);
    console.log(account.address, hre.ethers.formatEther(balance));
  }
});

const config: HardhatUserConfig = {
  solidity: "0.8.18",
  networks: {
    hardhat: {
      forking: {
        url: process.env.FORK_URL || "",
        blockNumber: 17800000,
      },
    },

    eth: {
      url: "https://eth.public-rpc.com",
      accounts: [process.env.PRIVATE_KEY || ""],
    },

    pulse: {
      url: "https://rpc.pulsechain.com",
      accounts: [process.env.PRIVATE_KEY || ""],
    },

    btest: {
      url: "https://bsc-testnet.publicnode.com",
      accounts: [process.env.PRIVATE_KEY || ""],
    },

    base: {
      url: "https://developer-access-mainnet.base.org",
      accounts: [process.env.PRIVATE_KEY || ""],
    },
  },

  etherscan: {
    apiKey: process.env.ETHSCAN_API_KEY || "",
  },
};

export default config;
