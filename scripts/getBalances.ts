import { DeployerFactory } from '../typechain/DeployerFactory';
import { ethers } from "hardhat"
import { Deployer } from '../typechain/Deployer';
import { SimpleTokenFactory } from '../typechain/SimpleTokenFactory';
import { BigNumber } from 'ethers';

const FREE_SUPPLY = ethers.utils.parseEther("0");
const AIRDROP_SUPPLY = ethers.utils.parseEther("100000");

async function main() {
    const activeSigners = await ethers.getSigners();
    for(let i=0; i < activeSigners.length; i++){
      console.log("Active accounts:", activeSigners[i].address);
      console.log("Account balance for :", ethers.utils.formatEther((await activeSigners[i].getBalance()).toString()), "\n");
    }
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });