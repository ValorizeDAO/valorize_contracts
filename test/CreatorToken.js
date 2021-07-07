const { expect } = require("chai");

describe("CreatorToken", () => {
  let CreatorToken, token, owner, addr1, addresses

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
  });

  it("Should let user deposit ETH to mine tokens, giving 90% of newly minted tokens to person staking", async () => {
    await token.connect(addr1).stakeForNewTokens({ value: ethers.utils.parseUnits("1.0", "finney").toNumber() })
    const senderBalance = await token.balanceOf(addr1.address)
    expect(senderBalance).to.equal(27);
  })

  it("Should give 10% of the newly minted tokens to the contract owner", async () => {
    let ownerBalance = await token.balanceOf(owner.address)
    await token.connect(addr1).stakeForNewTokens({ value: ethers.utils.parseUnits("1.0", "finney").toNumber() })
    let newOwnerBalance = await token.balanceOf(owner.address)
    let ownerBalanceDiff = newOwnerBalance - ownerBalance
    expect(ownerBalanceDiff).to.equal(3);
  })

});
