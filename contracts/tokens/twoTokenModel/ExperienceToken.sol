//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "contracts/utils/Airdroppable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@prb/math/src/UD60x18.sol";

/**
@title Experience Token
@author Marco Huberts
@dev Implementation of an Experience Token.
*/

/*
How to have a recurring mint for a vault and no transfer function to distribute tokens to contributors
OR just the mint function that transfers funds 
*/
contract ExperienceToken is Context, AccessControl, Airdroppable {

    mapping(address => uint256) _balances;
    mapping(address => bool) public _contributors;

    uint256 public totalSupply;

    event Mint(address issuer, address receiver, uint256 amount);
    event Transfer(address receiver, uint256 amount);

    string public name;
    string public symbol;

    constructor()
    {
        name = "ExperienceToken";
        symbol = "EXPT";
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    // function newAirdrop(bytes32 _merkleRoot, uint256 _timeLimit) external onlyRole(DEFAULT_ADMIN_ROLE)
    //     returns (uint256 airdropId)
    // {
    //     return _newAirdrop(_merkleRoot, _timeLimit);
    // }

    function addAdmin(address newAdmin) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!hasRole(DEFAULT_ADMIN_ROLE, newAdmin), "Address has admin role already");
        grantRole(DEFAULT_ADMIN_ROLE, newAdmin);
    }

    function mint(uint256 amount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 exptAmount = amount * amount;
        _mint(exptAmount);
    }

    /**
    * @dev Mints tokens to the contract
    * @param amount of tokens that will be minted per year
    */
    function _mint(uint256 amount) internal {
        
        _beforeTokenTransfer(address(0), address(this), amount);
        
        totalSupplyExpt += amount;
        _exptBalances[address(this)] += amount;

        emit Mint(address(0), address(this), amount);
        
        _afterTokenTransfer(address(0), address(this), amount);
    }

    function addContributors(address[] memory contributors) public {
        for(uint256 i=0; i < contributors.length; i++) {
            _contributors[contributors[i]] = true;
        }
    }

    /**
    * @dev Transfer of tokens from smart contract to contributors. 
    *      Can only be invoked by Valorize's Core Team. 
    * @param receiver address of the contributor that is eglible to receive tokens.
    */
    function transfer(address receiver, uint256 amount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_contributors[receiver] == true, "{receiver} is not a contributor");
        require(_balances[address(this)] >= amount, "{address(this)} address holds less EXP than {amount}.");
        _balances[address(this)] -= amount;
        _balances[receiver] += amount;
        emit Transfer(receiver, amount);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual {}

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual {}

}