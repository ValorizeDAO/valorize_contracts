//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../curves/BondingCurve.sol";

// import "hardhat/console.sol";

/**
 * @title CreatorToken
 * @author Javier Gonzalez
 * @dev Implementation of a Creator Token.
 * @notice Creator Tokens are the basis of valorize.app. They stake
 *         some amount of ether that can be traded out at any point.
 */
contract CreatorToken is BondingCurve, ERC20, Ownable {
    uint256 immutable initialSupply;
    uint256 private reserveBalance = (10**18);
    uint256 constant reserveRatio = 800000;
    uint256 public founderPercentage;
    bool private reEntranceGuard = false;

    constructor(
        uint256 _initialSupply,
        string memory name,
        string memory symbol,
        address initialOwner
    ) ERC20(name, symbol) {
        if (_initialSupply > 0) {
            _mint(msg.sender, _initialSupply);
            reserveBalance + _initialSupply;
        }
        initialSupply = _initialSupply;
        founderPercentage = 10;
        if (initialOwner != msg.sender) {
            transferOwnership(initialOwner);
        }
    }

    event Burned(address _To, uint256 _amountMinted, uint256 _amountDeposited);

    event Distributed(
        address buyer,
        uint256 deposited,
        uint256 amountMinted,
        uint256 amountDistributedToBuyer,
        uint256 amountDistributedToOwner
    );

    /**
     * @dev the minting mechanism requires a 'deposit' of ETH into
     *       the contract in order to generate a new token. The minted tokens
     *       are then distributed to the buyer and the owner according to the
     *       founderPercentage.
     **/
    function buyNewTokens() external payable {
        require(msg.value > 0, "Must send ETH to buy tokens");
        uint256 amountToMint = calculateTotalMintAmount(msg.value);
        _mintAndDistribute(amountToMint, msg.value);
    }

    /**
     * @dev the sell mechanism also based on Bancor sells tokens directly
     *      to the contract which then burns them in exchange for eth.
     **/
    function sellTokensForEth(uint256 _amount) external {
        require(_amount > 0, "amount required");
        require(balanceOf(msg.sender) >= _amount, "not enough tokens");
        require(!reEntranceGuard);
        reEntranceGuard = true;

        uint256 reimburseAmount = calculateTotalSaleReturn(_amount);
        if (payable(msg.sender).send(reimburseAmount)) {
            reserveBalance = reserveBalance - reimburseAmount;
            _burn(msg.sender, _amount);
            emit Burned(msg.sender, _amount, reimburseAmount);
        } else {
            revert("failed");
        }

        reEntranceGuard = false;
    }

    /**
     * @dev tokens get ditributed according to the percentage defined by founderPercentage
     **/
    function _mintAndDistribute(uint256 amountToMint, uint256 _deposit)
        internal
    {
        (
            uint256 amountForSender,
            uint256 amountForOwner
        ) = splitAmountToFounderAndBuyer(amountToMint, founderPercentage);
        _mint(msg.sender, amountForSender);

        _mint(owner(), amountForOwner);

        uint256 minted = amountForSender + amountForOwner; // Because of rounding errors, this is preferable than using amountToMint
        reserveBalance = reserveBalance + _deposit;
        emit Distributed(
            msg.sender,
            _deposit,
            minted,
            amountForSender,
            amountForOwner
        );
    }

    function calculateTotalMintAmount(uint256 _deposit)
        internal
        view
        returns (uint256)
    {
        return
            calculatePurchaseReturn(
                totalSupply(),
                checkAndReturnInitialContractBalance(
                    _deposit,
                    address(this).balance
                ),
                uint32(reserveRatio),
                _deposit
            );
    }

    function checkAndReturnInitialContractBalance(
        uint256 _amountToDeposit,
        uint256 balanceToCheckAgainst
    ) internal view returns (uint256 _amountToUseAsTokenBalance) {
        _amountToUseAsTokenBalance = balanceToCheckAgainst;
        if (_amountToUseAsTokenBalance == _amountToDeposit) {
            // square root of initial deposit amount, this is bitwise shifted by 32
            // to define the price of the token when there is no reserve ratio to compare it to
            uint8 temp;
            uint256 tempAmount;
            (tempAmount, temp) = power(_amountToDeposit, 1, 1, 2);
            _amountToUseAsTokenBalance = tempAmount >> 32;
        }
    }

    function calculateTotalSaleReturn(uint256 _amount)
        public
        view
        returns (uint256)
    {
        require(address(this).balance > 0, "buy tokens first");
        return
            calculateSaleReturn(
                totalSupply(),
                address(this).balance,
                uint32(reserveRatio),
                _amount
            );
    }

    function changeFounderPercentage(uint256 _newPercentage)
        external
        onlyOwner
    {
        require(_newPercentage <= 100, "percentage > 100");
        founderPercentage = _newPercentage;
    }

    function calculateTokenBuyReturns(uint256 _amount)
        public
        view
        returns (uint256, uint256)
    {
        uint256 _amountToMint = calculatePurchaseReturn(
            totalSupply(),
            checkAndReturnInitialContractBalance(
                _amount,
                (address(this).balance + _amount)
            ), //Need to add the amount to the balance in case this is the first deposit
            uint32(reserveRatio),
            _amount
        );
        return splitAmountToFounderAndBuyer(_amountToMint, founderPercentage);
    }

    function splitAmountToFounderAndBuyer(uint256 amount, uint256 percentage)
        internal
        pure
        returns (uint256 amountForSender, uint256 amountForOwner)
    {
        amountForSender = (amount * (100 - percentage)) / 100;
        amountForOwner = (amount * percentage) / 100;
    }
}
