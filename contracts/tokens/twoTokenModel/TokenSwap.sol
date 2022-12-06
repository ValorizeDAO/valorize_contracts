//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./ExperienceToken.sol";
import "./TradableToken.sol";
import "@prb/math/src/UD60x18.sol";

contract TokenSwap is Context {

    uint256 constant CONSTANT = 100000;
    IERC20 public ExperienceToken;
    IERC20 public TradableToken;


    constructor() {

    }

    function swap(uint256 amountIn) public {
        require(_msgSender() == owner1 || _msgSender() == owner2, "Not authorized");
        ExperienceToken._burn(_msgSender(), amountIn);
        uint256 completeSupply = TradableToken.totalSupply() + ExperienceToken.totalSupplyExpt();
        uint256 amountOut = (CONSTANT * amountIn * sqrt(log10(toUD60x18(amountIn)))
        ).div(completeSupply * sqrt(log10(toUD60x18(2))));

    }
}
