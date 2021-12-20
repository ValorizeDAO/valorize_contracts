// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/access/Ownable.sol"; //not 100% necessary I think, just a modifier would suffice as well
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract VALORTimedMint is ERC20, Ownable {

    uint256 public timeUntilNextMint;
    uint256 public claimPeriod;
    uint256 private mintCap;

    event Claim(address claimant, uint256 amount);
    
    constructor(
        uint256 _mintCap,
        uint256 _timeDelay,
        uint256 mintAmount
    )   
        ERC20("VALORIZEDAO", "VALOR") 
    {
        timeUntilNextMint = block.timestamp + _timeDelay;
        claimPeriod = timeUntilNextMint + 60 days; //subject to change
        mintCap = _mintCap;
        _mint(address(this), mintAmount);
    }

    function mint(address destination, uint256 amount) external onlyOwner {
        require(block.timestamp >= timeUntilNextMint, "VALOR: Cannot mint yet");
        require(amount <= mintCap, "VALOR: Mint exceeds maximum amount");
        require(destination == address(this)); //I think this is unnecessary we shouldn't mess up the destination address but this could revert it anyway
        _mint(destination, amount);
    } 

    function claimTokens(uint256 amount, address _receiver) external {
        require(block.timestamp < claimPeriod, "VALOR: Claim period has not ended yet");
        require(_receiver == msg.sender); 
        _transfer(address(this), msg.sender, amount);
        emit Claim(msg.sender, amount);
    }

    function viewTimeUntilNextmint() view external returns (uint256) { 
        return timeUntilNextMint;
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20)
    {
        super._mint(to, amount);
    }

    function _afterTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20)
    {
        super._afterTokenTransfer(from, to, amount);
    }

}


