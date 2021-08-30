// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../@openzeppelin/contracts/utils/math/SafeMath.sol";

// Bonding Curve based on a square root curve y = m * (x ^ 1/2)
// This bonding curve is equivalent to Bancor's Formula where reserve ratio = 2/3
abstract contract BondingCurve {
    using SafeMath for uint256;

    uint256 constant public DECIMALS = 10**18;

    function calculatePurchaseReturn(
        uint256 _totalSupply,
        uint256 _reserveBalance,
        uint256 _reserveRatio,
        uint256 _depositAmount
    )   internal
        pure
        returns (uint256)
    {
        uint256 newTotal = _totalSupply.add(_depositAmount);
        uint256 newPrice = (newTotal * newTotal / DECIMALS) * (newTotal / DECIMALS);

        return sqrt(newPrice) * _reserveRatio - _reserveBalance;
    }

    function calculateSaleReturn(
        uint256 _totalSupply,
        uint256 _reserveBalance,
        uint256 _reserveRatio,
        uint256 _sellAmount
    )   internal
        pure
        returns (uint256)
    {
        uint256 newTotal = _totalSupply.sub(_sellAmount);
        uint256 newPrice = (newTotal * newTotal / DECIMALS) * (newTotal / DECIMALS);

        return _reserveBalance - sqrt(newPrice) * _reserveRatio;
    }

    function sqrt(
      uint256 x
    ) internal pure returns (uint256 y)
    {
        uint256 z = (x.add(1)).div(2);
        y = x;
        while (z < y) {
            y = z;
            z = ((x.div(z)).add(z)).div(2);
        }
    }
}