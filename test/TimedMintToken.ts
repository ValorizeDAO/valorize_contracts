import { ethers } from "hardhat";
import { BigNumber as BN, Contract, Signer } from "ethers";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { getAddress } from "@ethersproject/address";
import { TimedMintToken } from '../typechain/TimedMintToken.d';
import { TimedMintTokenFactory } from '../typechain/TimedMintTokenFactory';
import { MerkleTree } from 'merkletreejs';
import { keccak_256 } from "js-sha3";

chai.use(solidity);

const { expect } = chai;
const AMOUNT_FOR_VAULT = BN.from("4000000000000000000000000") 
const AMOUNT_FOR_AIRDROP = BN.from("1000000000000000000000000") 
const TOTAL_INITIAL_SUPPLY = AMOUNT_FOR_VAULT.add(AMOUNT_FOR_AIRDROP)

describe("Timed Mint Token", () => {
  let timedMintToken: TimedMintToken,
      deployer: Signer,
      admin1: Signer,
      admin2: Signer,
      vault: Signer,
      minter: Signer,
      addresses: Signer[],
      mintCap: BN,
      timeDelay: BN

  const setupTimedMint = async () => {
    [deployer, admin1, admin2, vault, minter, ...addresses] = await ethers.getSigners();
    const vaultAddress = await vault.getAddress()
    mintCap = BN.from("50000000000000000000000"),
    timeDelay = BN.from("31536000")
    timedMintToken =  await new TimedMintTokenFactory(deployer).deploy(
        AMOUNT_FOR_VAULT,
        AMOUNT_FOR_AIRDROP,
        vaultAddress,
        timeDelay,
        mintCap,
        "TimedMintToken",
        "TIME",
        [await admin1.getAddress(), await admin2.getAddress()]
    );
    await timedMintToken.deployed();
  }
  const setupTimedMintWithMinter = async () => {
    await setupTimedMint();
    await timedMintToken
      .connect(admin1)
      .setMinter(await minter.getAddress())
  }
  describe("Deployment", () => {
    beforeEach(setupTimedMintWithMinter)

    it("should deploy", async () => {
      expect(timedMintToken).to.be.ok;
    })

    it("should set the mintCap", async () => {
      const actualMintCap = await timedMintToken.mintCap();
      expect(actualMintCap).to.equal(mintCap);
    })

    it("should set the time delay", async () => {
      var actualDelay = await timedMintToken.timeDelay();
      expect(actualDelay).to.equal(timeDelay);
    })

    it("should set the time until next mint", async () => {
      const delay = BN.from("1000");
      const delayedTUNM = await timedMintToken.nextAllowedMintTime();
      await ethers.provider.send("evm_increaseTime", [100000000010])
      await ethers.provider.send("evm_mine", [])
      const currentTUNM = await timedMintToken.nextAllowedMintTime();
      expect(delayedTUNM).to.equal(currentTUNM);
    })

    it("should sets an active time delay on constructor", async () => {
      const timeDelayIsActive = await timedMintToken.timeDelayActive();
      expect(timeDelayIsActive).to.equal(true);
    })

  })
  describe("Minter Role", async () => {
    beforeEach(setupTimedMint)
    it("should not allow anyone to mint until minter is set", async () => {
        await ethers.provider.send("evm_increaseTime", [31536001])
        await ethers.provider.send("evm_mine", [])
        await expect(
          timedMintToken.connect(minter).mint(BN.from("10000"))
        ).to.be.revertedWith("Only Minter can call")
    })

    it("should store the minter publically", async () => {
        expect(
          await timedMintToken.minter()
        ).to.equal(
          ethers.utils.getAddress("0x0000000000000000000000000000000000000000")
        )
        await timedMintToken.connect(admin1).setMinter(await minter.getAddress())
        const expectedMinter = await timedMintToken.minter()
        expect(await minter.getAddress()).to.equal(expectedMinter)
    })

    it("should allow admins to remove minter role", async () => {
        await timedMintToken.connect(admin1).setMinter(await minter.getAddress())
        await ethers.provider.send("evm_increaseTime", [31536001])
        await ethers.provider.send("evm_mine", [])
        await timedMintToken.connect(minter).mint(BN.from("10000"))
        await timedMintToken.connect(admin1).setMinter("0x0000000000000000000000000000000000000000");
        const newMinter = await timedMintToken.minter();
        expect(newMinter).to.equal(
          ethers.utils.getAddress("0x0000000000000000000000000000000000000000")
        )
    })

    it("should emit a 'MinterUpdated' event when called", async () => {
      await expect(
       timedMintToken.connect(admin1).setMinter(await minter.getAddress())
      ).to.emit(timedMintToken, 'MinterUpdated')
        .withArgs("0x0000000000000000000000000000000000000000", await minter.getAddress());
      await expect(
        timedMintToken.connect(admin1).setMinter(await addresses[3].getAddress())
      ).to.emit(timedMintToken, 'MinterUpdated')
        .withArgs(await minter.getAddress(), await addresses[3].getAddress());
    })

  })

  describe("Minting", async () => {
    beforeEach(setupTimedMintWithMinter)
    it("should not allow you to mint until 'nextAllowedMintTime' has passed", async () => {
        await timedMintToken.connect(admin1).setMinter(await minter.getAddress())
        await expect(
          timedMintToken.connect(minter).mint(BN.from("10000"))
        ).to.be.revertedWith("ERC20TimedMint: Cannot mint yet")
    })

    it("should allow minter to mint tokens if 'nextAllowedMintTime' is in the past", async () => {
        await ethers.provider.send("evm_increaseTime", [31536001])
        await ethers.provider.send("evm_mine", [])
        await timedMintToken.connect(admin1).setMinter(await minter.getAddress())
        await timedMintToken.connect(minter).mint(BN.from("10000"))
        const totalSupply = await timedMintToken.totalSupply();
        expect(totalSupply).to.equal(TOTAL_INITIAL_SUPPLY.add(BN.from("10000")))
    })

    it("should send newly minted tokens to the vault", async () => {
        await timedMintToken.connect(admin1).setMinter(await minter.getAddress())
        await ethers.provider.send("evm_increaseTime", [31536001])
        await ethers.provider.send("evm_mine", [])
        const initialVaultBalance = await timedMintToken.balanceOf(await vault.getAddress());
        await timedMintToken.connect(minter).mint(BN.from("10000"))
        const finalVaultBalance = await timedMintToken.balanceOf(await vault.getAddress());
        expect(finalVaultBalance).to.equal(initialVaultBalance.add(BN.from("10000")))
    })

    it("should allow admins to change the vault", async () => {
        await timedMintToken.connect(admin1).updateVault(await addresses[0].getAddress())
        expect(await timedMintToken.vault()).to.equal(await addresses[0].getAddress())
    })

    it("should emit a 'VaultUpdated' event when vault is updated", async () => {
        await expect(
          timedMintToken.connect(admin1).updateVault(await addresses[0].getAddress())
        ).to.emit(timedMintToken, 'VaultUpdated')
          .withArgs(await vault.getAddress(), await addresses[0].getAddress());
    })

  })

  describe("Mint Guard", async () => {
    beforeEach(setupTimedMintWithMinter)

    it("should only be callable by admin", async () => {
        await timedMintToken.connect(admin1).setMinter(await minter.getAddress())
        await ethers.provider.send("evm_increaseTime", [31536002])
        await ethers.provider.send("evm_mine", [])
        await expect(
          timedMintToken.connect(addresses[3]).setMintGuard(BN.from("10000"), BN.from("1000"))
        ).to.be.revertedWith("AccessControl: account 0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f is missing role 0x0000000000000000000000000000000000000000000000000000000000000000")
    })

    it("should revert if called when 'nextAllowedMintTime' is in the future", async () => {
    })


    it("should update minting parameters when called", async () => {
    })

    it("should emit a 'NewMintGuard' event when called", async () => {
    })
  })
  describe("Inherits Timed Mint", () => {
    beforeEach(setupTimedMintWithMinter)
    describe("Timed Minting", () => {
      beforeEach(setupTimedMintWithMinter)

      it("should not allow you to mint when time delay is active and current time is less than time until next mint", async () => {
        const cap = BN.from("50000");
        const delay = BN.from("1000");
        const mintedTokenAmount = BN.from("1000");
        const contractAddress = await timedMintToken.resolvedAddress;
        await expect(timedMintToken.connect(minter).mint(mintedTokenAmount)
      ).to.be.revertedWith("ERC20: Cannot mint yet");
      })

      it("should allow you to mint if current time is more than time until next mint", async () => {
        const amountToMint = BN.from("20000");
        const contractAddress = await timedMintToken.resolvedAddress;
        await ethers.provider.send("evm_increaseTime", [31536001])
        await ethers.provider.send("evm_mine", [])
        const newMint = await timedMintToken.connect(minter).mint(amountToMint);
        const totalSupply = await timedMintToken.totalSupply();
        expect(
          amountToMint.add(TOTAL_INITIAL_SUPPLY)
        ).to.equal(totalSupply);
      })

      it("should not allow you to mint if current time is less than time until next mint", async () => {
        const mintedTokenAmount = BN.from("10000");
        const contractAddress = await timedMintToken.resolvedAddress;
        await expect(timedMintToken.connect(minter).mint(mintedTokenAmount)
      ).to.be.revertedWith("ERC20: Cannot mint yet");
      })

      it("should not allow you to mint if attempting to mint higher than mint cap", async () => {
        const contractAddress = await timedMintToken.resolvedAddress;
        await ethers.provider.send("evm_increaseTime", [100000000010])
        await ethers.provider.send("evm_mine", [])
        await expect(
          timedMintToken.connect(minter).mint(mintCap.add(BN.from("3000000")))
        ).to.be.revertedWith("ERC20: Mint exceeds maximum amount");
      })
    })
  })
  describe("Inherits Airdroppable", async () => {
    describe("Can Create Airdrops", async () => {
      let merkleTree: MerkleTree
      beforeEach(async () => {
        await setupTimedMintWithMinter()
        const leaves = [
          [await addresses[0].getAddress(), BN.from("1000000000000000000000")],
          [await addresses[1].getAddress(), BN.from("2000000000000000000000")],
          [await addresses[2].getAddress(), BN.from("2000000000000000000000")],
        ].map((baseNode: (String | BN)[]) => ethers.utils.solidityKeccak256(['address', 'uint256'], [baseNode[0], baseNode[1]]))
        merkleTree = new MerkleTree(leaves, keccak_256, { sort: true })
      })
      const setMerkleRoot = async () => {
        const root = merkleTree.getHexRoot()
        await timedMintToken.connect(admin1).newAirdrop(root, BN.from("100000000000"))
      }

      it("should allow admin to set merkle Tree Root for airdrops", async () => {
        const root = merkleTree.getHexRoot()
        await expect(
          timedMintToken.connect(addresses[8]).newAirdrop(root, BN.from("100000000000"))
        ).to.be.revertedWith(
          "AccessControl: account 0x1cbd3b2770909d4e10f157cabc84c7264073c9ec is missing role 0x0000000000000000000000000000000000000000000000000000000000000000"
        );
        expect(await timedMintToken.connect(admin1).newAirdrop(root, BN.from("100000000000"))).to.be.ok;
      })

      it("should emit a MerkleRootChanged Event on setting", async () => {
        const root = merkleTree.getHexRoot()
        const blockTimestamp = "13000000000000"
        const timeDelay = BN.from("100000000000")
        const expectedAirdropEnd = BN.from(blockTimestamp).add(timeDelay).add(1)
        await ethers.provider.send("evm_mine", [parseInt(blockTimestamp, 10)]);
        await expect(
          timedMintToken.connect(admin1).newAirdrop(root, timeDelay))
          .to.emit(timedMintToken, 'NewAirdrop')
          .withArgs(0, root, expectedAirdropEnd);
      })

      it("should allow people to claim their alloted tokens", async () => {
        await setMerkleRoot();

        const expectedBalance = BN.from("1000000000000000000000")
        const leaf = ethers.utils.solidityKeccak256(['address', 'uint256'], [await addresses[0].getAddress(), expectedBalance])
        const proof = merkleTree.getHexProof(leaf)
        await timedMintToken.connect(addresses[0]).claimTokens(expectedBalance, proof);
        expect(await timedMintToken.balanceOf(await addresses[0].getAddress())).to.equal(expectedBalance);
      })

      it("should emit a Claimed event when claiming airdropped tokens", async () => {
        await setMerkleRoot();

        const expectedBalance = BN.from("1000000000000000000000")
        const leaf = ethers.utils.solidityKeccak256(['address', 'uint256'], [await addresses[0].getAddress(), expectedBalance])
        const proof = merkleTree.getHexProof(leaf)
        await expect(timedMintToken.connect(addresses[0]).claimTokens(expectedBalance, proof))
          .to.emit(timedMintToken, 'Claimed')
          .withArgs(await addresses[0].getAddress(), expectedBalance);
      })

      it("should only allow an address to claim their alloted tokens once", async () => {
        await setMerkleRoot();

        const expectedBalance = BN.from("1000000000000000000000")
        const leaf = ethers.utils.solidityKeccak256(['address', 'uint256'], [await addresses[0].getAddress(), expectedBalance])
        const proof = merkleTree.getHexProof(leaf)
        await timedMintToken.connect(addresses[0]).claimTokens(expectedBalance, proof);
        await expect(
          timedMintToken.connect(addresses[0]).claimTokens(expectedBalance, proof)
        ).to.be.revertedWith("Tokens already claimed for this airdrop");
        expect(await timedMintToken.balanceOf(await addresses[0].getAddress())).to.equal(expectedBalance);
      })

      it("should allow you to get the airdrop information", async () => {
        await setMerkleRoot()

        const { root } = await timedMintToken.connect(addresses[0]).getAirdropInfo(0);
        expect(root).to.equal(merkleTree.getHexRoot());
      })
    })
    describe("Sweep", async () => {
      let merkleTree: MerkleTree
      beforeEach(async () => {
        await setupTimedMint()
        const leaves = [
          [await addresses[0].getAddress(), BN.from("1000000000000000000000")],
          [await addresses[1].getAddress(), BN.from("2000000000000000000000")],
          [await addresses[2].getAddress(), BN.from("2000000000000000000000")],
        ].map((baseNode: (String | BN)[]) => ethers.utils.solidityKeccak256(['address', 'uint256'], [baseNode[0], baseNode[1]]))
        merkleTree = new MerkleTree(leaves, keccak_256, { sort: true })
        const root = merkleTree.getHexRoot()
        await timedMintToken.connect(admin1).newAirdrop(root, BN.from("100000000000"))
      })
      it("should set isComplete to false on creation", async () => {
        const { isComplete } = await timedMintToken.connect(addresses[0]).getAirdropInfo(0);
        expect(isComplete).to.equal(false);
      })

      it("should not allow you to create a new airdrop if the previous one is not finished", async () => {
        await expect(
          timedMintToken.connect(admin1).newAirdrop(merkleTree.getHexRoot(), BN.from("100000000000"))
        ).to.be.revertedWith("Airdrop currently active, creation failed");
      })

      it("should only allow you to finish an airdrop if the claimperiod has ended", async () => {
        await expect(
          timedMintToken.connect(admin1).completeAirdrop()
        ).to.be.revertedWith("Airdrop claim period still active");

        await ethers.provider.send("evm_increaseTime", [100000000010])
        await ethers.provider.send("evm_mine", [])
        await expect(
         timedMintToken.connect(admin1).completeAirdrop()
        ).to.be.ok
      })

      it("should emit an AirdropComplete event when completing an airdrop", async () => {
        await ethers.provider.send("evm_increaseTime", [100000000010])
        await ethers.provider.send("evm_mine", [])
        await expect(
         timedMintToken.connect(admin1).completeAirdrop()
          ).to.emit(timedMintToken, 'AirdropComplete')
          .withArgs(0);
      })

      it("should create an airdrop with a new index each time 'newAirdrop' is called", async () => {
        const root = merkleTree.getHexRoot()
        expect(await timedMintToken.numberOfAirdrops()).to.equal(BN.from("1"));

        await ethers.provider.send("evm_increaseTime", [100000000010])
        await ethers.provider.send("evm_mine", [])
        await timedMintToken.connect(admin1).completeAirdrop()

        await timedMintToken.connect(admin1).newAirdrop(root, BN.from("0"))
        expect(await timedMintToken.numberOfAirdrops()).to.equal(BN.from("2"));

        await timedMintToken.connect(admin1).completeAirdrop()

        await timedMintToken.connect(admin2).newAirdrop(root, BN.from("0"))
        await expect(await timedMintToken.numberOfAirdrops()).to.equal(BN.from("3"));
      })

      it("should allow you to sweep the leftover funds if no airdrop is running", async () => {
        await expect(
          timedMintToken.connect(admin1).sweepTokens(await admin1.getAddress())
        ).to.be.revertedWith("Cannot sweep until airdrop is finished");

        await ethers.provider.send("evm_increaseTime", [100000000010])
        await ethers.provider.send("evm_mine", [])
        await timedMintToken.connect(admin1).completeAirdrop()

        expect(await timedMintToken.balanceOf(await admin1.getAddress())).to.equal(BN.from(0));
        await timedMintToken.connect(admin1).sweepTokens(await admin1.getAddress());
        expect(await timedMintToken.balanceOf(await admin1.getAddress())).to.equal(AMOUNT_FOR_AIRDROP);
      })

      it("should emit a Sweep event when sweeping funds to an address", async () => {
        await ethers.provider.send("evm_increaseTime", [100000000010])
        await ethers.provider.send("evm_mine", [])
        await timedMintToken.connect(admin1).completeAirdrop()
        await expect(
            timedMintToken.connect(admin1).sweepTokens(await admin1.getAddress())
          ).to.emit(timedMintToken, 'Sweep')
          .withArgs(await admin1.getAddress(), AMOUNT_FOR_AIRDROP);
      })
    })
  })
})
