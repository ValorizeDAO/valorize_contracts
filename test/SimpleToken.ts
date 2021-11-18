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


describe("SimpleToken", () => {
  let SimpleToken: any, token: Contract, deployer: Signer, admin: Signer, safe: Signer, addresses: Signer[]
  const setupSimpleToken = async () => {
    [deployer, admin, safe, ...addresses] = await ethers.getSigners();
    SimpleToken = await ethers.getContractFactory("SimpleToken");
    token = await SimpleToken.deploy("OrgToken", "TST", TEN_MILLION_IN_WEI, await safe.getAddress(), await admin.getAddress());
    await token.deployed();
  }

  describe("Deployment", () => {
    beforeEach(setupSimpleToken)

    it("Should create a token on deploying a contract", async () => {
      expect(await token.name()).to.equal("OrgToken");
      expect(await token.symbol()).to.equal("TST");
    });

    it("Should launch with the total supply given as a parameter in the constructor to the safe", async () => {
      expect(await token.totalSupply()).to.equal(TEN_MILLION_IN_WEI);
      expect(await token.balanceOf(await safe.getAddress())).to.equal(TEN_MILLION_IN_WEI);
    });

    it("Should give admin access to parameter in the constructor", async () => {
      await token.connect(admin).mint(await deployer.getAddress(), TEN_MILLION_IN_WEI),
      expect(await token.totalSupply()).to.equal(TEN_MILLION_IN_WEI.mul(ethers.BigNumber.from(2)));
    });

    it("Should reject non admin to mint new tokens", async () => {
      await expect(
        token.connect(deployer)
        .mint(await deployer.getAddress(), TEN_MILLION_IN_WEI)
      ).to.be.revertedWith("Admin Role required to call");
    });
  })

});
