import { ethers } from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { getAddress } from "@ethersproject/address";
import { SimpleToken } from './../typechain/SimpleToken.d';
import { SimpleTokenFactory } from './../typechain/SimpleTokenFactory';
import { MerkleTree } from "merkletreejs";
import { keccak_256 } from "js-sha3";

chai.use(solidity);

const { expect } = chai;
const ONE_TOKEN = ethers.BigNumber.from("1000000000000000000") as BigNumber;
const TEN_MILLION_TOKENS = ethers.BigNumber.from("100000000000000000000000000") as BigNumber;
const ONE_FINNEY = ethers.utils.parseUnits("1.0", "finney") as BigNumber;
const ONE_ETH = ethers.utils.parseUnits("1.0", "ether") as BigNumber;
const FREE_SUPPLY = TEN_MILLION_TOKENS
const AIRDROP_SUPPLY = ONE_TOKEN.mul(BigNumber.from("1000000"))

describe("SimpleToken", () => {
  let simpleToken: SimpleToken, 
      deployer: Signer,
      admin1: Signer,
      admin2: Signer,
      vault: Signer,
      addresses: Signer[]

  const setupSimpleToken = async () => {
    [deployer, admin1, admin2, vault, ...addresses] = await ethers.getSigners();
    simpleToken = await new SimpleTokenFactory(deployer).deploy(
      FREE_SUPPLY,
      AIRDROP_SUPPLY,
      await vault.getAddress(),
      "Simple Token",
      "SIMPL",
      [await admin1.getAddress(), await admin2.getAddress()]
    );
    await simpleToken.deployed();
  }
  describe("Deployment", () => {
    beforeEach(setupSimpleToken)

    it("should deploy", async () => {
      expect(simpleToken).to.be.ok;
    })

    it("should grant admin role to list of addresses sent on constructor", async () => {
      const adminRole = await simpleToken.DEFAULT_ADMIN_ROLE()
      expect(
             await simpleToken.hasRole(adminRole, await deployer.getAddress())
            ).to.equal(false);
      expect(
             await simpleToken.hasRole(adminRole, await admin2.getAddress())
            ).to.equal(true);
      expect(
             await simpleToken.hasRole(adminRole, await admin1.getAddress())
            ).to.equal(true);
    })

    it("should supply the vault the initial free supply amount", async () => {
      expect(await simpleToken.balanceOf(await vault.getAddress())).to.equal(FREE_SUPPLY);
    })

    it("should hold the airdropped tokens within the contract", async () => {
      expect(await simpleToken.balanceOf(await simpleToken.resolvedAddress)).to.equal(AIRDROP_SUPPLY);
    })

    it("should record what was the initial supply", async () => {
      expect(await simpleToken.getInitialSupply()).to.equal(FREE_SUPPLY.add(AIRDROP_SUPPLY));
    })
  })

  describe.only("Airdrop", async () => {
    let merkleTree: MerkleTree
    beforeEach(async () => {
      await setupSimpleToken()
      const leaves = [
        [await addresses[0].getAddress(), BigNumber.from("1000000000000000000000")],
        [await addresses[1].getAddress(), BigNumber.from("2000000000000000000000")],
        [await addresses[2].getAddress(), BigNumber.from("2000000000000000000000")],
      ].map(v => ethers.utils.solidityKeccak256(['address', 'uint256'], [v[0], v[1]]))
      merkleTree = new MerkleTree(leaves, keccak_256)
    })

    it("should allow admin to set merkle Tree Root for airdrops", async () => {
      const root = merkleTree.getHexRoot()
      await expect(
        simpleToken.connect(addresses[8]).setMerkleRoot(root)
      ).to.be.revertedWith(
        "AccessControl: account 0xfabb0ac9d68b0b445fb7357272ff202c5651694a is missing role 0x0000000000000000000000000000000000000000000000000000000000000000"
      );
      await expect(await simpleToken.connect(admin1).setMerkleRoot(root)).to.be.ok;
    })

    it("should not allow setting multiple merkleRoots", async () => {
      const root = merkleTree.getHexRoot()
      await expect(await simpleToken.connect(admin1).setMerkleRoot(root)).to.be.ok;
      await expect(simpleToken.connect(admin2).setMerkleRoot(root)).to.be.revertedWith("Merkle root already set");
    })

    it("should emit a MerkleRootChanged Event on setting", async () => {
      const root = merkleTree.getHexRoot()
      await expect(
        simpleToken.connect(admin1).setMerkleRoot(root))
        .to.emit(simpleToken, 'MerkleRootChanged')
        .withArgs(root);
    })

    it("should allow people to claim their alloted tokens", async () => {
      const root = merkleTree.getHexRoot()
      await simpleToken.connect(admin1).setMerkleRoot(root)

      const expectedBalance = BigNumber.from("1000000000000000000000")
      const leaf = ethers.utils.solidityKeccak256(['address', 'uint256'], [await addresses[0].getAddress(), expectedBalance])
      const proof = merkleTree.getHexProof(leaf)
      await simpleToken.connect(addresses[0]).claimTokens(expectedBalance, proof);
      await expect(await simpleToken.balanceOf(await addresses[0].getAddress())).to.equal(expectedBalance);
    })
  })
})
