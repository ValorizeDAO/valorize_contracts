//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.6;

import "./@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./@openzeppelin/contracts/access/AccessControl.sol";
import "./@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
//import "hardhat/console.sol";

/**
 * @title Simple Token
 * @author Javier Gonzalez
 * @dev Implementation of a Simple Token.
 */
contract SimpleToken is ERC20, AccessControl {
    uint256 immutable initialSupply;
    bytes32 public merkleRoot;

    event MerkleRootChanged(bytes32 merkleRoot);

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
		
		function setMerkleRoot(bytes32 _merkleRoot) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(merkleRoot == bytes32(0), "Merkle root already set");
        merkleRoot = _merkleRoot;
        emit MerkleRootChanged(_merkleRoot);
    }
		
		function claimTokens(uint256 amount, bytes32[] calldata merkleProof) external {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        (bool valid, uint256 index) = MerkleProof.verify(merkleProof, merkleRoot, leaf);
				//require(valid, "Failed to verify proof");
				//require(!isClaimed(index), "Tokens already claimed");
        
        //emit Claim(msg.sender, amount);

        //_transfer(address(this), msg.sender, amount));
    }
}
