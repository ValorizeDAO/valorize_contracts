//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.6;

import "@openzeppelin/contracts/access/Roles.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import "hardhat/console.sol";

/**
 * @title Vested Token
 * @author Javier Gonzalez
 * @dev Implementation of a Vested Token.
 * @notice Vested Token is a token that can be minted and vested.
 *         Has a percentage immediately available to the owner, 
 *         the mint function is only callable by a multisig and mints tokens
 *         that are vested for a timelocked period with a cliff.
 *         i.e. TotalSupply is 100,000,000,000 tokens,
 *              owner recieves 20% immediately,
 *              owner can mint 20,000,000 tokens for a timelocked period of 1 year,
 *              the rest of the 80% is vested for 4 years with a cliff of 1 year.
 */
contract VestedToken is ERC20 {

}
