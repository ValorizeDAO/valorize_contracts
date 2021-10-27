import { ethers } from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { getAddress } from "@ethersproject/address";

chai.use(solidity);
const { expect } = chai;
const TEN_MILLION_IN_WEI = ethers.BigNumber.from("10000000000000000000000") as BigNumber;
const ONE_FINNEY = ethers.utils.parseUnits("1.0", "finney") as BigNumber;
const ONE_ETH = ethers.utils.parseUnits("1.0", "ether") as BigNumber;


describe("VestedToken", () => {
  let VestedToken: any, token: Contract, owner: Signer, addr1: Signer, addresses: Signer[]
  const setupVestedToken = async () => {
    [owner, addr1, ...addresses] = await ethers.getSigners();
    VestedToken = await ethers.getContractFactory("VestedToken");
    token = await VestedToken.deploy(TEN_MILLION_IN_WEI, "OrgToken", "TST", await owner.getAddress());
    await token.deployed();
  }

  describe("Deployment", () => {
    beforeEach(setupVestedToken)

    it("Should create a token on deploying a contract", async () => {
      expect(await token.name()).to.equal("OrgToken");
      expect(await token.symbol()).to.equal("TST");
    });
  })
});

const floatDifferenceIsWithinDelta = (floatOne: number, floatTwo: number, delta = 0.001) : Boolean => {
  return Math.abs(floatOne - floatTwo) < delta;
}
