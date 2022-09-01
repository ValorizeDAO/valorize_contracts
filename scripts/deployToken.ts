import { DeployerFactory } from '../typechain/DeployerFactory';
import { ethers } from "hardhat"
import { Deployer } from '../typechain/Deployer';
import { SimpleTokenFactory } from '../typechain/SimpleTokenFactory';
import { BigNumber } from 'ethers';

const FREE_SUPPLY = ethers.utils.parseEther("0");
const AIRDROP_SUPPLY = ethers.utils.parseEther("100000");

async function main() {
    const [,deployerAccount] = await ethers.getSigners();
    console.log("Deploying token with the account:", deployerAccount.address);
    console.log("Account balance:", ethers.utils.formatEther((await deployerAccount.getBalance()).toString()), "ETH");
    if (process.env.DEPLOY_ACCOUNT_PRIVKEY) {
      const simpleToken = await new SimpleTokenFactory(deployerAccount).deploy(
        FREE_SUPPLY,
        AIRDROP_SUPPLY,
        "0x43402200629A8Ea23F0A8B7eC9E0587fAdc9616b",
        "Transitional $VALOR Token",
        "$tVALOR",
        ["0x43402200629A8Ea23F0A8B7eC9E0587fAdc9616b"]
      );
      await simpleToken.deployed();
      console.log("Success, deployed at:", simpleToken.address)
    } 
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });