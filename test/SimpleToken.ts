import { ethers } from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { getAddress } from "@ethersproject/address";
import { SimpleToken } from './../typechain/SimpleToken.d';
import { SimpleTokenFactory } from './../typechain/SimpleTokenFactory';

chai.use(solidity);
const { expect } = chai;
const TEN_MILLION_IN_WEI = ethers.BigNumber.from("100000000000000000000000000") as BigNumber;
const ONE_FINNEY = ethers.utils.parseUnits("1.0", "finney") as BigNumber;
const ONE_ETH = ethers.utils.parseUnits("1.0", "ether") as BigNumber;

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
      TEN_MILLION_IN_WEI,
      "Simple Token",
      "SIMPL",
      await vault.getAddress(),
      [await admin1.getAddress(), await admin2.getAddress()]
    );
    await simpleToken.deployed();
  }
  describe("Deployment", () => {
    beforeEach(setupSimpleToken)

    it("should deploy", async () => {
      expect(simpleToken).to.be.ok;
    })
  })
})
