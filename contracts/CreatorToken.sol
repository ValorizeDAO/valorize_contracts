//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
/**
 * @title CreatorToken
 * @author Javier Gonzalez
 * @dev Implementation of a Creator Token.
 * @notice Creator Tokens are the basis of valorize.app. They stake 
 *         some amount of ether that can be traded out at any point.
 */

contract CreatorToken is ERC20 {
  constructor(uint256 initialSupply, string memory name, string memory symbol) ERC20(name, symbol) {
      _mint(msg.sender, initialSupply);
  }
  // /**
  //   * @dev Tokens can be minted only before minting finished.
  //   */
  // modifier canMint() {
  //     require(!_mintingFinished, "ERC20Mintable: minting is finished");
  // }

  // /**
  //   * @return if minting is finished or not.
  //   */
  // function mintingFinished() public view returns (bool) {
  //     return _mintingFinished;
  // }

  // /**
  //   * @dev Function to mint tokens.
  //   *
  //   * WARNING: it allows everyone to mint new tokens. Access controls MUST be defined in derived contracts.
  //   *
  //   * @param account The address that will receive the minted tokens
  //   * @param amount The amount of tokens to mint
  //   */
  // function mint(address account, uint256 amount) public canMint {
  //     _mint(account, amount);
  // }

  // /**
  //   * @dev Function to stop minting new tokens.
  //   *
  //   * WARNING: it allows everyone to finish minting. Access controls MUST be defined in derived contracts.
  //   */
  // function finishMinting() public canMint {
  //     _finishMinting();
  // }

  // /**
  //   * @dev Function to stop minting new tokens.
  //   */
  // function _finishMinting() internal virtual {
  //     _mintingFinished = true;

  //     emit MintFinished();
  // }
}
