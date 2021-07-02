const { expect } = require("chai");

describe("CreatorToken", function() {
  it("Should create a token on deploying a contract", async function() {
    const CreatorToken = await ethers.getContractFactory("CreatorToken");
    const token = await CreatorToken.deploy(1000000, "CreatorTest", "TST");
    await token.deployed();
    expect(await token.name()).to.equal("CreatorTest");
    expect(await token.symbol()).to.equal("TST");
    expect(await token.totalSupply()).to.equal(1000000);
  });
});
