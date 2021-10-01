import { ethers } from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import chai from "chai";
import { solidity } from "ethereum-waffle";

chai.use(solidity);
const { expect } = chai;
const INITIAL_SUPPLY_AMOUNT = ethers.BigNumber.from("1000000000000000000000") as BigNumber;
const ONE_FINNEY = ethers.utils.parseUnits("1.0", "finney") as BigNumber;
const ONE_ETH = ethers.utils.parseUnits("1.0", "ether") as BigNumber;


describe("CreatorToken", () => {
  let CreatorToken: any, token: Contract, owner: Signer, addr1: Signer, addresses: Signer[]
  const setupCreatorToken = async () => {
    CreatorToken = await ethers.getContractFactory("CreatorToken");
    token = await CreatorToken.deploy(INITIAL_SUPPLY_AMOUNT, "CreatorTest", "TST");
    await token.deployed();
    [owner, addr1, ...addresses] = await ethers.getSigners();
  }

  describe("Deployment", () => {
    beforeEach(setupCreatorToken)

    it("Should create a token on deploying a contract", async () => {
      expect(await token.name()).to.equal("CreatorTest");
      expect(await token.symbol()).to.equal("TST");
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY_AMOUNT);
      
      let ownerBalance = await token.balanceOf(await owner.getAddress())
      expect(ownerBalance).to.equal(INITIAL_SUPPLY_AMOUNT);
    });
    
    it("Should let user deposit ETH to mine tokens, giving 90% of newly minted tokens to person staking", async () => {
      await token.connect(addr1).buyNewTokens({ value: ONE_ETH })
      
      const senderBalance = await token.balanceOf(await addr1.getAddress())
      const expected = ethers.BigNumber.from("40764525136982090668373")
      expect(senderBalance).to.equal(expected);
    })

    it("Should give 10% of the newly minted tokens to the contract owner", async () => {
      let ownerBalance = await token.balanceOf(await owner.getAddress())
      await token.connect(addr1).buyNewTokens({ value: ONE_ETH })
      let newOwnerBalance = await token.balanceOf(await owner.getAddress()) as BigNumber;
      let ownerBalanceDiff = newOwnerBalance.sub(ownerBalance)
      expect(ownerBalanceDiff).to.equal(ethers.BigNumber.from("4529391681886898963152"));
    })

    it("Should emit a 'Distributed' event on minting", async () => {
      const msgMetadata = { value: ONE_FINNEY }
      const expectedTotal = ethers.BigNumber.from("93204408653311889782") as BigNumber;
      const expectedBuyer = ethers.BigNumber.from("83883967787980700804");
      const expectedOwner = expectedTotal.mul(10).div(100)
      await expect(
        token.connect(addr1).buyNewTokens(msgMetadata))
        .to.emit(token, 'Distributed')
        .withArgs(await addr1.getAddress(), ONE_FINNEY, expectedTotal, expectedBuyer, expectedOwner);
    })

    it("Should let user buy tokens from the contract, and the price increasing the more ether is staked", async () => {
      const oneEthTxMetadata = { value: ONE_ETH }
      const twoEthTxMetadata = { value: ONE_ETH.mul(ethers.BigNumber.from("2")) }
      await token.connect(addr1).buyNewTokens(oneEthTxMetadata)
      let senderBalance = await token.balanceOf(await addr1.getAddress()) as BigNumber;
      let senderBalanceFirst = senderBalance
      await token.connect(addr1).buyNewTokens(oneEthTxMetadata)
      senderBalance = await token.balanceOf(await addr1.getAddress());
      let senderBalanceSecond = senderBalance
      await token.connect(addr1).buyNewTokens(oneEthTxMetadata)
      senderBalance = await token.balanceOf(await addr1.getAddress());
      let senderBalanceThird = senderBalance
      await token.connect(addr1).buyNewTokens(oneEthTxMetadata)
      senderBalance = await token.balanceOf(await addr1.getAddress());
      let senderBalanceFourth = senderBalance

      const firstDiff = senderBalanceSecond.sub(senderBalanceFirst)
      const secondDiff = senderBalanceThird.sub(senderBalanceSecond)
      const thirdDiff = senderBalanceFourth.sub(senderBalanceThird)

      //More tokens should be minted on the first try
      expect(firstDiff.gt(secondDiff)).to.be.true;
      expect(secondDiff.gt(thirdDiff)).to.be.true;
    })
  })

  describe("Founder Percentage", () => {
    beforeEach(setupCreatorToken)

    it("Should allow for the founder percentage to be reconfigured by the owner", async () => {
      const oneFinneyTxMetadata = { value: ONE_FINNEY };
      await token.connect(owner).changeFounderPercentage(20);

      let ownerBalance = await token.balanceOf(await owner.getAddress())
      await token.connect(addr1).buyNewTokens(oneFinneyTxMetadata);
      let newOwnerBalance = await token.balanceOf(await owner.getAddress())
      let ownerBalanceDiff = newOwnerBalance - ownerBalance;
      expect(ownerBalanceDiff).to.equal(18640881730662433000);
    })

    it("Should not allow for a non founder to change the founder percentage", async () => {
      const oneFinneyTxMetadata = { value: ethers.utils.parseUnits("1.0", "finney").toNumber() };
      await expect(
        token.connect(addr1).changeFounderPercentage(20)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    })

    it("Should not allow for founder to change to a percentage > 100", async () => {
      await expect(
        token.connect(owner).changeFounderPercentage(101)
      ).to.be.revertedWith('');
    })

    it("Should not give all newly minted tokens to founder if percentage is 100", async () => {
      const oneFinneyTxMetadata = { value: ethers.utils.parseUnits("1.0", "finney").toNumber() };
      await token.connect(owner).changeFounderPercentage(100)
      await token.connect(addr1).buyNewTokens(oneFinneyTxMetadata)
      const senderBalance = await token.balanceOf(await addr1.getAddress())
      expect(senderBalance).to.equal(0);
    })

    it("Should not give any newly minted tokens to founder if percentage is 0", async () => {
      const oneFinneyTxMetadata = { value: ONE_FINNEY };
      await token.connect(owner).changeFounderPercentage(0)
      const ownerTokenBalance = await token.balanceOf(await owner.getAddress());
      await token.connect(addr1).buyNewTokens(oneFinneyTxMetadata)
      const ownerTokenBalanceAfterTransaction = await token.balanceOf(await owner.getAddress());
      const senderBalance = await token.balanceOf(await addr1.getAddress())
      expect(senderBalance).to.equal(ethers.BigNumber.from("93204408653311889783"));
      expect(ownerTokenBalance).to.equal(ownerTokenBalanceAfterTransaction)
    })
  })
  describe("Withdrawals", () => {
    const oneFinneyTxMetadata = { value: ONE_FINNEY };

    beforeEach(setupCreatorToken);

    it("Should allow users to withdraw all the ETH from the contract", async () => {
      await token.connect(owner).buyNewTokens(oneFinneyTxMetadata);
      const initialOwnerBalance = parseFloat(ethers.utils.formatEther(await owner.getBalance()));
      const ownerSupply = await token.connect(owner).balanceOf(await owner.getAddress())

      await token.connect(owner).sellTokensForEth(ownerSupply);
      const finalOwnerBalance = parseFloat(ethers.utils.formatEther(await owner.getBalance()));
      expect(floatDifferenceIsWithinDelta(initialOwnerBalance, finalOwnerBalance)).to.equal(true);
      expect(await ethers.getDefaultProvider().getBalance(token.address)).to.equal(0);
    })

    it("The ETH withdrawal should be proportionate to the balance in the contract", async () => {
      await token.connect(addr1).buyNewTokens({ value: ONE_ETH });
      const initialUserEthBalance = await addr1.getBalance() as BigNumber;
      const userTokenBalance = await token.connect(addr1).balanceOf(await addr1.getAddress()) as BigNumber;

      await token.connect(addr1).sellTokensForEth(userTokenBalance);      
      const finalUserEthBalance = await addr1.getBalance() as BigNumber;
      
      expect(finalUserEthBalance.gt(initialUserEthBalance)).to.equal(true);
    })

    it("Should not allow users to withdraw more tokens than what they own", async () => {
      await token.connect(addr1).buyNewTokens(oneFinneyTxMetadata);
      const userSupply = await token.connect(addr1).balanceOf(await addr1.getAddress())
      
      await expect(
        token.connect(addr1).sellTokensForEth(userSupply.add(ethers.BigNumber.from("1")))
      ).to.be.revertedWith("not enough tokens");
    })
  })
  describe("View", () => {
    beforeEach(setupCreatorToken)

    it("Should let users see how many tokens will be deployed", async () => {
      const [toBuyer, toOwner] = await token.connect(addr1).calculateTokenBuyReturns(ONE_FINNEY)
      expect(toBuyer.toString()).to.equal('83883967787980700804');
      expect(toOwner.toString()).to.equal('9320440865331188978');
      const [toBuyer2, toOwner2] = await token.connect(addr1).calculateTokenBuyReturns(ethers.utils.parseUnits("2.0", "ether"))
      expect(toBuyer2.toString()).to.equal('54023820594276909688566');
      await token.connect(addr1).buyNewTokens({ value: ONE_FINNEY });
      expect(await token.connect(addr1).balanceOf(await addr1.getAddress())).to.equal(toBuyer);
    })

    it("Should let users see how many tokens will be deployed", async () => {
      await token.connect(addr1).buyNewTokens({ value: ethers.utils.parseUnits("1.0", "ether") });
      const tokens = await token.connect(addr1).calculateTokenBuyReturns(ONE_FINNEY)
      expect(tokens[0].toString()).to.equal('33294996610667861090');
    })

    it("Should let users see how much ETH will be returned from selling tokens", async () => {
      await token.connect(owner).buyNewTokens({ value: ONE_ETH })
      await token.connect(addr1).buyNewTokens({ value: ONE_ETH })

      const initialUserEthBalance = await owner.getBalance() as BigNumber;
      const userTokenBalance = await token.connect(owner).balanceOf(await owner.getAddress()) as BigNumber;
      
      const saleReturns = await token.connect(owner).calculateTotalSaleReturn(userTokenBalance)
      const tx = await token.connect(owner).sellTokensForEth(userTokenBalance);      
      const maxGasFee = tx.gasPrice.mul(tx.gasLimit);

      const expectedBalance = initialUserEthBalance.add(saleReturns)
      const finalUserEthBalance = await owner.getBalance() as BigNumber;
      
      expect(expectedBalance.sub(finalUserEthBalance).lt(maxGasFee)).to.equal(true);      
    })
  })
});

const floatDifferenceIsWithinDelta = (floatOne: number, floatTwo: number, delta = 0.001) : Boolean => {
  return Math.abs(floatOne - floatTwo) < delta;
}
