import { ethers } from "hardhat";
import { BigNumber, Contract, Signer } from "ethers";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { getAddress } from "@ethersproject/address";
import { SimpleToken } from './../typechain/SimpleToken.d';
import { SimpleTokenFactory } from './../typechain/SimpleTokenFactory';
import { MerkleTree } from 'merkletreejs';
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

  describe("Airdrop", async () => {
    let merkleTree: MerkleTree
    beforeEach(async () => {
      await setupSimpleToken()
      const leaves = [
        [await addresses[0].getAddress(), BigNumber.from("1000000000000000000000")],
        [await addresses[1].getAddress(), BigNumber.from("2000000000000000000000")],
        [await addresses[2].getAddress(), BigNumber.from("2000000000000000000000")],
      ].map((baseNode: (String | BigNumber)[]) => ethers.utils.solidityKeccak256(['address', 'uint256'], [baseNode[0], baseNode[1]]))
      merkleTree = new MerkleTree(leaves, keccak_256, { sort: true })
    })

    it("should allow admin to set merkle Tree Root for airdrops", async () => {
      const root = merkleTree.getHexRoot()
      await expect(
        simpleToken.connect(addresses[8]).newAirdrop(root)
      ).to.be.revertedWith(
        "AccessControl: account 0xfabb0ac9d68b0b445fb7357272ff202c5651694a is missing role 0x0000000000000000000000000000000000000000000000000000000000000000"
      );
      await expect(await simpleToken.connect(admin1).newAirdrop(root)).to.be.ok;
    })

    it("should create an airdrop with a new index each time 'newAirdrop' is called", async () => {
      const root = merkleTree.getHexRoot()
      await expect(await simpleToken.numberOfAirdrops()).to.equal(BigNumber.from("0"));
      await simpleToken.connect(admin1).newAirdrop(root)
      await expect(await simpleToken.numberOfAirdrops()).to.equal(BigNumber.from("1"));
      await simpleToken.connect(admin2).newAirdrop(root)
      await expect(await simpleToken.numberOfAirdrops()).to.equal(BigNumber.from("2"));
    })

    it("should emit a MerkleRootChanged Event on setting", async () => {
      const root = merkleTree.getHexRoot()
      await expect(
        simpleToken.connect(admin1).newAirdrop(root))
        .to.emit(simpleToken, 'MerkleRootChanged')
        .withArgs(root);
    })

    it("should allow people to claim their alloted tokens", async () => {
      const root = merkleTree.getHexRoot()
      await simpleToken.connect(admin1).newAirdrop(root)

      const expectedBalance = BigNumber.from("1000000000000000000000")
      const leaf = ethers.utils.solidityKeccak256(['address', 'uint256'], [await addresses[0].getAddress(), expectedBalance])
      const proof = merkleTree.getHexProof(leaf)
      await simpleToken.connect(addresses[0]).claimTokens(0, expectedBalance, proof);
      await expect(await simpleToken.balanceOf(await addresses[0].getAddress())).to.equal(expectedBalance);
    })

    it("should emit a Claimed event when claiming airdropped tokens", async () => {
      const root = merkleTree.getHexRoot()
      await simpleToken.connect(admin1).newAirdrop(root)

      const expectedBalance = BigNumber.from("1000000000000000000000")
      const leaf = ethers.utils.solidityKeccak256(['address', 'uint256'], [await addresses[0].getAddress(), expectedBalance])
      const proof = merkleTree.getHexProof(leaf)
      await expect(simpleToken.connect(addresses[0]).claimTokens(0, expectedBalance, proof))
        .to.emit(simpleToken, 'Claimed')
        .withArgs(await addresses[0].getAddress(), expectedBalance);
    })

    it("should only allow an address to claim their alloted tokens once", async () => {
      const root = merkleTree.getHexRoot()
      await simpleToken.connect(admin1).newAirdrop(root)

      const expectedBalance = BigNumber.from("1000000000000000000000")
      const leaf = ethers.utils.solidityKeccak256(['address', 'uint256'], [await addresses[0].getAddress(), expectedBalance])
      const proof = merkleTree.getHexProof(leaf)
      await simpleToken.connect(addresses[0]).claimTokens(0, expectedBalance, proof);
      await expect(
        simpleToken.connect(addresses[0]).claimTokens(0, expectedBalance, proof)
      ).to.be.revertedWith("Tokens already claimed for this airdrop");
      await expect(await simpleToken.balanceOf(await addresses[0].getAddress())).to.equal(expectedBalance);
    })

    it("should allow you to get the airdrop information", async () => {
      const root = merkleTree.getHexRoot()
      await simpleToken.connect(admin1).newAirdrop(root)

      const airdropInfo = await simpleToken.connect(addresses[0]).getAirdropInfo(0);
      await expect(airdropInfo).to.equal(root);
    })
  })
})
