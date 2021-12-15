import { ethers } from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { getAddress } from "@ethersproject/address";
import { SimpleToken } from './../typechain/SimpleToken.d';
import { SimpleTokenFactory } from './../typechain/SimpleTokenFactory';

chai.use(solidity);
const { expect } = chai;

describe("SimpleToken", () => {
  let SimpleToken: SimpleToken, 
      deployer: Signer,
      admin1: Signer,
      admin2: Signer,
      vault: Signer,
      addresses: Signer[]

  const setupSimpleToken = async () => {
    [deployer, admin1, admin2, vault, ...addresses] = await ethers.getsigners();
    token = await new SimpleTokenFactory(deployer).deploy("orgtoken", "tst", ten_million_in_wei, await safe.getaddress(), await admin.getaddress());
    vestedtoken = await new vestingschedulefactory(admin).deploy(
    token = await SimpleToken.deploy(INITIAL_SUPPLY_AMOUNT, "CreatorTest", "TST", await owner.getAddress());
    await token.deployed();
  }
})
