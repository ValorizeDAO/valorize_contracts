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
    const setMerkleRoot = async () => {
      const root = merkleTree.getHexRoot()
      await simpleToken.connect(admin1).newAirdrop(root, BigNumber.from("100000000000"))
    }

    it("should allow admin to set merkle Tree Root for airdrops", async () => {
      const root = merkleTree.getHexRoot()
      await expect(
        simpleToken.connect(addresses[8]).newAirdrop(root, BigNumber.from("100000000000"))
      ).to.be.revertedWith(
        "AccessControl: account 0xfabb0ac9d68b0b445fb7357272ff202c5651694a is missing role 0x0000000000000000000000000000000000000000000000000000000000000000"
      );
      expect(await simpleToken.connect(admin1).newAirdrop(root, BigNumber.from("100000000000"))).to.be.ok;
    })

    it("should emit a MerkleRootChanged Event on setting", async () => {
      const root = merkleTree.getHexRoot()
      await ethers.provider.send("evm_mine", [200000000000]);
      await expect(
        simpleToken.connect(admin1).newAirdrop(root, BigNumber.from("100000000000")))
        .to.emit(simpleToken, 'NewAirdrop')
        .withArgs(0, root, BigNumber.from("300000000001"));
    })

    it("should allow people to claim their alloted tokens", async () => {
      await setMerkleRoot();

      const expectedBalance = BigNumber.from("1000000000000000000000")
      const leaf = ethers.utils.solidityKeccak256(['address', 'uint256'], [await addresses[0].getAddress(), expectedBalance])
      const proof = merkleTree.getHexProof(leaf)
      await simpleToken.connect(addresses[0]).claimTokens(expectedBalance, proof);
      expect(await simpleToken.balanceOf(await addresses[0].getAddress())).to.equal(expectedBalance);
    })

    it("should emit a Claimed event when claiming airdropped tokens", async () => {
      await setMerkleRoot();

      const expectedBalance = BigNumber.from("1000000000000000000000")
      const leaf = ethers.utils.solidityKeccak256(['address', 'uint256'], [await addresses[0].getAddress(), expectedBalance])
      const proof = merkleTree.getHexProof(leaf)
      await expect(simpleToken.connect(addresses[0]).claimTokens(expectedBalance, proof))
        .to.emit(simpleToken, 'Claimed')
        .withArgs(await addresses[0].getAddress(), expectedBalance);
    })

    it("should only allow an address to claim their alloted tokens once", async () => {
      await setMerkleRoot();

      const expectedBalance = BigNumber.from("1000000000000000000000")
      const leaf = ethers.utils.solidityKeccak256(['address', 'uint256'], [await addresses[0].getAddress(), expectedBalance])
      const proof = merkleTree.getHexProof(leaf)
      await simpleToken.connect(addresses[0]).claimTokens(expectedBalance, proof);
      await expect(
        simpleToken.connect(addresses[0]).claimTokens(expectedBalance, proof)
      ).to.be.revertedWith("Tokens already claimed for this airdrop");
      expect(await simpleToken.balanceOf(await addresses[0].getAddress())).to.equal(expectedBalance);
    })

    it("should allow you to get the airdrop information", async () => {
      await setMerkleRoot()

      const { root } = await simpleToken.connect(addresses[0]).getAirdropInfo(0);
      expect(root).to.equal(merkleTree.getHexRoot());
    })
  })
  describe("Sweep", async () => {
    let merkleTree: MerkleTree
    beforeEach(async () => {
      await setupSimpleToken()
      const leaves = [
        [await addresses[0].getAddress(), BigNumber.from("1000000000000000000000")],
        [await addresses[1].getAddress(), BigNumber.from("2000000000000000000000")],
        [await addresses[2].getAddress(), BigNumber.from("2000000000000000000000")],
      ].map((baseNode: (String | BigNumber)[]) => ethers.utils.solidityKeccak256(['address', 'uint256'], [baseNode[0], baseNode[1]]))
      merkleTree = new MerkleTree(leaves, keccak_256, { sort: true })
      const root = merkleTree.getHexRoot()
      await simpleToken.connect(admin1).newAirdrop(root, BigNumber.from("100000000000"))
    })
    it("should set isComplete to false on creation", async () => {
      const { isComplete } = await simpleToken.connect(addresses[0]).getAirdropInfo(0);
      expect(isComplete).to.equal(false);
    })

    it("should not allow you to create a new airdrop if the previous one is not finished", async () => {
      await expect(
        simpleToken.connect(admin1).newAirdrop(merkleTree.getHexRoot(), BigNumber.from("100000000000"))
      ).to.be.revertedWith("Airdrop currently active, creation failed");
    })

    it("should only allow you to finish an airdrop if the claimperiod has ended", async () => {
      await expect(
        simpleToken.connect(admin1).completeAirdrop()
      ).to.be.revertedWith("Airdrop claim period still active");

      await ethers.provider.send("evm_increaseTime", [100000000010])
      await ethers.provider.send("evm_mine", [])
      await expect(
       simpleToken.connect(admin1).completeAirdrop()
      ).to.be.ok
    })

    it("should emit an AirdropComplete event when completing an airdrop", async () => {
      await ethers.provider.send("evm_increaseTime", [100000000010])
      await ethers.provider.send("evm_mine", [])
      await expect(
       simpleToken.connect(admin1).completeAirdrop()
        ).to.emit(simpleToken, 'AirdropComplete')
        .withArgs(0);
    })

    it("should create an airdrop with a new index each time 'newAirdrop' is called", async () => {
      const root = merkleTree.getHexRoot()
      expect(await simpleToken.numberOfAirdrops()).to.equal(BigNumber.from("1"));

      await ethers.provider.send("evm_increaseTime", [100000000010])
      await ethers.provider.send("evm_mine", [])
      await simpleToken.connect(admin1).completeAirdrop()

      await simpleToken.connect(admin1).newAirdrop(root, BigNumber.from("0"))
      expect(await simpleToken.numberOfAirdrops()).to.equal(BigNumber.from("2"));

      await simpleToken.connect(admin1).completeAirdrop()

      await simpleToken.connect(admin2).newAirdrop(root, BigNumber.from("0"))
      await expect(await simpleToken.numberOfAirdrops()).to.equal(BigNumber.from("3"));
    })

    it("should allow you to sweep the leftover funds if no airdrop is running", async () => {
      await expect(
        simpleToken.connect(admin1).sweepTokens(await admin1.getAddress())
      ).to.be.revertedWith("Cannot sweep until airdrop is finished");

      await ethers.provider.send("evm_increaseTime", [100000000010])
      await ethers.provider.send("evm_mine", [])
      await simpleToken.connect(admin1).completeAirdrop()

      expect(await simpleToken.balanceOf(await admin1.getAddress())).to.equal(BigNumber.from(0));
      await simpleToken.connect(admin1).sweepTokens(await admin1.getAddress());
      expect(await simpleToken.balanceOf(await admin1.getAddress())).to.equal(AIRDROP_SUPPLY);
    })

    it("should emit a Sweep event when sweeping funds to an address", async () => {
      await ethers.provider.send("evm_increaseTime", [100000000010])
      await ethers.provider.send("evm_mine", [])
      await simpleToken.connect(admin1).completeAirdrop()
      await expect(
          simpleToken.connect(admin1).sweepTokens(await admin1.getAddress())
        ).to.emit(simpleToken, 'Sweep')
        .withArgs(await admin1.getAddress(), AIRDROP_SUPPLY);
    })
  })
})
