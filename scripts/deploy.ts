import { DeployerFactory } from '../typechain/DeployerFactory';
import { ethers } from "hardhat"
import { Deployer } from '../typechain/Deployer';

async function main() {
    const [deployerAccount] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployerAccount.address);
    console.log("Account balance:", ethers.utils.formatEther((await deployerAccount.getBalance()).toString()), "ETH");
    if (process.env.DEPLOYER_CONTRACT_ADMIN_ADDRESS) {
      const deployerContract = await new DeployerFactory(deployerAccount).deploy(
        process.env.DEPLOYER_CONTRACT_ADMIN_ADDRESS,
      );
      console.log(deployerContract);
      await deployerContract.deployed();
    } 
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });