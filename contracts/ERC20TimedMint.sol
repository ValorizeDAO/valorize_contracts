//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
/**
 * @title ERC20TimedMint
 * @author Javier Gonzalez and Marco Huberts
 * @dev Implementation of minting functionality for a mintable token.
 * @notice ERC20TimedMint inherits the ERC20 functionality and prevents
  *         minting within a timeframe.
  */
contract ERC20TimedMint is ERC20 {

    uint256 public timeUntilNextMint;
    uint256 internal mintCap;
    uint256 internal timeDelay;

    constructor (
        string memory name,
        string memory symbol
    )
        ERC20(name, symbol)
    {
        timeUntilNextMint = block.timestamp + timeDelay;
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20)
    {
        require(block.timestamp >= timeUntilNextMint, "ERC20: Cannot mint yet");
        require(amount <= mintCap, "ERC20: Mint exceeds maximum amount");
        super._mint(to, amount);
    }

    function _setTimeUntilNextMint(uint256 _timeDelay) internal {
        timeDelay = _timeDelay;
    }

    function _setMintCap (uint256 _mintCap) internal {
        mintCap = _mintCap;
    }
}
