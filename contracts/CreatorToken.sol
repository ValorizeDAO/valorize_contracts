//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Stakeable.sol";
import { Sqrt } from "./Math.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title CreatorToken
 * @author Javier Gonzalez
 * @dev Implementation of a Creator Token.
 * @notice Creator Tokens are the basis of valorize.app. They stake 
 *         some amount of ether that can be traded out at any point.
 */

contract CreatorToken is Stakeable, ERC20, Ownable {
  using Sqrt for uint;
  using SafeMath for uint256;
  uint immutable initialSupply;
  uint8 public founderPercentage;

  constructor(uint256 _initialSupply, string memory name, string memory symbol) ERC20(name, symbol) {
    _mint(msg.sender, _initialSupply);
    initialSupply = _initialSupply;
    _minted(_initialSupply);
    founderPercentage = 10;
  }

  event Minted(
    address buyer, 
    uint amountMinted, 
    uint amountDistributedToBuyer, 
    uint amountDistributedToOwner 
  );

  function stakeForNewTokens() external payable {
    uint amountToMint = (address(this).balance / (totalMinted * 1000000)).sqrt();

    if(amountToMint == 0) revert("not enough ETH for minting a token");

    uint amountForSender = ((amountToMint * (100 - founderPercentage) / 100 ));
    uint amountForOwner = (amountToMint * founderPercentage) / 100 ;

    _mint(msg.sender,  amountForSender);
    _mint(owner(), amountForOwner);
    uint minted = amountForSender + amountForOwner;
		_minted(minted);// Because of rounding errors, this is preferable than using amountToMint
    emit Minted(msg.sender, minted, amountForSender, amountForOwner);
  }

  function changeFounderPercentage(uint8 _newPercentage) onlyOwner external {
    require(_newPercentage <= 100);
    founderPercentage = _newPercentage;
  }

  function withdraw(uint256 _amount) external {
    if(balanceOf(msg.sender) < _amount) revert("not enough tokens to withdraw");
    uint256 _cashOutAmount = (_amount * address(this).balance).div(totalMinted);
    address payable _receiver = payable(msg.sender);
    _receiver.transfer(_cashOutAmount);
    _burn(_receiver, _amount);
  }

  function getEthBalance() public view returns (uint256) {
    return address(this).balance;
  }

  function calculateStakeReturns(uint256 _amount) public view returns (uint256, uint256){
    uint amountToMint = (_amount / (totalMinted * 1000000)).sqrt();

    if(amountToMint == 0) revert("not enough ETH for minting a token");

    uint amountForSender = (amountToMint * (100 - founderPercentage) / 100 );
    uint amountForOwner = (amountToMint * founderPercentage) / 100 ;
    return (amountForSender, amountForOwner);
  }

}
