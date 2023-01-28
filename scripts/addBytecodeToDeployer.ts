import { DeployerFactory } from '../typechain/DeployerFactory';
import { contractByteCode } from '../test/constants/contractBytecodes';
import { ethers } from "hardhat"

async function main() {
    const [, admin] = await ethers.getSigners();
    const Deployer = await new DeployerFactory(admin)
    console.log("Deploying contracts with the account:", admin.address);
    console.log("Account balance:", ethers.utils.formatEther((await admin.getBalance()).toString()), "ETH");
    const deployerContract = await Deployer.attach("0x2ff54204b36655D34cB8bD6EE008C43C4BC9373f");
    const { simpleToken, timedMintToken, creatorToken } = contractByteCode
    const INITIAL_DEPLOY_PRICE = ethers.utils.parseEther("0.3");
    const txsimple = await deployerContract.connect(admin)
      .setContractByteCode("simple_token_v0.1.0", simpleToken, INITIAL_DEPLOY_PRICE);
    const txtimed = await deployerContract.connect(admin)
      .setContractByteCode("timedMint_token_v0.1.0", timedMintToken, INITIAL_DEPLOY_PRICE);
    const txcreator = await deployerContract.connect(admin)
      .setContractByteCode("creator_token_v0.1.0", creatorToken, INITIAL_DEPLOY_PRICE);
    console.log({ txsimple, txtimed, txcreator });
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });