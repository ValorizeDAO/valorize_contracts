import { ethers } from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { getAddress } from "@ethersproject/address";
import { ExperienceToken } from "../typechain/ExperienceToken";
import { ExperienceTokenFactory } from "../typechain/ExperienceTokenFactory";
import exp from "constants";
import { experimentalAddHardhatNetworkMessageTraceHook } from "hardhat/config";

chai.use(solidity);

const { expect } = chai;
const ONE_TOKEN = ethers.BigNumber.from("1000000000000000000") as BigNumber;
const TEN_TOKENS = ethers.BigNumber.from("10000000000000000000") as BigNumber;
const HUNDRED_TOKENS = ethers.BigNumber.from("100000000000000000000") as BigNumber;
const THOUSAND_TOKENS = ethers.BigNumber.from("1000000000000000000000") as BigNumber;

describe.only("ExperienceToken", () => {
  let expt: ExperienceToken,
    deployer: Signer,
    admin1: Signer,
    admin2: Signer,
    vault: Signer,
    addresses: Signer[];

  const setupExperienceToken = async () => {
    [deployer, admin1, admin2, vault, ...addresses] = await ethers.getSigners();
    expt = await new ExperienceTokenFactory(deployer).deploy(
    );
    await expt.deployed();
  };

  describe("Deployment", async () => {
    beforeEach(setupExperienceToken)

    it("should deploy", async () => {
      expect(expt).to.be.ok;
    });
  });

  describe("Mint and issue soul-bound governance tokens", async () => {
    beforeEach(async function MintandIssueEXPT() {
      await setupExperienceToken();
      await expt.addContributors([
        await addresses[0].getAddress(),
        await addresses[1].getAddress()
      ]);
      await expt.setSwapContractAddress(await addresses[5].getAddress());
    })  

    it("mints a certain amount of tokens to the smart contract", async () => {
      await expt.connect(deployer).mint(TEN_TOKENS);
      const contractBalance =  await expt.balanceOf(await expt.resolvedAddress);
      expect(contractBalance).to.equal(HUNDRED_TOKENS);
    });

    it("reverts when a contributor mints a certain amount of tokens to the smart contract", async () => {
      expect(expt.connect(addresses[0]).mint(5)
      ).to.be.revertedWith("Not an admin");
    });

    it("transfers tokens to contributors", async () => {
      await expt.connect(deployer).mint(HUNDRED_TOKENS);
      await expt.connect(deployer
        ).transfer(await addresses[0].getAddress(), TEN_TOKENS);
      expect(await expt.balanceOf(await addresses[0].getAddress())).to.equal(TEN_TOKENS);
    });

    it("reverts when other than admin wants to transfer tokens", async () => {
      await expt.connect(deployer).mint(10);
      expect(expt.connect(addresses[0]).transfer(await addresses[0].getAddress(), 5)
      ).to.be.revertedWith("Not an admin");
    });

    it("adds an admin", async () => {
      const adminRole = await expt.DEFAULT_ADMIN_ROLE();
      await expt.addAdmin(await addresses[3].getAddress());
      expect(await expt.hasRole(adminRole, await addresses[3].getAddress())
      ).to.equal(true);
    });

    it("adds an array of contributors", async () => {
      const contributors = [await addresses[4].getAddress(), await addresses[5].getAddress()];
      await expt.addContributors(contributors);
      const contributor = await expt.contributors(contributors[0]);
      expect(contributor).to.equal(true);
    });

    it("transfers tokens from the contract address to the swap contract", async () => {
      await expt.mint(THOUSAND_TOKENS);
      await expt.transfer(await addresses[0].getAddress(), TEN_TOKENS);
      await expt.transferFrom(await addresses[0].getAddress(), await addresses[5].getAddress(), TEN_TOKENS);
      const balance = await expt.balanceOf(await addresses[5].getAddress());
      expect(balance).to.equal(TEN_TOKENS);
    });
  });
});