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
  uint founderPercentage = 10;

  constructor(uint256 _initialSupply, string memory name, string memory symbol) ERC20(name, symbol) {
    _mint(msg.sender, _initialSupply);
    initialSupply = _initialSupply;
  }

  event Minted(
    address buyer, 
    uint amountMinted, 
    uint amountDistributedToBuyer, 
    uint amountDistributedToOwner 
  );

  function stakeForNewTokens() public payable {
    uint squareRootOfStakedAmount = address(this).balance.sqrt();
		uint amountToMint = (squareRootOfStakedAmount / 10000);

    if(amountToMint == 0) revert("not enough ETH for minting a token");

    uint amountForSender = ((amountToMint * (100 - founderPercentage) / 100 ));
    uint amountForOwner = (amountToMint * founderPercentage) / 100 ;

    _mint(msg.sender,  amountForSender);
    _mint(owner(), amountForOwner);
    uint minted = amountForSender + amountForOwner;
		_minted(minted);// Because of rounding errors, this is preferable than using amountToMint
    emit Minted(msg.sender, minted, amountForSender, amountForOwner);
  }

  function changeFounderPercentage(uint _newPercentage) onlyOwner public {
    require(_newPercentage < 100);
    founderPercentage = _newPercentage;
  }

}
