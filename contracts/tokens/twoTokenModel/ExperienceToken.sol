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
contract ExperienceToken is IERC20, Context, AccessControl, Airdroppable {

    mapping(address => uint256) public _exptBalances;
    mapping(address => bool) public _contributors;

    uint256 public totalSupplyExpt;

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

    function newAirdrop(bytes32 _merkleRoot, uint256 _timeLimit) external onlyRole(DEFAULT_ADMIN_ROLE)
        returns (uint256 airdropId)
    {
        return _newAirdrop(_merkleRoot, _timeLimit);
    }

    function addAdmin(address newAdmin) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!hasRole(DEFAULT_ADMIN_ROLE, newAdmin), "Address has admin role already");
        grantRole(DEFAULT_ADMIN_ROLE, newAdmin);
    }

    function mint(uint256 amount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _mint(amount);
    }

    /**
    * @dev Mints tokens to the contract
    * @param amount of tokens that will be minted per year
    */
    function _mint(uint256 amount) internal {

        uint256 exptAmount = amount * amount;
        
        _beforeTokenTransfer(address(0), address(this), exptAmount);
        
        totalSupplyExpt += exptAmount;
        _exptBalances[address(this)] += exptAmount;

        emit Mint(address(0), address(this), exptAmount);
        
        _afterTokenTransfer(address(0), address(this), exptAmount);
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
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()));
        require(_exptBalances[address(this)] >= amount, "{address(this)} address holds less EXP than {amount}.");
        _exptBalances[address(this)] -= amount;
        _exptBalances[receiver] += amount;
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