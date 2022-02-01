import { ethers } from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { getAddress } from "@ethersproject/address";
import { ExposedTimedMint } from './../typechain/ExposedTimedMint.d';
import { ExposedTimedMintFactory } from './../typechain/ExposedTimedMintFactory';

chai.use(solidity);

const { expect } = chai;
const SUPPLY_CAP1 = ethers.BigNumber.from("100000") as BigNumber;
const SUPPLY_CAP2 = "0";

describe("TimedMint", () => {
  let exposedTimedMint: ExposedTimedMint,
      deployer: Signer,
      admin1: Signer,
      admin2: Signer,
      vault: Signer,
      addresses: Signer[]

  const setupExposedTimedMint = async () => {
    [deployer, admin1, admin2, vault, ...addresses] = await ethers.getSigners();
    exposedTimedMint = await new ExposedTimedMintFactory(deployer).deploy(
      SUPPLY_CAP1,
      "Simple Token",
      "SIMPL",
    );
    await exposedTimedMint.deployed();
  }

  const setupExposedTimedMintAgain = async () => {
    [deployer, admin1, admin2, vault, ...addresses] = await ethers.getSigners();
    exposedTimedMint = await new ExposedTimedMintFactory(deployer).deploy(
      SUPPLY_CAP2,
      "Simple Token",
      "SIMPL",
    );
    await exposedTimedMint.deployed();
  }
  describe("Deployment", async () => {
    beforeEach(setupExposedTimedMint)

    it("should deploy", async () => {
      expect(exposedTimedMint).to.be.ok;
    })

    it("should set the mintCap", async () => {
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
      const delay = ethers.BigNumber.from("1000");
      const delayTx = await exposedTimedMint.setTimeDelay(delay);
      const mintTime = await exposedTimedMint.setNextMintTime();
      const delayedTUNM = await exposedTimedMint.nextAllowedMintTime();
      await ethers.provider.send("evm_increaseTime", [100000000010])
      await ethers.provider.send("evm_mine", [])
      const currentTUNM = await exposedTimedMint.nextAllowedMintTime();
      expect(delayedTUNM).to.equal(currentTUNM);
    })
  })
  describe("Timed Minting", async () => {
    beforeEach(setupExposedTimedMint)

    it("sets an active time delay", async () => {
      const delay = ethers.BigNumber.from("1000");
      const delayTx = await exposedTimedMint.setTimeDelay(delay);
      const activeDelay = await exposedTimedMint.timeDelayActive();
      expect(activeDelay).to.equal(true);
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

    it("should not allow you to mint when time delay is active and current time is less than time until next mint", async () => {
      const cap = ethers.BigNumber.from("50000");
      const capTx = await exposedTimedMint.setMintCap(cap);
      const delay = ethers.BigNumber.from("1000");
      const delayTx = await exposedTimedMint.setTimeDelay(delay);
      const mintedTokenAmount = ethers.BigNumber.from("1000");
      const contractAddress = await exposedTimedMint.resolvedAddress;
      await expect(exposedTimedMint.mint(contractAddress, mintedTokenAmount)
    ).to.be.revertedWith("ERC20TimedMint: Cannot mint yet");
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
    ).to.be.revertedWith("ERC20TimedMint: Cannot mint yet");
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
    ).to.be.revertedWith("ERC20TimedMint: Mint exceeds maximum amount");
    })
  })

  describe("Set a limited supply cap", async () => {
    beforeEach(setupExposedTimedMint)

    it("should set the supply cap when not zero", async () => {
      expect(await exposedTimedMint.supplyCap()).to.equal(SUPPLY_CAP1);
    })

    it("should mint when the supply cap is not zero", async () => {
      const amt = ethers.BigNumber.from("1000");
      const contractAddress = await exposedTimedMint.resolvedAddress;
      const newMint = expect(await exposedTimedMint.mint(contractAddress, amt));
      const contractBalance = await exposedTimedMint.balanceOf(contractAddress);
      expect(amt).to.equal(contractBalance);
    })

    it("should not mint when the amount exceeds the supply cap", async () => {
      const amt = ethers.BigNumber.from("1000000000");
      const contractAddress = await exposedTimedMint.resolvedAddress;
      await expect(exposedTimedMint.mint(contractAddress, amt)).to.be.revertedWith("ERC20TimedMint: cap exceeded");
    })
  })

  describe("Set an unlimited supply cap", async () => {
    beforeEach(setupExposedTimedMintAgain)

    it("should deploy with unlimited supply", async () => {
      const capUnlimited = ethers.BigNumber.from("115792089237316195423570985008687907853269984665640564039457584007913129639935");
      expect(await exposedTimedMint.supplyCap()).to.equal(capUnlimited);
    })

    it("should always mint when the supply is unlimited", async () => {
      const highAmt = ethers.BigNumber.from("1000000000000000000000000000000000000000000");
      const contractAddress = await exposedTimedMint.resolvedAddress;
      const newMint = expect(await exposedTimedMint.mint(contractAddress, highAmt));
      const contractBalance = await exposedTimedMint.balanceOf(contractAddress);
      expect(highAmt).to.equal(contractBalance);
    })


  })
})
