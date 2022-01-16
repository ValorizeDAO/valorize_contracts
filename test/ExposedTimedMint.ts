import { ethers } from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { getAddress } from "@ethersproject/address";
import { ExposedTimedMint } from './../typechain/ExposedTimedMint.d';
import { ExposedTimedMintFactory } from './../typechain/ExposedTimedMintFactory';

chai.use(solidity);

const { expect } = chai;

describe("ExposedTimedMint", () => {
  let exposedTimedMint: ExposedTimedMint,
      deployer: Signer,
      admin1: Signer,
      admin2: Signer,
      vault: Signer,
      addresses: Signer[]

  const setupExposedTimedMint = async () => {
    [deployer, admin1, admin2, vault, ...addresses] = await ethers.getSigners();
    exposedTimedMint = await new ExposedTimedMintFactory(deployer).deploy(
      //await vault.getAddress(),
      "Simple Token",
      "SIMPL",
      //[await admin1.getAddress(), await admin2.getAddress()]
    );
    await exposedTimedMint.deployed();
  }

  describe("Deployment", function () {
    beforeEach(setupExposedTimedMint)

    it("should deploy", async () => {
      expect(exposedTimedMint).to.be.ok;
    })

    it("should set the mintCap", async function() {
      const cap = ethers.BigNumber.from("50000");
      const capTx = await exposedTimedMint.setMintCap(cap);
      const actualMintCap = await exposedTimedMint.mintCap();
      expect(actualMintCap).to.equal(cap);
    })

    it("should set the time delay", async () => {
      const delay = ethers.BigNumber.from("1000");
      const delayTx = await exposedTimedMint.setTimeDelay(delay);
      var actualDelay = await exposedTimedMint.timeDelay();
      expect(actualDelay).to.equal(delay);
    })

    it("should set the time until next mint", async () => {
      const noDelay = ethers.BigNumber.from("2");
      const noDelayTx = await exposedTimedMint.setTimeDelay(noDelay);
      const noDelayMintTime = await exposedTimedMint.setNextMintTime();
      const noDelayTUNM = await exposedTimedMint.timeUntilNextMint();
      const delay = ethers.BigNumber.from("1000");
      //default provider / robsten provider
      const delayTx = await exposedTimedMint.setTimeDelay(delay);
      const mintTime = await exposedTimedMint.setNextMintTime();
      const delayedTUNM = await exposedTimedMint.timeUntilNextMint();
      expect(delayedTUNM.toString()).to.equal(noDelayTUNM.add(delay).toString());
      //to equal mintTime.toString() returns the value of actualTUNM and object Object
    })
  })
  describe("Timed Minting", () => {
    beforeEach(setupExposedTimedMint)

    it("sets an active time delay", async () => {
      const delay = ethers.BigNumber.from("1000");
      const delayTx = await exposedTimedMint.setTimeDelay(delay);
      const activeDelay = await exposedTimedMint.timeDelayActive();
      expect(activeDelay).to.equal(true);
      //if Delay is set to 0 timeDelayActive returns true :(
      //if Delay is not set then timeDelayActive returns false
      //Capital letter only if prototype
    })

    it("should allow you to mint when time delay is not active", async () => {
      const cap = ethers.BigNumber.from("50000");
      const capTx = await exposedTimedMint.setMintCap(cap);
      const mintedTokenAmount = ethers.BigNumber.from("1000");
      const contractAddress = await exposedTimedMint.resolvedAddress;
      const newMint = await exposedTimedMint.mint(contractAddress, mintedTokenAmount);
      const contractBalance = await exposedTimedMint.balanceOf(contractAddress);
      expect(mintedTokenAmount).to.equal(contractBalance);
    })
//question: how to test internal state variables?
    it("should not allow you to mint when time delay is active and current time is less than time until next mint", async () => {
      const cap = ethers.BigNumber.from("50000");
      const capTx = await exposedTimedMint.setMintCap(cap);
      const delay = ethers.BigNumber.from("1000");
      const delayTx = await exposedTimedMint.setTimeDelay(delay);
      const mintedTokenAmount = ethers.BigNumber.from("1000");
      const contractAddress = await exposedTimedMint.resolvedAddress;
      await expect(exposedTimedMint.mint(contractAddress, mintedTokenAmount)
    ).to.be.revertedWith("ERC20: Cannot mint yet");
    })

    it("should allow you to mint if current time is more than time until next mint", async () => {
      const cap = ethers.BigNumber.from("50000");
      const capTx = await exposedTimedMint.setMintCap(cap);
      const delay = ethers.BigNumber.from("1000");
      const delayTx = await exposedTimedMint.setTimeDelay(delay);
      const mintedTokenAmount = ethers.BigNumber.from("20000");
      const contractAddress = await exposedTimedMint.resolvedAddress;
      await ethers.provider.send("evm_increaseTime", [100000000010])
      await ethers.provider.send("evm_mine", [])
      const newMint = await exposedTimedMint.mint(contractAddress, mintedTokenAmount);
      const contractBalance = await exposedTimedMint.balanceOf(contractAddress);
      expect(mintedTokenAmount).to.equal(contractBalance);
    })

    it("should not allow you to mint if current time is less than time until next mint", async () => {
      const cap = ethers.BigNumber.from("50000");
      const capTx = await exposedTimedMint.setMintCap(cap);
      const delay = ethers.BigNumber.from("1000");
      const delayTx = await exposedTimedMint.setTimeDelay(delay);
      const mintedTokenAmount = ethers.BigNumber.from("10000");
      const contractAddress = await exposedTimedMint.resolvedAddress;
      await expect(exposedTimedMint.mint(contractAddress, mintedTokenAmount)
    ).to.be.revertedWith("ERC20: Cannot mint yet");
    })

    it("should not allow you to mint if mint cap is lower than amount of minted tokens", async () => {
      const cap = ethers.BigNumber.from("5000");
      const capTx = await exposedTimedMint.setMintCap(cap);
      const delay = ethers.BigNumber.from("1000");
      const delayTx = await exposedTimedMint.setTimeDelay(delay);
      const mintedTokenAmount = ethers.BigNumber.from("10000");
      const contractAddress = await exposedTimedMint.resolvedAddress;
      await ethers.provider.send("evm_increaseTime", [100000000010])
      await ethers.provider.send("evm_mine", [])
      await expect(exposedTimedMint.mint(contractAddress, mintedTokenAmount)
    ).to.be.revertedWith("ERC20: Mint exceeds maximum amount");
    })
  })
})