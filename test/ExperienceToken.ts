import { ethers } from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { getAddress } from "@ethersproject/address";
import { ExperienceToken } from "../typechain/ExperienceToken";
import { ExperienceTokenFactory } from "../typechain/ExperienceTokenFactory";

chai.use(solidity);

const { expect } = chai;


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
    beforeEach(async function MintandIssueSBGT() {
      await setupExperienceToken();
      await expt.addContributors([
        await addresses[0].getAddress(),
        await addresses[1].getAddress()]);
    })  

    it("mints a certain amount of SGBTs to smart contract", async () => {
      await expt.connect(deployer).mint(BigNumber.from("40000"));
      const contractBalance = await ethers.getDefaultProvider().getBalance(expt.address)
      expect(contractBalance).to.equal(BigNumber.from("40000"));
    });
  });
});