//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@prb/math/src/UD60x18.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract TradableToken is ERC20, AccessControl {

    constructor() ERC20("Tradable Token", "VALOR") {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    function mint(uint256 amount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        
        uint256 mintAmount = fromUD60x18(
        sqrt(log10(toUD60x18(amount))
        ).div(sqrt(log10(toUD60x18(2)))));

        _mint(_msgSender(), mintAmount);
    }
}