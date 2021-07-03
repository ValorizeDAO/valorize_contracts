//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Stakeable.sol";
/**
 * @title CreatorToken
 * @author Javier Gonzalez
 * @dev Implementation of a Creator Token.
 * @notice Creator Tokens are the basis of valorize.app. They stake 
 *         some amount of ether that can be traded out at any point.
 */

contract CreatorToken is StakeableERC20 {
  constructor(uint256 initialSupply, string memory name, string memory symbol) ERC20(name, symbol) {
      _mint(msg.sender, initialSupply);
  }
}
