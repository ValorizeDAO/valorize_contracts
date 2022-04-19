import { contractByteCode } from './constants/contractBytecodes';
import { Deployer } from './../typechain/Deployer.d';
import { DeployerFactory } from './../typechain/DeployerFactory';
import { ethers } from "hardhat"
import { BigNumber, Contract, Signer } from "ethers";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { getAddress } from "@ethersproject/address";

chai.use(solidity);

const { expect } = chai;
const INITIAL_DEPLOY_PRICE = BigNumber.from("1000000000000000000");
const bytecodeForSimpleMintToken = 

describe.only("Deployer", () => {
  let deployerContract: Deployer,
    deployerAddress: Signer,
    admin: Signer,
    addresses: Signer[];

  const setupDeployer = async () => {
    [deployerAddress, admin, ...addresses] = await ethers.getSigners();
    deployerContract = await new DeployerFactory(deployerAddress).deploy(
      INITIAL_DEPLOY_PRICE,
      await admin.getAddress(),
    );
    await deployerContract.deployed();
  };

  describe("Deployment", async () => {
    beforeEach(setupDeployer)

    it("should deploy", async () => {
      expect(deployerAddress).to.be.ok;
    });
  })
  describe("Setting Contract Type", async () => {
    beforeEach(setupDeployer)
    it("should deploy", async () => {
      const expectedBytecode = ethers.utils.defaultAbiCoder.encode([ "string" ], contractByteCode.simpleToken);
      await deployerContract.setContractByteCode("test_contract_1", expectedBytecode);
      const givenBytecode = await deployerContract.getContractByteCode("test_contract_1");
      console.log(givenBytecode)
    });
  })
})
