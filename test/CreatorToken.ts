import { ethers } from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import chai from "chai";
import { solidity } from "ethereum-waffle";

chai.use(solidity);
const { expect } = chai;
const INITIAL_SUPPLY_AMOUNT = ethers.BigNumber.from("1000000000000000000000");
const ONE_FINNEY = ethers.utils.parseUnits("1.0", "finney")
const ONE_ETH = ethers.utils.parseUnits("1.0", "ether")


describe("CreatorToken", () => {
  let CreatorToken: any, token: Contract, owner: Signer, addr1: Signer, addresses: Signer[]
  const setupCreatorToken = async () => {
        CreatorToken = await ethers.getContractFactory("CreatorToken");
        token = await CreatorToken.deploy(INITIAL_SUPPLY_AMOUNT, 800000, "CreatorTest", "TST");
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
      const expected = ethers.BigNumber.from("666991013933023450444")
      expect(senderBalance).to.equal(expected);
    })

    it("Should give 10% of the newly minted tokens to the contract owner", async () => {
      let ownerBalance = await token.balanceOf(await owner.getAddress())
      await token.connect(addr1).buyNewTokens({ value: ONE_ETH })
      let newOwnerBalance = await token.balanceOf(await owner.getAddress()) as BigNumber;
      let ownerBalanceDiff = newOwnerBalance.sub(ownerBalance)
      expect(ownerBalanceDiff).to.equal(ethers.BigNumber.from("74110112659224827827"));
    })

    it("Should emit a creation event on minting", async () => {
      const msgMetadata = { value: ONE_FINNEY }
      const expectedTotal = ethers.BigNumber.from("799920031982411255") as BigNumber;
      const expectedBuyer = ethers.BigNumber.from("719928028784170130");
      const expectedOwner = expectedTotal.mul(10).div(100)
      await expect(
        token.connect(addr1).buyNewTokens(msgMetadata))
        .to.emit(token, 'Minted')
        .withArgs(await addr1.getAddress(), ONE_FINNEY, expectedTotal, expectedBuyer, expectedOwner);
    })

    it("Should let user buy tokens from the contract, and the price increasing the more ether is staked", async () => {
      const oneEthTxMetadata = { value: ONE_ETH }
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
      expect(ownerBalanceDiff).to.equal(159984006396510200);
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

  //   it("Should not give any newly minted tokens to founder if percentage is 0", async () => {
  //     const oneFinneyTxMetadata = { value: ethers.utils.parseUnits("1.0", "finney").toNumber() };
  //     await token.connect(owner).changeFounderPercentage(0)
  //     await token.connect(addr1).buyNewTokens(oneFinneyTxMetadata)
  //     const senderBalance = await token.balanceOf(await addr1.getAddress())
  //     expect(senderBalance).to.equal(31);
  //   })
  // })
  // describe("Withdrawals", () => {
  //   const oneFinneyTxMetadata = { value: ethers.utils.parseUnits("1.0", "finney").toNumber() };
  //   let provider: any;

  //   beforeEach(async () => {
  //     provider = await ethers.getDefaultProvider();
  //     const Sqrt = await ethers.getContractFactory("Sqrt");
  //     const sqrtUtil = await Sqrt.deploy();
  //     await sqrtUtil.deployed();

  //     CreatorToken = await ethers.getContractFactory("CreatorToken", {
  //       libraries: {
  //         Sqrt: sqrtUtil.address
  //       }
  //     });
  //     token = await CreatorToken.deploy(1000, "CreatorTest", "TST");
  //     await token.deployed();
  //     [owner, addr1, ...addresses] = await ethers.getSigners();
  //   })

  //   it("Should allow users to withdraw ETH from the contract", async () => {
  //     await token.connect(addr1).buyNewTokens({ value: ethers.utils.parseUnits("1.0", "ether") });

  //     const initialContractBalance = ethers.utils.formatUnits(await token.getEthBalance(), "finney");
  //     const initialUserBalance = ethers.utils.formatEther(await owner.getBalance());
  //     const tokensInCirculation = (await token.totalSupply()).toNumber();
  //     const tokenWithdrawalAmount = 1000;

  //     const expectedBalance = tokenWithdrawalAmount * parseFloat(initialContractBalance) / (tokensInCirculation * 1000);

  //     await token.connect(owner).withdraw(tokenWithdrawalAmount);
  //     const finalUserBalance = ethers.utils.formatEther(await owner.getBalance());
  //     const finalAccruedBalance = parseFloat(finalUserBalance) - parseFloat(initialUserBalance);
  //     expect(floatIsWithinDelta(expectedBalance, finalAccruedBalance)).to.equal(true);
  //   })

  //   it("Should not allow users to withdraw more tokens than what they own", async () => {
  //     await token.connect(addr1).buyNewTokens(oneFinneyTxMetadata);
  //     await expect(
  //       token.connect(addr1).withdraw(1000)
  //     ).to.be.revertedWith("not enough tokens to withdraw");
  //   })
  // })
  // describe("View", () => {
  //   let provider: any;
  //   const oneFinneyTxMetadata = { value: ethers.utils.parseUnits("1.0", "finney").toNumber() };

  //   beforeEach(async () => {
  //     provider = await ethers.getDefaultProvider();
  //     const Sqrt = await ethers.getContractFactory("Sqrt");
  //     const sqrtUtil = await Sqrt.deploy();
  //     await sqrtUtil.deployed();

  //     CreatorToken = await ethers.getContractFactory("CreatorToken", {
  //       libraries: {
  //         Sqrt: sqrtUtil.address
  //       }
  //     });
  //     token = await CreatorToken.deploy(1000, "CreatorTest", "TST");
  //     await token.deployed();
  //     [owner, addr1, ...addresses] = await ethers.getSigners();
  //   })
  //   it("Should let users see how many tokens will be deployed", async () => {
  //     const tokens = await token.connect(addr1).getCurrentStakeReturns(ethers.utils.parseUnits("1.0", "finney").toNumber())
  //     expect(tokens[0].toNumber()).to.equal(27);
  //     expect(tokens[1].toNumber()).to.equal(3);
  //   })
  //   it("Should let users see how many tokens will be deployed", async () => {
  //     await token.connect(addr1).buyNewTokens({ value: ethers.utils.parseUnits("1.0", "ether") });
  //     const tokens = await token.connect(addr1).getCurrentStakeReturns(ethers.utils.parseUnits("1.0", "finney").toNumber())
  //     expect(tokens[0].toNumber()).to.equal(19);
  //   })
  })
});

const floatIsWithinDelta = (floatOne: number, floatTwo: number, delta = 0.001) : Boolean => {
  return Math.abs(floatOne - floatTwo) < delta;
}
