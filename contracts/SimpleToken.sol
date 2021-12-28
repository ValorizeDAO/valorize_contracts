//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.6;

import "./@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./@openzeppelin/contracts/access/AccessControl.sol";
import "./@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./@openzeppelin/contracts/utils/structs/BitMaps.sol";

//import "hardhat/console.sol";

/**
 * @title Simple Token
 * @author Javier Gonzalez
 * @dev Implementation of a Simple Token.
 */
contract SimpleToken is ERC20, AccessControl {
    using BitMaps for BitMaps.BitMap;

    uint256 public immutable initialSupply;

    struct Airdrop {
			bytes32 merkleRoot;
			BitMaps.BitMap claimed;
    }
    event MerkleRootChanged(bytes32 merkleRoot);
    event Claimed(address claimant, uint256 amount);

    uint256 public numberOfAirdrops = 0;
    mapping (uint => Airdrop) airdrops;

		/**
     * @dev Constructor.
     * @param _freeSupply The number of tokens to issue to the contract deployer.
     * @param _airdropSupply The number of tokens to reserve for the airdrop.
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
		
		function newAirdrop(bytes32 _merkleRoot) public onlyRole(DEFAULT_ADMIN_ROLE) returns (uint256 airdropId) {
				airdropId = numberOfAirdrops;
				Airdrop storage _drop = airdrops[airdropId];
				_drop.merkleRoot = _merkleRoot;
        emit MerkleRootChanged(_merkleRoot);
				numberOfAirdrops += 1;
    }

		function isClaimed(uint256 airdropIndex, uint256 claimIndex) public view returns (bool) {
        return airdrops[airdropIndex].claimed.get(claimIndex);
		}
		
		function claimTokens(uint256 airdropIndex, uint256 claimAmount, bytes32[] calldata merkleProof) external {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, claimAmount));
        (bool valid, uint256 claimIndex) = MerkleProof.verify(merkleProof, airdrops[airdropIndex].merkleRoot, leaf);
				require(valid, "Failed to verify proof");
				require(!isClaimed(airdropIndex, claimIndex), "Tokens already claimed for this airdrop");
				airdrops[airdropIndex].claimed.set(claimIndex);
        
        emit Claimed(msg.sender, claimAmount);

        _transfer(address(this), msg.sender, claimAmount);
    }

		function getAirdropInfo(uint256 _index) public view returns (bytes32) {
			return airdrops[_index].merkleRoot;
		}
}
