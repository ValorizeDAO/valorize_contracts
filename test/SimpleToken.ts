import { ethers } from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { getAddress } from "@ethersproject/address";
import { SimpleToken } from './../typechain/SimpleToken.d';
import { SimpleTokenFactory } from './../typechain/SimpleTokenFactory';

chai.use(solidity);
const { expect } = chai;
const ONE_TOKEN = ethers.BigNumber.from("1000000000000000000") as BigNumber;
const TEN_MILLION_TOKENS = ethers.BigNumber.from("100000000000000000000000000") as BigNumber;
const ONE_FINNEY = ethers.utils.parseUnits("1.0", "finney") as BigNumber;
const ONE_ETH = ethers.utils.parseUnits("1.0", "ether") as BigNumber;
const FREE_SUPPLY = TEN_MILLION_TOKENS
const AIRDROP_SUPPLY = ONE_TOKEN.mul(BigNumber.from("1000000"))

describe("SimpleToken", () => {
  let simpleToken: SimpleToken, 
      deployer: Signer,
      admin1: Signer,
      admin2: Signer,
      vault: Signer,
      addresses: Signer[]

  const setupSimpleToken = async () => {
    [deployer, admin1, admin2, vault, ...addresses] = await ethers.getSigners();
    simpleToken = await new SimpleTokenFactory(deployer).deploy(
      FREE_SUPPLY,
      AIRDROP_SUPPLY,
      await vault.getAddress(),
      "Simple Token",
      "SIMPL",
      [await admin1.getAddress(), await admin2.getAddress()]
    );
    await simpleToken.deployed();
  }
  describe("Deployment", () => {
    beforeEach(setupSimpleToken)

    it("should deploy", async () => {
      expect(simpleToken).to.be.ok;
    })

    it("should grant admin role to list of addresses sent on constructor", async () => {
      const adminRole = await simpleToken.DEFAULT_ADMIN_ROLE()
      expect(
             await simpleToken.hasRole(adminRole, await deployer.getAddress())
            ).to.equal(false);
      expect(
             await simpleToken.hasRole(adminRole, await admin2.getAddress())
            ).to.equal(true);
      expect(
             await simpleToken.hasRole(adminRole, await admin1.getAddress())
            ).to.equal(true);
    })

    it("should supply the vault the initial free supply amount", async () => {
      expect(await simpleToken.balanceOf(await vault.getAddress())).to.equal(FREE_SUPPLY);
    })

    it("should hold the airdropped tokens within the contract", async () => {
      expect(await simpleToken.balanceOf(await simpleToken.resolvedAddress)).to.equal(AIRDROP_SUPPLY);
    })
  })
})
