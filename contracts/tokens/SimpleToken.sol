//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/structs/BitMaps.sol";
import "../utils/MerkleProof.sol";

//import "hardhat/console.sol";

/**
 * @title Simple Token
 * @author Javier Gonzalez
 * @dev Implementation of a Simple Token.
 */
contract SimpleToken is ERC20, AccessControl, Airdroppable {
    using BitMaps for BitMaps.BitMap;

    uint256 public immutable initialSupply;

    struct Airdrop {
			bytes32 merkleRoot;
			bool isComplete;
			uint256 claimPeriodEnds;
			BitMaps.BitMap claimed;
    }
    event NewAirdrop(uint256 index, bytes32 merkleRoot, uint256 claimPeriod);
    event Claimed(address claimant, uint256 amount);
    event AirdropComplete(uint256 index);
    event Sweep(address destination, uint256 amount);

    uint256 public numberOfAirdrops = 0;
    mapping (uint => Airdrop) airdrops;

		/**
		 * @notice Launches contract, mints tokens for a vault and for an airdrop
     * @param _freeSupply The number of tokens to issue to the contract deployer
     * @param _airdropSupply The number of tokens to reserve for the airdrop
     * @param vault The address to send the free supply to
     * @param name The ERC20 token name
     * @param symbol The ERC20 token symbol
     * @param admins A list of addresses that are able to call admin functions
     */
    constructor(
        uint256   _freeSupply,
        uint256   _airdropSupply,
        address   vault,
        string    memory name,
        string    memory symbol,
        address[] memory admins
    ) ERC20(name, symbol) {
        _mint(vault, _freeSupply);
        _mint(address(this), _airdropSupply);
        initialSupply = _freeSupply + _airdropSupply;
        for (uint i = 0; i < admins.length; i++) {
            _setupRole(DEFAULT_ADMIN_ROLE, admins[i]);
        }
    }

		function getInitialSupply() public view returns (uint256) {
			  return initialSupply;
		}

		/**
		 * @notice Creates a new airdrop if there is no other airdrop active. 
		 * @dev Does not verify if the contract has enough liquidity to fullfill the airdrop, this must be done off-chain.
		 * @param claimAmount this must be calculated off chain and can be verified with the merkleProof
		 * @param merkleProof calculated using MerkleProof.js
		 */
		function newAirdrop(bytes32 _merkleRoot, uint256 _timeLimit) public onlyRole(DEFAULT_ADMIN_ROLE) returns (uint256 airdropId) {
				airdropId = numberOfAirdrops;
				if(numberOfAirdrops > 0) {
						require(airdrops[numberOfAirdrops - 1].isComplete, "Airdrop currently active, creation failed");
				}
				Airdrop storage _drop = airdrops[airdropId];
				_drop.merkleRoot = _merkleRoot;
				_drop.claimPeriodEnds = block.timestamp + _timeLimit;
        emit NewAirdrop(airdropId, _merkleRoot, _drop.claimPeriodEnds);
				numberOfAirdrops += 1;
    }

		function isClaimed(uint256 airdropIndex, uint256 claimIndex) public view returns (bool) {
        return airdrops[airdropIndex].claimed.get(claimIndex);
		}

		/**
		 * @notice Sweep the tokens from airdrop to user. User needs to know the amount that is alloted to them.
		 * @dev Uses merkle proofs to verify that the amount is equivalent to the user's claim
		 * @param claimAmount this must be calculated off chain and can be verified with the merkleProof
		 * @param merkleProof calculated using MerkleProof.js
		 */
		function claimTokens(uint256 claimAmount, bytes32[] calldata merkleProof) external {
				uint256 airdropIndex = numberOfAirdrops - 1;
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, claimAmount));
        (bool valid, uint256 claimIndex) = MerkleProof.verify(merkleProof, airdrops[airdropIndex].merkleRoot, leaf);
				require(valid, "Failed to verify proof");
				require(!isClaimed(airdropIndex, claimIndex), "Tokens already claimed for this airdrop");
				airdrops[airdropIndex].claimed.set(claimIndex);

        emit Claimed(msg.sender, claimAmount);

        _transfer(address(this), msg.sender, claimAmount);
    }

		function getAirdropInfo(uint256 _index) public view returns (bytes32 root, uint256 claimPeriodEnds, bool isComplete) {
				root = airdrops[_index].merkleRoot;
				isComplete = airdrops[_index].isComplete;
				claimPeriodEnds = airdrops[_index].claimPeriodEnds;
		}


		/**
		 * @notice Mark airdrop as completed which allows sweeping of the funds, and creating a new airdrop.
		 * @dev Requires claimPeriod of airdrop to have finished
		 */
		function completeAirdrop() external {
				require(numberOfAirdrops > 0, "No airdrops active");
			  uint256 claimPeriodEnds = airdrops[numberOfAirdrops - 1].claimPeriodEnds;
			  require(block.timestamp > claimPeriodEnds, "Airdrop claim period still active");
				airdrops[numberOfAirdrops - 1].isComplete = true;
				emit AirdropComplete(numberOfAirdrops - 1);
		}

		/**
		 * @notice Sweeps leftover tokens from airdrop to a destination address
		 * @dev Requires last airdrop to have finished
		 * @param _destination to send funds to
		 */
		function sweepTokens(address _destination) external onlyRole(DEFAULT_ADMIN_ROLE) {
				require(numberOfAirdrops > 0, "No airdrops active");
			  require(airdrops[numberOfAirdrops - 1].isComplete, "Cannot sweep until airdrop is finished");
				uint256 amountToSweep = balanceOf(address(this));
        _transfer(address(this), _destination, amountToSweep);
				emit Sweep(_destination, amountToSweep);
		}
}
