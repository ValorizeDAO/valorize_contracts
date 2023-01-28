import { ethers } from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { getAddress } from "@ethersproject/address";
import { TradableToken } from "../typechain/TradableToken";
import { TradableTokenFactory } from "../typechain/TradableTokenFactory";
import { ExposedTimedMint } from "../typechain/ExposedTimedMint";

chai.use(solidity);

const { expect } = chai;
const POINT_ONE_TOKEN = ethers.BigNumber.from("100000000000000000") as BigNumber;
const ONE_TOKEN = ethers.BigNumber.from("1000000000000000000") as BigNumber;
const TEN_TOKENS = ethers.BigNumber.from("10000000000000000000") as BigNumber;
const HUNDRED_TOKENS = ethers.BigNumber.from("100000000000000000000") as BigNumber;
const THOUSAND_TOKENS = ethers.BigNumber.from("1000000000000000000000") as BigNumber;
const TEN_THOUSAND_TOKENS = ethers.BigNumber.from("10000000000000000000000") as BigNumber;
const MILLION_TOKENS = ethers.BigNumber.from("1000000000000000000000000") as BigNumber;

describe.only("TradableToken", () => {
  let tt: TradableToken,
    deployer: Signer,
    admin1: Signer,
    admin2: Signer,
    vault: Signer,
    addresses: Signer[];

  const setupTradableToken = async () => {
    [deployer, admin1, admin2, vault, ...addresses] = await ethers.getSigners();
    tt = await new TradableTokenFactory(deployer
      ).deploy(
      await vault.getAddress()
    );
    await tt.deployed();
  };

  describe("Deployment", async () => {
    beforeEach(setupTradableToken)

    it("should deploy", async () => {
      expect(tt).to.be.ok;
    });
  });

  describe("Mint of Tradable Tokens", async () => {
    beforeEach(setupTradableToken)

    it("mints tokens", async () => {
        await tt.connect(deployer).mint(ONE_TOKEN);
        const contractBalance =  await tt.balanceOf(await vault.getAddress());
        expect(contractBalance).to.equal(BigNumber.from("7000000000000000000")); //0.7 Token
    });

    it("gives allowance", async () => {
      await tt.connect(vault).approve(await addresses[0].getAddress(), TEN_TOKENS);
      expect(await tt.allowance(await vault.getAddress(), await addresses[0].getAddress())
      ).to.equal(TEN_TOKENS);
    });

    it("transfers from contract to caller", async () => {
      await tt.connect(deployer).mint(MILLION_TOKENS);
      await tt.connect(vault).approve(await addresses[0].getAddress(), ONE_TOKEN);
      await tt.connect(addresses[0]
        ).transferFrom
          (await vault.getAddress(), await addresses[0].getAddress(), POINT_ONE_TOKEN, {gasLimit:30000000});
      const balance = await tt.balanceOf(await addresses[0].getAddress());
      expect(balance).to.equal(POINT_ONE_TOKEN);
    });
  });
});