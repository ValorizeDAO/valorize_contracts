//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./ExperienceToken.sol";
import "./TradableToken.sol";
import "@prb/math/src/UD60x18.sol";

contract TokenSwap is ExperienceToken, TradableToken, Context {

    uint256 constant CONSTANT = 100000;
    IERC20 public TradableToken;

    event Swap(address contributor, uint256 amountIn, uint256 amountOut);

    constructor() {

    }

    function swap(uint256 amountIn) public {
        require(_msgSender() >= amountIn, "Not enough experience tokens"); 
        
        uint256 completeSupply = TradableToken.totalSupply() + ExperienceToken.totalSupplyExpt();
        
        uint256 amountOut = (CONSTANT * amountIn * sqrt(log10(toUD60x18(amountIn)))
        ).div(completeSupply * sqrt(log10(toUD60x18(2))));
        
        require(amountOut >= TradableToken.totalSupply(), "Received amount larger than total supply");

        ExperienceToken._balances[_msgSender()] -= amountIn;
        TradableToken._balances[_msgSender()] += amountOut; 
        
        Swap(_msgSender, amountIn, amountOut);
    }
}
