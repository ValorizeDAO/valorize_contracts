const { expect } = require("chai");

describe("Sqrt", () => {
  let Math, mathUtil
  beforeEach(async () => {
    Math = await ethers.getContractFactory("Sqrt");
    mathUtil = await Math.deploy();
    await mathUtil.deployed();
  })
  it("sqrt: should provide the square root of the number given to it", async () => {
    expect(await mathUtil.sqrt(100)).to.equal(10);
    expect(await mathUtil.sqrt(10000)).to.equal(100);
    expect(await mathUtil.sqrt(0)).to.equal(0);
    expect(await mathUtil.sqrt(5)).to.equal(2);
  });
});
