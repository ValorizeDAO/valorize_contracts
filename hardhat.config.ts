import "@nomiclabs/hardhat-waffle";
import { task } from "hardhat/config";
import "hardhat-typechain";
import { ethers } from "hardhat";
require('dotenv').config()

//enter RPC url here
const PROVIDER_URL = process.env.PROVIDER_URL;
//enter impersonating account here
const myAccount = process.env.ACCOUNT;

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    const accountBalance = await account.getBalance()
    console.log(account.address, "balance:", hre.ethers.utils.formatEther(accountBalance));
  }
});

task("unlock", "set up impersonating accounts", async (taskArgs, hre) => {
  console.log(PROVIDER_URL)
  //method to unlock the accounts
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [myAccount],
  });
  console.log("impersonating account: " + myAccount);
})

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
export default {
  solidity: "0.8.6",
  networks: {
    ropsten: {
        url: `${PROVIDER_URL}`,
      },
  },
};