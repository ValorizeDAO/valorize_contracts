import { DeployerFactory } from '../typechain/DeployerFactory';
import { ethers } from "hardhat"

async function main() {
    const [deployerAccount] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployerAccount.address);
    console.log("Account balance:", ethers.utils.formatEther((await deployerAccount.getBalance()).toString()), "ETH");
 
    const deployerContract = await new DeployerFactory(deployerAccount).deploy(
      "0x8a839d8F03433FC6EF7D385a822461d1FAB2566e"
    );
    console.log(deployerContract);
    await deployerContract.deployed();
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });