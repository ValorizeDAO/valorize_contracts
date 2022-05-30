import { DeployerFactory } from '../typechain/DeployerFactory';
import { contractByteCode } from '../test/constants/contractBytecodes';
import { ethers } from "hardhat"

async function main() {
    const [deployer] = await ethers.getSigners();
    const Deployer = await new DeployerFactory(deployer)
    const deployerContract = await Deployer.attach("0x633cedeb7c0e9512b7f05d8bf5f37a6953a09545");
    const { simpleToken, timedMintToken, creatorToken } = contractByteCode
    const INITIAL_DEPLOY_PRICE = ethers.utils.parseEther("0.3");
    const txsimple = await deployerContract.setContractByteCode("simple_token_v0.1.0", simpleToken, INITIAL_DEPLOY_PRICE);
    const txtimed = await deployerContract.setContractByteCode("timedMint_token_v0.1.0", timedMintToken, INITIAL_DEPLOY_PRICE);
    const txcreator = await deployerContract.setContractByteCode("creator_token_v0.1.0", creatorToken, INITIAL_DEPLOY_PRICE);
    console.log({ txsimple, txtimed, txcreator });
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });