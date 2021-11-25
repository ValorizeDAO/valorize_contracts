import { SimpleToken } from './../typechain/SimpleToken.d';
import { SimpleTokenFactory } from './../typechain/SimpleTokenFactory';
import { VestingSchedule } from './../typechain/VestingSchedule.d';
import { VestingScheduleFactory } from './../typechain/VestingScheduleFactory';
import SuperfluidSDK from "@superfluid-finance/js-sdk";
import { ethers } from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { getAddress } from "@ethersproject/address";

require('dotenv').config()

//enter RPC url here
const PROVIDER_URL = process.env.PROVIDER_URL;

chai.use(solidity);
const { expect } = chai;
const TEN_MILLION_IN_WEI = ethers.BigNumber.from("100000000000000000000000000") as BigNumber;
const ONE_FINNEY = ethers.utils.parseUnits("1.0", "finney") as BigNumber;
const ONE_ETH = ethers.utils.parseUnits("1.0", "ether") as BigNumber;

describe("VestingSchedule", () => {
  console.log(ethers)
  let vestedToken: VestingSchedule, token: SimpleToken, deployer: Signer, admin: Signer, safe: Signer, addresses: Signer[]
  const setupVestedToken = async () => {
    [deployer, admin, safe, ...addresses] = await ethers.getSigners();
    token = await new SimpleTokenFactory(admin).deploy("OrgToken", "TST", TEN_MILLION_IN_WEI, await safe.getAddress(), await admin.getAddress());
    vestedToken = await new VestingScheduleFactory(admin).deploy(
      await admin.getAddress(),
     '0xF2B4E81ba39F5215Db2e05B2F66f482BB8e87FD2',
     '0xaD2F1f7cd663f6a15742675f975CcBD42bb23a88',
     '0x6fC99F5591b51583ba15A8C2572408257A1D2797'
     )
    const sf = new SuperfluidSDK.Framework({                                                                                                                                                                                           
      ethers: new ethers.providers.Web3Provider(new ethers.providers.InfuraProvider(PROVIDER_URL))                                                                                                                                                                                            
    })    
  }
  

  describe("Deployment", () => {
    beforeEach(setupVestedToken)

    it("should deploy", async () => {
      expect(vestedToken).to.be.ok;
    })
  })
  describe("Streaming", () => {
    beforeEach(setupVestedToken)

    it("should stream tokens to recipient", async () => {
      const recipient = addresses[2]
      vestedToken.openStream(await recipient.getAddress(), "385802469135802")
    })
  })

});
