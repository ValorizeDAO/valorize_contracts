//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

/**
 * @title Math
 * @author Javier Gonzalez
 * @notice Simple Math library to carry out most functions needed in CreatorTokens
 */

library Sqrt {
	function sqrt(uint x) public pure  returns (uint y){
		if (x == 0) return 0;
		else if (x <= 3) return 1;
		uint z = (x + 1) / 2;
		y = x;
		while (z < y){
			y = z;
			z = (x / z + z) / 2;
		}
	}
}
