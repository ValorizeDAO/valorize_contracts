//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.6;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SimpleToken is ERC20, AccessControl {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address safe,
        address admin
    ) ERC20(name, symbol) {
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _mint(safe, initialSupply);
    }

    function mint(address _to, uint256 _amount) public onlyAdmin {
        _mint(_to, _amount);
    }

    modifier onlyAdmin() {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Admin Role required to call"
        );
        _;
    }
}
