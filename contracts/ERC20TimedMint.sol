//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.6;

import "./@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title ERC20TimedMint
 * @author Javier Gonzalez
 * @dev Implementation of minting functionality for a mintable token.
 * @notice ERC20TimedMint inherits the ERC20 functionality and prevents 
 *         minting within a timeframe.
 */
contract ERC20TimedMint is ERC20 {
    uint256 timeUntilNexMint

    constructor(
        string memory name,
        string memory symbol,
        uint256 _timeDelay
    ) ERC20(name, symbol) {
        timeUntilNexMint = block.timeStamp + _timeDelay
    }
}
