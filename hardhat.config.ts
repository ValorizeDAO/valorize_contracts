import "@nomiclabs/hardhat-waffle";
import { task } from "hardhat/config";
import "hardhat-typechain";
import { ethers } from "hardhat";
require('dotenv').config()
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    const accountBalance = await account.getBalance()
    console.log(account.address, "balance:", hre.ethers.utils.formatEther(accountBalance));
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
export default {
  solidity: {
    compilers: [
      {
        version: "0.8.14",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        }
      },
      {
        version: "0.8.13",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        }
      },
    ],
  },
  networks: {
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: [process.env.DEPLOY_ACCOUNT_PRIVKEY, process.env.DEPLOY_ACCOUNT_PRIVKEY_1]
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: [process.env.DEPLOY_ACCOUNT_PRIVKEY, process.env.DEPLOY_ACCOUNT_PRIVKEY_1]
    },
    arbitrumOne: {
      url: `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: [process.env.DEPLOY_ACCOUNT_PRIVKEY, process.env.DEPLOY_ACCOUNT_PRIVKEY_1]
    },
    polygon: {
      url: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: [process.env.DEPLOY_ACCOUNT_PRIVKEY, process.env.DEPLOY_ACCOUNT_PRIVKEY_1]
    },
  },
  etherscan: {
    apiKey: {
        mainnet: process.env.ETHERSCAN_API_KEY,
        arbitrumOne: process.env.ARBISCAN_API_KEY,
        polygon: process.env.POLYGONSCAN_API_KEY,
    }
  }
};

