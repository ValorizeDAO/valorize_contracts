import { contractByteCode } from './constants/contractBytecodes';
import { Deployer } from './../typechain/Deployer.d';
import { DeployerFactory } from './../typechain/DeployerFactory';
import { ethers } from "hardhat"
import { BigNumber, Contract, Signer } from "ethers";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { SimpleTokenFactory } from "../typechain/SimpleTokenFactory"
import { TimedMintTokenFactory } from '../typechain/TimedMintTokenFactory';
import { randomBytes } from 'ethers/lib/utils';

chai.use(solidity);

const { expect } = chai;
const INITIAL_DEPLOY_PRICE = BigNumber.from("1000000000000000000");
describe("Deployer", () => {
  let deployerContract: Deployer,
    deployerAddress: Signer,
    admin: Signer,
    addresses: Signer[];

  const setupDeployer = async () => {
    [deployerAddress, admin, ...addresses] = await ethers.getSigners();
    deployerContract = await new DeployerFactory(deployerAddress).deploy(
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
      await deployerContract.connect(admin).setContractByteCode("simple_token_v0.1.0", data, INITIAL_DEPLOY_PRICE);
      const { success, contractParams } = await deployerContract.connect(admin).getContractByteCodeHash("simple_token_v0.1.0");
      expect(ethers.utils.solidityKeccak256(["bytes"], [data])).to.equal(contractParams.byteCodeHash)
    });
    it("should reject non admins to upload the contract bytecode", async () => {
      const data = contractByteCode.simpleToken
      const address = await (await addresses[0].getAddress()).toLowerCase()
      await expect(
        deployerContract.connect(addresses[0]).setContractByteCode("test_contract_1", data, INITIAL_DEPLOY_PRICE)
      ).to.be.revertedWith("AccessControl: account " + address + " is missing role 0x0000000000000000000000000000000000000000000000000000000000000000");
    });
    it("should fail if admin tries to create a contract with an existing name", async () => {
      const data = contractByteCode.simpleToken
      await deployerContract.connect(admin).setContractByteCode("simple_token_v0.1.0", data, INITIAL_DEPLOY_PRICE);
      await expect(
        deployerContract.connect(admin).setContractByteCode("simple_token_v0.1.0", data, INITIAL_DEPLOY_PRICE)
      ).to.be.revertedWith("Contract already deployed");
    })
    it("should emit a 'ByteCodeUploaded' event when a new contract is uploaded", async () => {
      const data = contractByteCode.simpleToken
      await expect(deployerContract.connect(admin).setContractByteCode("simple_token_v0.1.0", data, INITIAL_DEPLOY_PRICE))
        .to.emit(deployerContract, "ByteCodeUploaded")
        .withArgs(
          "simple_token_v0.1.0",
          INITIAL_DEPLOY_PRICE,
          ethers.utils.solidityKeccak256(["bytes"], [data]),
        );
    })
  })
  describe("Factory", async () => {
    let simpleTokenParams: string;
    beforeEach(async () => {
      await setupDeployer()
      await deployerContract.connect(admin).setContractByteCode("simple_token_v0.1.0", contractByteCode.simpleToken, INITIAL_DEPLOY_PRICE);
      await deployerContract.connect(admin).setContractByteCode("timedMint_token_v0.1.0", contractByteCode.timedMintToken, INITIAL_DEPLOY_PRICE);
      const encoder =  new ethers.utils.AbiCoder()
      simpleTokenParams = encoder.encode(
        [ "uint", "uint", "address", "string", "string", "address[]" ],
        [
          BigNumber.from("1000000000000000000000000"),
          BigNumber.from("1000000000000000000000000"),
          await deployerAddress.getAddress(),
          "test",
          "TST",
          [await addresses[0].getAddress()]
        ]);
    })
    it("should require payment to deploy the contract bytecode", async () => {
      await expect(
        deployerContract.deployContract(
          "simple_token_v0.1.0", 
          contractByteCode.simpleToken,
          simpleTokenParams,
          ethers.utils.hexZeroPad(randomBytes(32), 32), 
          { value: INITIAL_DEPLOY_PRICE.sub(BigNumber.from("1")) }
        )
      ).to.be.revertedWith("Insufficient payment to deploy")
      const tx = await deployerContract.deployContract(
        "simple_token_v0.1.0", 
        contractByteCode.simpleToken,
        simpleTokenParams,
        ethers.utils.hexZeroPad(randomBytes(32), 32), 
        { value: INITIAL_DEPLOY_PRICE }
       )
      expect(tx.confirmations).to.equal(1)
    })
    it("should deploy a simple token if the bytecode uploaded is correct", async () =>{
      await deployerContract.connect(admin).grantRole(ethers.utils.hexZeroPad("0x0", 32), await addresses[5].getAddress())
      await deployerContract.connect(await addresses[5]).deployContract(
        "simple_token_v0.1.0", 
        contractByteCode.simpleToken,
        simpleTokenParams,
        ethers.utils.hexZeroPad(randomBytes(32), 32), 
        { value: INITIAL_DEPLOY_PRICE }
      )
      const deployed = await deployerContract.getDeployed(await addresses[5].getAddress())
      const simpleToken = SimpleTokenFactory.connect(deployed[0].deploymentAddress, addresses[0])
      expect(await simpleToken.name()).to.equal("test")
      expect(await simpleToken.symbol()).to.equal("TST")
      expect(await simpleToken.totalSupply()).to.equal(BigNumber.from("2000000000000000000000000"))
    })
    it("should deploy a timed mint token if the bytecode uploaded is correct", async () =>{
      const encoder =  new ethers.utils.AbiCoder()
      const timedMintTokenParams = encoder.encode(
        [ "uint", "uint", "uint", "address", "uint", "uint", "string", "string", "address[]" ],
        [
          BigNumber.from("1000000000000000000000000"),
          BigNumber.from("1000000000000000000000000"),
          BigNumber.from("2000000000000000000000000"),
          await deployerAddress.getAddress(),
          BigNumber.from("10000000"),
          BigNumber.from("1000000000000000000000000"),
          "test",
          "TST",
          [await addresses[0].getAddress()]
        ]);
      await deployerContract.connect(await addresses[0]).deployContract(
        "timedMint_token_v0.1.0",
        contractByteCode.timedMintToken,
        timedMintTokenParams,
        ethers.utils.hexZeroPad(randomBytes(32), 32),
        { value: INITIAL_DEPLOY_PRICE }
      )
      const deployed = await deployerContract.getDeployed(await addresses[0].getAddress())
      const timedMintToken = TimedMintTokenFactory.connect(deployed[0].deploymentAddress, addresses[0])
      expect(await timedMintToken.name()).to.equal("test")
      expect(await timedMintToken.minter()).to.equal("0x0000000000000000000000000000000000000000")
    })
    it("should revert if no contract bytecode exist given a name", async () =>{
      await expect(
        deployerContract.deployContract(
          "simple_token_v2.1.0", 
          contractByteCode.simpleToken,
          simpleTokenParams,
          ethers.utils.hexZeroPad(randomBytes(32), 32), 
          { value: INITIAL_DEPLOY_PRICE }
        )
      ).to.be.revertedWith("Contract is unregistered or discontinued")
    })
    it("should revert if the contract bytecode is incorrect", async () =>{
      await expect(
        deployerContract.deployContract(
          "simple_token_v0.1.0", 
          contractByteCode.simpleToken + "10",
          simpleTokenParams,
          ethers.utils.hexZeroPad(randomBytes(32), 32), 
          { value: INITIAL_DEPLOY_PRICE }
        )
      ).to.be.revertedWith("Contract is unregistered or discontinued")
    })
    it("should deploy a contract to a deterministic address", async () =>{
      const creatorAddress:string = deployerContract.address
      const salt = ethers.utils.hexZeroPad(randomBytes(32), 32)
      const contractAddress = computeCreate2Address(
        creatorAddress,
        salt,
        contractByteCode.simpleToken,
        simpleTokenParams
      )
      
      await deployerContract.connect(addresses[3]).deployContract(
        "simple_token_v0.1.0",
        contractByteCode.simpleToken,
        simpleTokenParams,
        salt,
        { value: INITIAL_DEPLOY_PRICE }
      )
      const deployed = await deployerContract.getDeployed(await addresses[3].getAddress())
      await expect(deployed[0].deploymentAddress.toLowerCase()).to.equal(contractAddress)
    })
    it("should emit a 'ContractDeployed' event when a contract is deployed", async () => {
      const salt = ethers.utils.hexZeroPad("0x1", 32)
      const contractAddress = computeCreate2Address(
        deployerContract.address,
        salt,
        contractByteCode.simpleToken,
        simpleTokenParams
      )
      await expect(deployerContract.connect(addresses[3]).deployContract(
        "simple_token_v0.1.0",
        contractByteCode.simpleToken,
        simpleTokenParams,
        ethers.utils.hexZeroPad("0x1", 32),
        { value: INITIAL_DEPLOY_PRICE }
      ))
      .to.emit(deployerContract, "ContractDeployed")
    })
  })
  describe("Update Contracts", () => {
    let simpleTokenParams: string;
    beforeEach(async () => {
      await setupDeployer()
      await deployerContract.connect(admin).setContractByteCode("simple_token_v0.1.0", contractByteCode.simpleToken, INITIAL_DEPLOY_PRICE);
      await deployerContract.connect(admin).setContractByteCode("timedMint_token_v0.1.0", contractByteCode.timedMintToken, INITIAL_DEPLOY_PRICE);
      const encoder =  new ethers.utils.AbiCoder()
      simpleTokenParams = encoder.encode(
        [ "uint", "uint", "address", "string", "string", "address[]" ],
        [
          BigNumber.from("1000000000000000000000000"),
          BigNumber.from("1000000000000000000000000"),
          await deployerAddress.getAddress(),
          "test",
          "TST",
          [await addresses[0].getAddress()]
        ]);
    })
    it("should not allow user to update if the contract is not deployed", async () => {
      await expect(deployerContract.connect(admin).updateContractPrice(
        "simple_token_v2.1.0",
        BigNumber.from("100000000000000000000000000000"),
      )).to.be.revertedWith("Contract not registered")
    })
    it("should allow an admin to update the price of a contract", async () => {
      await deployerContract.connect(admin).deployContract(
        "simple_token_v0.1.0",
        contractByteCode.simpleToken,
        simpleTokenParams,
        ethers.utils.hexZeroPad(randomBytes(32), 32),
        { value: INITIAL_DEPLOY_PRICE }
      )
      await deployerContract.connect(admin).updateContractPrice(
        "simple_token_v0.1.0",
        INITIAL_DEPLOY_PRICE.add(BigNumber.from("1")),
      )
      await expect(
        deployerContract.deployContract(
          "simple_token_v0.1.0", 
          contractByteCode.simpleToken,
          simpleTokenParams,
          ethers.utils.hexZeroPad(randomBytes(32), 32), 
          { value: INITIAL_DEPLOY_PRICE }
        )
      ).to.be.revertedWith("Insufficient payment to deploy")
    })
    it("should deny non admin to update the price of a contract", async () => {
      await expect(
        deployerContract.connect(addresses[0]).updateContractPrice(
          "simple_token_v0.1.0",
          INITIAL_DEPLOY_PRICE.add(BigNumber.from("1")),
        )
      ).to.be.revertedWith("AccessControl: account " 
        + (await addresses[0].getAddress()).toLowerCase()
        + " is missing role 0x0000000000000000000000000000000000000000000000000000000000000000");
    })
    it("should emit a 'PriceUpdated' event when a contract price is updated", async () => {
      await expect(
        deployerContract.connect(admin).updateContractPrice(
          "simple_token_v0.1.0",
          INITIAL_DEPLOY_PRICE.add(BigNumber.from("1")),
        )
      ).to.emit(deployerContract, "PriceUpdated")
      .withArgs("simple_token_v0.1.0", INITIAL_DEPLOY_PRICE.add(BigNumber.from("1")))
    })
    it("should allow admin to make a contract undeployable in case a vulnerability is found", async () => { //in case a vulnerability is found
      const tx = await deployerContract.deployContract(
        "simple_token_v0.1.0", 
        contractByteCode.simpleToken,
        simpleTokenParams,
        ethers.utils.hexZeroPad(randomBytes(32), 32), 
        { value: INITIAL_DEPLOY_PRICE }
       )
      expect(tx.confirmations).to.equal(1)

      await deployerContract.connect(admin).discontinueContract("simple_token_v0.1.0");

      await expect(
        deployerContract.connect(admin).deployContract(
          "simple_token_v0.1.0",
          contractByteCode.simpleToken,
          simpleTokenParams,
          ethers.utils.hexZeroPad(randomBytes(32), 32),
          { value: INITIAL_DEPLOY_PRICE }
        )
      ).to.be.revertedWith("Contract is unregistered or discontinued");
    })
    it("should emit an event when a contract is made undeployable", async () => {
      await deployerContract.deployContract(
        "simple_token_v0.1.0", 
        contractByteCode.simpleToken,
        simpleTokenParams,
        ethers.utils.hexZeroPad(randomBytes(32), 32), 
        { value: INITIAL_DEPLOY_PRICE }
       )
      await expect(
        deployerContract.connect(admin).discontinueContract("simple_token_v0.1.0")
      ).to.emit(deployerContract, "ContractDiscontinued")
      .withArgs("simple_token_v0.1.0")
    })
  })
})
function computeCreate2Address(creatorAddress: string, saltHex: string, byteCode: string, paramsHexString: string): string {
  const byteCodeHash = ethers.utils.solidityKeccak256([ "bytes", "bytes" ], [ byteCode, paramsHexString ])
  const hexString = [
    "ff", creatorAddress, saltHex, byteCodeHash
  ].map(x => { return x.replace(/0x/, "") }).join("")
  return `0x${ethers.utils.solidityKeccak256([ "bytes" ], [ "0x" + hexString ])
    .slice(-40)}`;
}