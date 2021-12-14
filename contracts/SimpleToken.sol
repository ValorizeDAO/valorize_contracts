//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.6;

import "./@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./@openzeppelin/contracts/access/AccessControl.sol";
// import "hardhat/console.sol";

/**
 * @title Simple Token
 * @author Javier Gonzalez
 * @dev Implementation of a Simple Token.
 */
contract SimpleToken is ERC20, AccessControl {
    uint256 immutable initialSupply;

    constructor(
        uint256 _initialSupply,
        string memory name,
        string memory symbol,
        address    vault, 
        address[] memory admins
    ) ERC20(name, symbol) {
        _mint(vault, _initialSupply);
        initialSupply = _initialSupply;
        for (uint i = 0; i < admins.length; i++) {
            _setupRole(DEFAULT_ADMIN_ROLE, admins[i]);
        }
    }
}
