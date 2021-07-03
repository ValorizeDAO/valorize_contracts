//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
/**
 * @title Stakeable
 * @author Javier Gonzalez
 * @dev Implementation of a stakeable interface for CreatorTokens. 
 *      Allows to mint new tokens by paying Ether into the generated contract.
 * @notice 
 */

abstract contract StakeableERC20 is ERC20, Ownable {
  uint public staked;
  constructor() { }
  
  function stake() public payable {
    staked += msg.value;
    _mint(msg.sender, msg.value * 1000);
  }

  function withdraw(uint amount) public {
    transferFrom(msg.sender, owner(), amount);
    uint _payout = staked / amount;
    payable(msg.sender).transfer(_payout);
  }
}
