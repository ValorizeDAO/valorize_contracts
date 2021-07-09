const { expect } = require("chai");
const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');

describe("CreatorToken", () => {
  let CreatorToken, token, owner, addr1, addresses

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
      [owner, addr1, ...addreses] = await ethers.getSigners();
    })

    it("Should create a token on deploying a contract", async () => {
      expect(await token.name()).to.equal("CreatorTest");
      expect(await token.symbol()).to.equal("TST");
      expect(await token.totalSupply()).to.equal(1000);
      let ownerBalance = await token.balanceOf(owner.address)
      expect(ownerBalance).to.equal(1000);
    });

    it("Should let user deposit ETH to mine tokens, giving 90% of newly minted tokens to person staking", async () => {
      await token.connect(addr1).stakeForNewTokens({ value: ethers.utils.parseUnits("1.0", "finney").toNumber() })
      const senderBalance = await token.balanceOf(addr1.address)
      expect(senderBalance).to.equal(2845);
    })

    it("Should give 10% of the newly minted tokens to the contract owner", async () => {
      let ownerBalance = await token.balanceOf(owner.address)
      await token.connect(addr1).stakeForNewTokens({ value: ethers.utils.parseUnits("1.0", "finney").toNumber() })
      let newOwnerBalance = await token.balanceOf(owner.address)
      let ownerBalanceDiff = newOwnerBalance - ownerBalance
      expect(ownerBalanceDiff).to.equal(316);
    })

    it("Should emit a creation event on minting", async () => {
      const msgMetadata = { value: ethers.utils.parseUnits("1.0", "finney").toNumber() }
      await expect(
        token.connect(addr1).stakeForNewTokens(msgMetadata))
        .to.emit(token, 'Minted')
        .withArgs(addr1.address, 3161, 2845, 316);
    })

    it("Should let user deposit ETH to mine tokens, with an increase in difficulty on each new minting", async () => {
      const oneFinneyTxMetadata = { value: ethers.utils.parseUnits("1.0", "finney").toNumber() }
      await token.connect(addr1).stakeForNewTokens(oneFinneyTxMetadata)
      let senderBalance = await token.balanceOf(addr1.address)
      expect(senderBalance).to.equal(2845);
      await token.connect(addr1).stakeForNewTokens(oneFinneyTxMetadata)
      senderBalance = await token.balanceOf(addr1.address)
      expect(senderBalance).to.equal(2845);
    })

    it("Should allow for the founder percentage to be reconfigured by the owner", async () => {
      const oneFinneyTxMetadata = { value: ethers.utils.parseUnits("1.0", "finney").toNumber() };
      await token.connect(owner).changeFounderPercentage(20);

      let ownerBalance = await token.balanceOf(owner.address)
      await token.connect(addr1).stakeForNewTokens(oneFinneyTxMetadata);
      let newOwnerBalance = await token.balanceOf(owner.address)
      let ownerBalanceDiff = newOwnerBalance - ownerBalance
      expect(ownerBalanceDiff).to.equal(632);
    })
  })
});
