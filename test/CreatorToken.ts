import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import chai from "chai";
import { solidity } from "ethereum-waffle";

chai.use(solidity);
const { expect } = chai;

describe("CreatorToken", () => {
  let CreatorToken: any, token: Contract, owner: Signer, addr1: Signer, addresses: Signer[]

  describe("Deployment", () => {
    beforeEach(async () => {
      const Sqrt = await ethers.getContractFactory("Sqrt");
      const sqrtUtil = await Sqrt.deploy();
      await sqrtUtil.deployed();

      CreatorToken = await ethers.getContractFactory("CreatorToken", { 
        libraries: {
          Sqrt: sqrtUtil.address 
        }
      });
      token = await CreatorToken.deploy(1000, "CreatorTest", "TST");
      await token.deployed();
      [owner, addr1, ...addresses] = await ethers.getSigners();
    })

    it("Should create a token on deploying a contract", async () => {
      expect(await token.name()).to.equal("CreatorTest");
      expect(await token.symbol()).to.equal("TST");
      expect(await token.totalSupply()).to.equal(1000);
      let ownerBalance = await token.balanceOf(await owner.getAddress())
      expect(ownerBalance).to.equal(1000);
    });

    it("Should let user deposit ETH to mine tokens, giving 90% of newly minted tokens to person staking", async () => {
      await token.connect(addr1).stakeForNewTokens({ value: ethers.utils.parseUnits("1.0", "finney").toNumber() })
      const senderBalance = await token.balanceOf(await addr1.getAddress())
      expect(senderBalance).to.equal(900);
    })

    it("Should give 10% of the newly minted tokens to the contract owner", async () => {
      let ownerBalance = await token.balanceOf(await owner.getAddress())
      await token.connect(addr1).stakeForNewTokens({ value: ethers.utils.parseUnits("1.0", "finney").toNumber() })
      let newOwnerBalance = await token.balanceOf(await owner.getAddress())
      let ownerBalanceDiff = newOwnerBalance - ownerBalance
      expect(ownerBalanceDiff).to.equal(100);
    })

    it("Should emit a creation event on minting", async () => {
      const msgMetadata = { value: ethers.utils.parseUnits("1.0", "finney").toNumber() }
      await expect(
        token.connect(addr1).stakeForNewTokens(msgMetadata))
        .to.emit(token, 'Minted')
        .withArgs(await addr1.getAddress(), 1000, 900, 100);
    })

    it("Should let user deposit ETH to mine tokens, with an increase in difficulty on each new minting", async () => {
      const oneFinneyTxMetadata = { value: ethers.utils.parseUnits("1.0", "finney").toNumber() }
      await token.connect(addr1).stakeForNewTokens(oneFinneyTxMetadata)
      let senderBalance = await token.balanceOf(await addr1.getAddress())
      expect(senderBalance).to.equal(900);
      await token.connect(addr1).stakeForNewTokens(oneFinneyTxMetadata)
      senderBalance = await token.balanceOf(await addr1.getAddress())
      expect(senderBalance).to.equal(1800);
    })
  })

  describe("Founder Percentage", () => {
    beforeEach(async () => {
      const Sqrt = await ethers.getContractFactory("Sqrt");
      const sqrtUtil = await Sqrt.deploy();
      await sqrtUtil.deployed();

      CreatorToken = await ethers.getContractFactory("CreatorToken", { 
        libraries: {
          Sqrt: sqrtUtil.address 
        }
      });
      token = await CreatorToken.deploy(1000, "CreatorTest", "TST");
      await token.deployed();
      [owner, addr1, ...addresses] = await ethers.getSigners();
    })

    it("Should allow for the founder percentage to be reconfigured by the owner", async () => {
      const oneFinneyTxMetadata = { value: ethers.utils.parseUnits("1.0", "finney").toNumber() };
      await token.connect(owner).changeFounderPercentage(20);

      let ownerBalance = await token.balanceOf(await owner.getAddress())
      await token.connect(addr1).stakeForNewTokens(oneFinneyTxMetadata);
      let newOwnerBalance = await token.balanceOf(await owner.getAddress())
      let ownerBalanceDiff = newOwnerBalance - ownerBalance;
      expect(ownerBalanceDiff).to.equal(200);
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
      await token.connect(addr1).stakeForNewTokens(oneFinneyTxMetadata)
      const senderBalance = await token.balanceOf(await addr1.getAddress())
      expect(senderBalance).to.equal(0);
    })

    it("Should not give any newly minted tokens to founder if percentage is 0", async () => {
      const oneFinneyTxMetadata = { value: ethers.utils.parseUnits("1.0", "finney").toNumber() };
      await token.connect(owner).changeFounderPercentage(0)
      await token.connect(addr1).stakeForNewTokens(oneFinneyTxMetadata)
      const senderBalance = await token.balanceOf(await addr1.getAddress())
      expect(senderBalance).to.equal(1000);
    })
  })
  describe("Withdrawals", () => {
    const oneFinneyTxMetadata = { value: ethers.utils.parseUnits("1.0", "finney").toNumber() };
    let provider: any;

    beforeEach(async () => {
      provider = await ethers.getDefaultProvider();
      const Sqrt = await ethers.getContractFactory("Sqrt");
      const sqrtUtil = await Sqrt.deploy();
      await sqrtUtil.deployed();

      CreatorToken = await ethers.getContractFactory("CreatorToken", { 
        libraries: {
          Sqrt: sqrtUtil.address 
        }
      });
      token = await CreatorToken.deploy(1000, "CreatorTest", "TST");
      await token.deployed();
      [owner, addr1, ...addresses] = await ethers.getSigners();
    })

    it("Should allow users to withdraw ETH from the contract", async () => {
      await token.connect(addr1).stakeForNewTokens(oneFinneyTxMetadata);
      console.log(ethers.utils.formatEther(await owner.getBalance()));
      await token.connect(owner).withdraw(1000);
      console.log(ethers.utils.formatEther(await owner.getBalance()));
      expect(await owner.getBalance()).to.equal(100);
    })
    it("Should not allow users to withdraw more tokens than what they own", async () => {
      await token.connect(addr1).stakeForNewTokens(oneFinneyTxMetadata);
      await expect(
        token.connect(addr1).withdraw(1000)
      ).to.be.revertedWith("not enough tokens to withdraw");
    })
  })
});
