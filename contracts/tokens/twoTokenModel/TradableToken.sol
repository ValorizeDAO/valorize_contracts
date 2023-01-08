//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@prb/math/src/UD60x18.sol";
import "contracts/utils/Airdroppable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract TradableToken is ERC20, Airdroppable, AccessControl {

  address public vault;
  uint256 constant DECIMALS = 10**18;

  /**
   * @notice launches the contract and sets the deployer address as admin.
   * @param _vault the address that holds the minted tokens.
   */
  constructor(
    address _vault

  ) ERC20("Tradable Token", "VALOR") {
    vault = _vault;
    _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
  }

  /**
   * @dev creates a new airdrop given a merkleroot and time limit
   * @param _merkleRoot hash of the root of the merkle tree
   * @param _timeLimit the amount of time the airdrop is active  
   */  
  function newAirdrop(bytes32 _merkleRoot, uint256 _timeLimit) external onlyRole(DEFAULT_ADMIN_ROLE)
      returns (uint256 airdropId)
  {
      return _newAirdrop(_merkleRoot, _timeLimit);
  }

  /**
  * @dev allows another address to receive the admin role. Can only be called by an admin.
  * @param newAdminAddress the address of the new admin.
  */
  function addAdmin(address newAdminAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(!hasRole(DEFAULT_ADMIN_ROLE, newAdminAddress), "Address has admin role already");
    grantRole(DEFAULT_ADMIN_ROLE, newAdminAddress);
  }

  /**
  * @dev calculates and returns the amount of tokens that will be minted over time.
  * @param input the number that determines the amount of tokens that will be minted
  */
  function _calculateMintAmount(uint256 input) internal pure returns (uint256) {
      
  uint256 mintAmount = DECIMALS * uint256(
    fromUD60x18(div(
      sqrt(log10(toUD60x18(input))),
      sqrt(log10(toUD60x18(2))))));
          
    return mintAmount;
  }

  /**
   * @dev mints a certain amount of tokens based on the _calculateMintAmount function. This function was described 
   * here: https://www.notion.so/valorize/Two-Token-Model-Proposal-f8b992423cbb4a73859181371c65b53d
   * @param input the number that determines how many tokens will be minted.
   */
  function mint(uint256 input) public onlyRole(DEFAULT_ADMIN_ROLE) {
    _mint(vault, _calculateMintAmount(input));
  }
}