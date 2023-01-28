import { ethers } from "hardhat";
import { BigNumber, Contract, getDefaultProvider, Signer } from "ethers";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { getAddress } from "@ethersproject/address";
import { TokenSwap } from "../typechain/TokenSwap";
import { TokenSwapFactory } from "../typechain/TokenSwapFactory";
import { ExperienceToken } from "../typechain/ExperienceToken";
import { ExperienceTokenFactory } from "../typechain/ExperienceTokenFactory";
import { TradableToken } from "../typechain/TradableToken";
import { TradableTokenFactory } from "../typechain/TradableTokenFactory";

chai.use(solidity);

const { expect } = chai;
const ONE_TOKEN = ethers.BigNumber.from("1000000000000000000") as BigNumber;
const TEN_TOKENS = ethers.BigNumber.from("100000000000000000000") as BigNumber;
const HUNDRED_TOKENS = ethers.BigNumber.from("100000000000000000000") as BigNumber;
const TWO_HUNDRED_TOKENS = ethers.BigNumber.from("200000000000000000000") as BigNumber;
const THOUSAND_TOKENS = ethers.BigNumber.from("1000000000000000000000") as BigNumber;
const TEN_THOUSAND_TOKENS = ethers.BigNumber.from("10000000000000000000000") as BigNumber;
const HUNDRED_THOUSAND_TOKENS = ethers.BigNumber.from("100000000000000000000000") as BigNumber;


describe.only("TokenSwap", () => {
    let expt: ExperienceToken
    let tt: TradableToken
    let ts: TokenSwap,
    deployer: Signer,
    admin1: Signer,
    admin2: Signer,
    vault: Signer,
    addresses: Signer[];

  const setupTokenSwap = async () => {
    [deployer, admin1, admin2, vault, ...addresses] = await ethers.getSigners();
    expt = await new ExperienceTokenFactory(deployer).deploy(
        );
    await expt.deployed();

    tt = await new TradableTokenFactory(deployer).deploy(
      await vault.getAddress()
        );
    await tt.deployed();

    ts = await new TokenSwapFactory(deployer).deploy(
      await vault.getAddress()
    );
    await ts.deployed();
  };


  describe("Deployment", async () => {
    beforeEach(setupTokenSwap)

    it("should deploy", async () => {
      expect(ts).to.be.ok;
      expect(tt).to.be.ok;
      expect(expt).to.be.ok;
    });
  });

  describe("Swaps tokens", async () => {
    beforeEach(async function beforeSwap() {
      await setupTokenSwap();
      await expt.addAdmin(await addresses[5].getAddress());
      await expt.connect(addresses[5]).setSwapContractAddress(ts.address);
      await ts.setExperienceTokenAddress(expt.address);
      await ts.setTradableTokenAddress(tt.address);
      await tt.connect(deployer).mint(TEN_THOUSAND_TOKENS);
      await expt.connect(deployer).mint(HUNDRED_TOKENS);
      await tt.connect(vault).approve(await ts.resolvedAddress, THOUSAND_TOKENS);
      await expt.addContributors([
        await addresses[0].getAddress(),
        await addresses[1].getAddress()
      ]);
      await expt.transfer(await addresses[0].getAddress(), TEN_TOKENS, {gasLimit:30000000});
    })

    it("returns the total supply of Tradable Token", async () => {
      const totalSupply = await tt.totalSupply();
      expect(totalSupply).to.equal(BigNumber.from("8000000000000000000"));
    })

    it("returns the total supply of Experience Token", async () => {
      const totalSupply = await expt.totalSupply();
      expect(totalSupply).to.equal(TEN_THOUSAND_TOKENS);
    });

    it("swaps tokens", async () => {
      const swap = await ts.connect(addresses[0]).swap(HUNDRED_TOKENS);  
      expect(swap).to.emit(ts, "Swap"
        ).withArgs(await addresses[0].getAddress(), 
        BigNumber.from("100000000000000000000"), 
        BigNumber.from("1998401278976818540"))
    });

    it("burns the experience tokens the swap contract holds", async () => {
      await expt.connect(deployer).burn(TEN_THOUSAND_TOKENS);
      expect(await expt.totalSupply()).to.equal(0);
    });
    
    it("adjusts the weight of the swap", async () => {
      await ts.adjustWeight(1);
      expect(await ts.weight()).to.equal(1);
    })

  });
});