//SPDX-License-Identifier: Unlicensed

pragma solidity ^0.8.6;

import "./CappedToken.sol";

/**
 * @title ExposedCappedToken
 * @author Javier Gonzalez and Marco Huberts
 * @dev Exposure of CappedToken. Implementation of an (unlimited) supply cap.
 * @notice CappedToken inherits the ERC20 functionality and prevents
 * minting above the given supply cap if not stated as unlimited.
 */

contract ExposedCappedToken is CappedToken {

  constructor (
    uint256 cap_,
    string memory _name,
    string memory _symbol
  )
    CappedToken(cap_, _name, _symbol)
  {
    if(_cap >= 1 && _cap < maxvalue) {
      cap = _cap;
    } else {
    cap = maxvalue;
    }
  }

  function mint(address to, uint256 amount) public {
    return _mint(to, amount);
  }

  function supplyCap() public {
    return _supplyCap();
  }
}
