import { ethers } from "hardhat"
import { TradableTokenFactory } from '../typechain/TradableTokenFactory';

const FREE_SUPPLY = ethers.utils.parseEther("0");
const AIRDROP_SUPPLY = ethers.utils.parseEther("100000");

async function main() {
    const [deployerAccount] = await ethers.getSigners();
    console.log("Deploying token with the account:", deployerAccount.address);
    console.log("Account balance:", ethers.utils.formatEther((await deployerAccount.getBalance()).toString()), "ETH");
    if (process.env.DEPLOY_ACCOUNT_PRIVKEY) {
      const tradableToken = await new TradableTokenFactory(deployerAccount).deploy(
      );
      await tradableToken.deployed();
      console.log("Success, deployed at:", tradableToken.address)
    } 
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });