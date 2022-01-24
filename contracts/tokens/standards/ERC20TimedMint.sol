//SPDX-License-Identifier: Unlicensed

pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
/**
 * @title ERC20TimedMint
 * @author Javier Gonzalez and Marco Huberts
 * @dev Implementation of minting functionality for a mintable token.
 * @notice ERC20TimedMint inherits the ERC20 functionality and prevents
  *         minting within a timeframe.
  */
abstract contract Erc20TimedMint is ERC20 {

    uint256 public supplyCap;
    uint256 public timeUntilNextMint;
    uint256 public mintCap;
    uint256 public timeDelay;
    bool public timeDelayActive = false;

    constructor (
        uint256 cap,
        string memory name,
        string memory symbol
    )
        ERC20(name, symbol)
    {
        if(cap == 0) {
          supplyCap = 2**256-1;
        } else {
          supplyCap = cap; //
        }
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20)
    {
        require(ERC20.totalSupply() + amount <= supplyCap, "CappedToken: cap exceeded");

        if(timeDelayActive) {
          require(block.timestamp >= timeUntilNextMint, "ERC20: Cannot mint yet");
          require(amount <= mintCap, "ERC20: Mint exceeds maximum amount");
          _setNextMintTime();
        }
        super._mint(to, amount);
    }
    /**
     * @dev Function has no guards against setting multiple time delays
     * in one minting period
     */
    function _setTimeDelay(uint256 _timeDelay) internal {
        require(_timeDelay > 0, "time delay must be greater than zero");
        timeDelay = _timeDelay;
        _setNextMintTime();
        if(!timeDelayActive) {
          timeDelayActive = true;
        }
    }

    function _setNextMintTime() internal {
        timeUntilNextMint = block.timestamp + timeDelay;
    }

    function _setMintCap(uint256 _mintCap) internal {
        mintCap = _mintCap;
    }
}
