import { VestingSchedule } from './../typechain/VestingSchedule.d';
import { VestingScheduleFactory } from './../typechain/VestingScheduleFactory';
import { ethers } from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { getAddress } from "@ethersproject/address";

chai.use(solidity);
const { expect } = chai;
const TEN_MILLION_IN_WEI = ethers.BigNumber.from("100000000000000000000000000") as BigNumber;
const ONE_FINNEY = ethers.utils.parseUnits("1.0", "finney") as BigNumber;
const ONE_ETH = ethers.utils.parseUnits("1.0", "ether") as BigNumber;


describe("VestingSchedule", () => {
  let SimpleToken: any, vestedToken: VestingSchedule, token: Contract, deployer: Signer, admin: Signer, safe: Signer, addresses: Signer[]
  const setupVestedToken = async () => {
    [deployer, admin, safe, ...addresses] = await ethers.getSigners();
    SimpleToken = await ethers.getContractFactory("SimpleToken");
    token = await SimpleToken.deploy("OrgToken", "TST", TEN_MILLION_IN_WEI, await safe.getAddress(), await admin.getAddress());
    await token.deployed();
    vestedToken = await new VestingScheduleFactory(admin).deploy(await admin.getAddress())
  }

  describe("Deployment", () => {
    beforeEach(setupVestedToken)

    it("should deploy", async () => {
      expect(vestedToken).to.be.ok;
    })
  })

});
