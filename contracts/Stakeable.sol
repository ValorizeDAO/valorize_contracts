//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;


/**
 * @title Stakeable
 * @author Javier Gonzalez
 * @dev Implementation of a stakeable interface for CreatorTokens. 
 *      Allows to mint new tokens by paying Ether into the generated contract.
 */

abstract contract Stakeable {
  uint public totalMinted;
  constructor() { }
  
  function _minted(uint amount) public {
    totalMinted += amount;
  }
}
