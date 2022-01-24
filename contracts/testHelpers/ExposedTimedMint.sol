//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.6;

import "../tokens/standards/ERC20TimedMint.sol";

/**
 * @title ExposedTimedMint
 * @author Marco Huberts
 * @dev Exposed contract to test internal functions of ERC20TimedMint
 * @notice ExposedTimedMint inherits the Erc20TimedMint functionality
 * and prevents minting within a timeframe.
 */

contract ExposedTimedMint is Erc20TimedMint {

  constructor (
        uint256 _cap,
        string memory _name,
        string memory _symbol
    )
        Erc20TimedMint(_cap, _name, _symbol)
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
