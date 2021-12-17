//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.6;

import "./@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./@openzeppelin/contracts/access/AccessControl.sol";
//import "hardhat/console.sol";

/**
 * @title Simple Token
 * @author Javier Gonzalez
 * @dev Implementation of a Simple Token.
 */
contract SimpleToken is ERC20, AccessControl {
    uint256 immutable initialSupply;

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
}
