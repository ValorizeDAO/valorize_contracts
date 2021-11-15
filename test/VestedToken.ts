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


describe("VestedToken", () => {
  let VestedToken: any, token: Contract, deployer: Signer, admin: Signer, safe: Signer, addresses: Signer[]
  const setupVestedToken = async () => {
    [deployer, admin, safe, ...addresses] = await ethers.getSigners();
    VestedToken = await ethers.getContractFactory("VestedToken");
    token = await VestedToken.deploy("OrgToken", "TST", TEN_MILLION_IN_WEI, await safe.getAddress(), await admin.getAddress());
    await token.deployed();
  }

  describe("Deployment", () => {
    beforeEach(setupVestedToken)

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

    it("Should only let admin mint new tokens", async () => {
      await expect(
        token.connect(deployer)
        .mint(await deployer.getAddress(), TEN_MILLION_IN_WEI)
      ).to.be.revertedWith("Admin Role required to call");
    });
  })
  
  describe("Grant Vesting", () => {
    beforeEach(setupVestedToken)

    it("Should allow admin to grant VESTEE role to any address", async () => {
      const vestee = await token.VESTEE_ROLE()

      expect(
        await token.hasRole(vestee, await deployer.getAddress())
        ).to.equal(false);
      await token.connect(admin).addVestee(await deployer.getAddress())
      expect(
        await token.hasRole(vestee, await deployer.getAddress())
        ).to.equal(true);
    });
  })
});
