import { ethers } from "hardhat";
import { BigNumber as BN, Contract, Signer } from "ethers";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { getAddress } from "@ethersproject/address";
import { TimedMintToken } from '../typechain/TimedMintToken.d';
import { TimedMintTokenFactory } from '../typechain/TimedMintTokenFactory';

chai.use(solidity);

const { expect } = chai;
const AMOUNT_FOR_VAULT = BN.from("4000000000000000000000000") 
const AMOUNT_FOR_AIRDROP = BN.from("1000000000000000000000000") 
const TOTAL_INITIAL_SUPPLY = AMOUNT_FOR_VAULT.add(AMOUNT_FOR_AIRDROP)

describe("Timed Mint Token", () => {
  let timedMintToken: TimedMintToken,
      deployer: Signer,
      admin1: Signer,
      admin2: Signer,
      vault: Signer,
      minter: Signer,
      addresses: Signer[],
      mintCap: BN,
      timeDelay: BN

  const setupTimedMint = async () => {
    [deployer, admin1, admin2, vault, minter, ...addresses] = await ethers.getSigners();
    const vaultAddress = await vault.getAddress()
    mintCap = BN.from("50000000000000000000000"),
    timeDelay = BN.from("31536000")
    timedMintToken =  await new TimedMintTokenFactory(deployer).deploy(
        AMOUNT_FOR_VAULT,
        AMOUNT_FOR_AIRDROP,
        vaultAddress,
        timeDelay,
        mintCap,
        "TimedMintToken",
        "TIME",
        [await admin1.getAddress(), await admin2.getAddress()]
    );
    await timedMintToken.deployed();
    await timedMintToken
      .connect(admin1)
      .setMinterAddress(await minter.getAddress())
  }

  describe("Inherit Timed Mint", function () {
    beforeEach(setupTimedMint)
    describe("Deployment", function () {
      beforeEach(setupTimedMint)

      it("should deploy", async () => {
        expect(timedMintToken).to.be.ok;
      })

      it("should set the mintCap", async function() {
        const actualMintCap = await timedMintToken.mintCap();
        expect(actualMintCap).to.equal(mintCap);
      })

      it("should set the time delay", async () => {
        var actualDelay = await timedMintToken.timeDelay();
        expect(actualDelay).to.equal(timeDelay);
      })

      it("should set the time until next mint", async () => {
        const delay = ethers.BigNumber.from("1000");
        const delayedTUNM = await timedMintToken.timeUntilNextMint();
        await ethers.provider.send("evm_increaseTime", [100000000010])
        await ethers.provider.send("evm_mine", [])
        const currentTUNM = await timedMintToken.timeUntilNextMint();
        expect(delayedTUNM).to.equal(currentTUNM);
      })

      it("should sets an active time delay on constructor", async () => {
        const timeDelayIsActive = await timedMintToken.timeDelayActive();
        expect(timeDelayIsActive).to.equal(true);
      })

    })
    describe("Timed Minting", () => {
      beforeEach(setupTimedMint)

      it("should not allow you to mint when time delay is active and current time is less than time until next mint", async () => {
        const cap = ethers.BigNumber.from("50000");
        const delay = ethers.BigNumber.from("1000");
        const mintedTokenAmount = ethers.BigNumber.from("1000");
        const contractAddress = await timedMintToken.resolvedAddress;
        await expect(timedMintToken.connect(minter).mint(mintedTokenAmount)
      ).to.be.revertedWith("ERC20: Cannot mint yet");
      })

      it("should allow you to mint if current time is more than time until next mint", async () => {
        const amountToMint = ethers.BigNumber.from("20000");
        const contractAddress = await timedMintToken.resolvedAddress;
        await ethers.provider.send("evm_increaseTime", [31536001])
        await ethers.provider.send("evm_mine", [])
        const newMint = await timedMintToken.connect(minter).mint(amountToMint);
        const totalSupply = await timedMintToken.totalSupply();
        expect(
          amountToMint.add(TOTAL_INITIAL_SUPPLY)
        ).to.equal(totalSupply);
      })

      it("should not allow you to mint if current time is less than time until next mint", async () => {
        const mintedTokenAmount = ethers.BigNumber.from("10000");
        const contractAddress = await timedMintToken.resolvedAddress;
        await expect(timedMintToken.connect(minter).mint(mintedTokenAmount)
      ).to.be.revertedWith("ERC20: Cannot mint yet");
      })

      it("should not allow you to mint if attempting to mint higher than mint cap", async () => {
        const contractAddress = await timedMintToken.resolvedAddress;
        await ethers.provider.send("evm_increaseTime", [100000000010])
        await ethers.provider.send("evm_mine", [])
        await expect(
          timedMintToken.connect(minter).mint(mintCap.add(BN.from("3000000")))
        ).to.be.revertedWith("ERC20: Mint exceeds maximum amount");
      })
    })
  })
})
