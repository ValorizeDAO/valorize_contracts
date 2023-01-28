import { ethers } from "hardhat"
import { ExperienceTokenFactory } from '../typechain/ExperienceTokenFactory';

const FREE_SUPPLY = ethers.utils.parseEther("0");
const AIRDROP_SUPPLY = ethers.utils.parseEther("100000");

async function main() {
    const [deployerAccount] = await ethers.getSigners();
    console.log("Deploying token with the account:", deployerAccount.address);
    console.log("Account balance:", ethers.utils.formatEther((await deployerAccount.getBalance()).toString()), "ETH");
    if (process.env.DEPLOY_ACCOUNT_PRIVKEY) {
      const experienceToken = await new ExperienceTokenFactory(deployerAccount).deploy(
      );
      await experienceToken.deployed();
      console.log("Success, deployed at:", experienceToken.address)
    } 
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });