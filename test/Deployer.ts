import { contractByteCode } from './constants/contractBytecodes';
import { Deployer } from './../typechain/Deployer.d';
import { DeployerFactory } from './../typechain/DeployerFactory';
import { ethers } from "hardhat"
import { BigNumber, Contract, Signer } from "ethers";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { getAddress } from "@ethersproject/address";
import { SimpleTokenFactory } from "../typechain/SimpleTokenFactory"

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
    it("should allow admin to upload the contract bytecode", async () => {
      const data = contractByteCode.simpleToken
      await deployerContract.connect(admin).setContractByteCode("simple_token_v0.1.0", data);
      const givenBytecode = await deployerContract.connect(admin).getContractByteCode("simple_token_v0.1.0");
      expect(data).to.equal(givenBytecode.bytecode)
    });
    it("should reject non admins to upload the contract bytecode", async () => {
      const data = contractByteCode.simpleToken
      const address = await (await addresses[0].getAddress()).toLowerCase()
      await expect(
        deployerContract.connect(addresses[0]).setContractByteCode("test_contract_1", data)
      ).to.be.revertedWith("AccessControl: account " + address + " is missing role 0x0000000000000000000000000000000000000000000000000000000000000000");
    });
  })
  describe("Deployment", async () => {
    beforeEach(async () => {
      await setupDeployer()
      const data = contractByteCode.simpleToken
      await deployerContract.connect(admin).setContractByteCode("simple_token_v0.1.0", data);
    })
    it("should require payment to deploy the contract bytecode", async () => {
      const data = contractByteCode.simpleToken
      await deployerContract.connect(admin).setContractByteCode("simple_token_v0.1.0", data);
      const padded = ethers.utils.hexZeroPad([0], 32)
      await expect(
        deployerContract.deploySimpleTokenContract(
          "simple_token_v0.1.0", 
          padded, 
          BigNumber.from("1000000000000000000000000"),
          BigNumber.from("1000000000000000000000000"),
          await deployerAddress.getAddress(),
          "test",
          "TST",
          [await addresses[0].getAddress()]
        )
      ).to.be.revertedWith("Insufficient payment to deploy")
      const tx = await deployerContract.deploySimpleTokenContract(
          "simple_token_v0.1.0", 
          padded, 
          BigNumber.from("1000000000000000000000000"),
          BigNumber.from("1000000000000000000000000"),
          await deployerAddress.getAddress(),
          "test",
          "TST",
          [await addresses[0].getAddress()],
          { value: INITIAL_DEPLOY_PRICE }
       )
      expect(tx.confirmations).to.equal(1)
    })
    it("should deploy a simple token if the bytecode uploaded is correct", async () =>{
      const tx = await deployerContract.connect(await addresses[0]).deploySimpleTokenContract(
        "simple_token_v0.1.0", 
        ethers.utils.hexZeroPad([0], 32), 
        BigNumber.from("1000000000000000000000000"),
        BigNumber.from("1000000000000000000000000"),
        await deployerAddress.getAddress(),
        "test",
        "TST",
        [await addresses[0].getAddress()],
        { value: INITIAL_DEPLOY_PRICE }
     )
      const tx2 = await deployerContract.connect(await addresses[0]).deploySimpleTokenContract(
        "simple_token_v0.1.0", 
        ethers.utils.hexZeroPad([0], 32), 
        BigNumber.from("1000000000000000000000000"),
        BigNumber.from("1000000000000000000000000"),
        await deployerAddress.getAddress(),
        "test",
        "TST",
        [await addresses[0].getAddress()],
        { value: INITIAL_DEPLOY_PRICE }
      )
      const deployed = await deployerContract.getDeployed(await addresses[0].getAddress())
      const simpleToken = SimpleTokenFactory.connect(deployed[0].deploymentAddress, addresses[0])
      expect(await simpleToken.name()).to.equal("test")
      expect(await simpleToken.symbol()).to.equal("TST")
      expect(await simpleToken.totalSupply()).to.equal(BigNumber.from("2000000000000000000000000"))
    })
    it("should revert if no contract bytecode exist given a name", async () =>{
      await expect(
        deployerContract.deploySimpleTokenContract(
          "simple_token_v2.1.0", 
          ethers.utils.hexZeroPad([0], 32), 
          BigNumber.from("1000000000000000000000000"),
          BigNumber.from("1000000000000000000000000"),
          await deployerAddress.getAddress(),
          "test",
          "TST",
          [await addresses[0].getAddress()],
          { value: INITIAL_DEPLOY_PRICE }
        )
      ).to.be.revertedWith("Incorrect contract name")
    })
  })
})
