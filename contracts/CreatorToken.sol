//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Stakeable.sol";
import { Sqrt } from "./Math.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CreatorToken
 * @author Javier Gonzalez
 * @dev Implementation of a Creator Token.
 * @notice Creator Tokens are the basis of valorize.app. They stake 
 *         some amount of ether that can be traded out at any point.
 */

contract CreatorToken is Stakeable, ERC20, Ownable {
  using Sqrt for uint;
  uint immutable initialSupply;

  constructor(uint256 _initialSupply, string memory name, string memory symbol) ERC20(name, symbol) {
    _mint(msg.sender, _initialSupply);
    initialSupply = _initialSupply;
  }

  function stakeForNewTokens() public payable {
    uint squareRootOfStakedAmount = address(this).balance.sqrt();
    console.log(squareRootOfStakedAmount);
		uint amountToMint = (squareRootOfStakedAmount / 1000000);
    _mint(msg.sender, ((amountToMint / 10 ) * 9));
    _mint(owner(), (amountToMint / 10));
		_minted(amountToMint);
  }

}
