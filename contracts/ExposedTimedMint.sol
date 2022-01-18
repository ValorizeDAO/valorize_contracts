//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.6;

import "./Erc20TimedMint.sol";

/**
 * @title ERC20TimedMint
 * @author Javier Gonzalez and Marco Huberts
 * @dev Implementation of minting functionality for a mintable token.
 * @notice ExposedTimedMint inherits the Erc20TimedMint functionality
 * and prevents minting within a timeframe.
 */

contract ExposedTimedMint is Erc20TimedMint {

  constructor (
        string memory _name,
        string memory _symbol
    )
        Erc20TimedMint(_name, _symbol)
    {

    }

  function mint(address to, uint256 amount) public {
    return _mint(to, amount);
  }

  function setTimeDelay(uint256 _timeDelay) public {
    return _setTimeDelay(_timeDelay);
  }

  function setNextMintTime() public {
    return _setNextMintTime();
  }

  function setMintCap(uint256 _mintCap) public {
    return _setMintCap(_mintCap);
  }
}
