const { expect } = require("chai");

describe("CreatorToken", () => {
  let CreatorToken, token, owner, addr1

  beforeEach(async () => {
    CreatorToken = await ethers.getContractFactory("CreatorToken");
    token = await CreatorToken.deploy(1000000, "CreatorTest", "TST");
    await token.deployed();
    [owner, addr1] = await ethers.getSigners();
  })

  it("Should create a token on deploying a contract", async () => {
    expect(await token.name()).to.equal("CreatorTest");
    expect(await token.symbol()).to.equal("TST");
    expect(await token.totalSupply()).to.equal(1000000);
  });

  it("Should let user deposit ETH to mine tokens", async () => {
    let tokenOwner = await token.owner();
    await token.connect(addr1).stake({ value: 100000000 })
    const senderBalance = await token.balanceOf(addr1.address)
    expect(senderBalance).to.equal(100000000000);
  })
});
